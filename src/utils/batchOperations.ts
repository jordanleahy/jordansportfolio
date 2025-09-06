import { supabase } from '@/integrations/supabase/client';

type TableName = 'api_usage_tracking' | 'social_media_posts';

interface BatchOperation {
  table: TableName;
  operation: 'insert' | 'update' | 'upsert';
  data: any;
  filter?: Record<string, any>;
}

interface BatchResult {
  success: boolean;
  results: any[];
  errors: string[];
  processingTimeMs: number;
}

export const executeBatchOperations = async (
  operations: BatchOperation[],
  batchSize: number = 10
): Promise<BatchResult> => {
  const startTime = Date.now();
  const results: any[] = [];
  const errors: string[] = [];

  // Group operations by table and operation type for efficiency
  const groupedOps = operations.reduce((acc, op, index) => {
    const key = `${op.table}_${op.operation}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push({ ...op, originalIndex: index });
    return acc;
  }, {} as Record<string, (BatchOperation & { originalIndex: number })[]>);

  // Process each group in batches
  for (const [key, ops] of Object.entries(groupedOps)) {
    for (let i = 0; i < ops.length; i += batchSize) {
      const batch = ops.slice(i, i + batchSize);
      
      try {
        if (batch[0].operation === 'insert') {
          const { data, error } = await supabase
            .from(batch[0].table as any)
            .insert(batch.map(op => op.data));
          
          if (error) throw new Error(error.message);
          results.push(...(data || []));
        } else if (batch[0].operation === 'upsert') {
          const { data, error } = await supabase
            .from(batch[0].table as any)
            .upsert(batch.map(op => op.data));
          
          if (error) throw new Error(error.message);
          results.push(...(data || []));
        } else {
          // For updates, process individually within the batch
          const batchPromises = batch.map(async (op) => {
            let query = supabase.from(op.table as any).update(op.data);
            
            if (op.filter) {
              Object.entries(op.filter).forEach(([key, value]) => {
                query = query.eq(key, value);
              });
            }
            
            return query;
          });
          
          const batchResults = await Promise.allSettled(batchPromises);
          
          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              if (result.value.error) {
                errors.push(`Batch ${key}[${index}]: ${result.value.error.message}`);
              } else {
                results.push(result.value.data);
              }
            } else {
              errors.push(`Batch ${key}[${index}]: ${result.reason}`);
            }
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Batch ${key}: ${errorMessage}`);
      }
    }
  }

  return {
    success: errors.length === 0,
    results,
    errors,
    processingTimeMs: Date.now() - startTime
  };
};

// Utility for batching API usage tracking
export const batchApiUsageTracking = async (
  usageRecords: Array<{
    userId: string;
    functionName: string;
    model: string;
    requestType: string;
    success: boolean;
    estimatedCost: number;
    responseTimeMs?: number;
    metadata?: Record<string, any>;
  }>
): Promise<void> => {
  if (usageRecords.length === 0) return;

  const operations: BatchOperation[] = usageRecords.map(record => ({
    table: 'api_usage_tracking' as TableName,
    operation: 'insert' as const,
    data: {
      user_id: record.userId,
      function_name: record.functionName,
      model_used: record.model,
      request_type: record.requestType,
      success: record.success,
      estimated_cost: record.estimatedCost,
      response_time_ms: record.responseTimeMs,
      request_metadata: record.metadata || {},
      created_at: new Date().toISOString()
    }
  }));

  try {
    await executeBatchOperations(operations, 50); // Larger batch size for tracking
  } catch (error) {
    console.error('Batch API usage tracking failed:', error);
    // Don't throw - tracking failures shouldn't break the main flow
  }
};