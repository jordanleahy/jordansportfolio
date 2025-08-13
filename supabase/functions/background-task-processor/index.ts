import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface BackgroundTask {
  id: string;
  type: 'watermark' | 'optimization' | 'analytics' | 'cleanup';
  payload: any;
  priority: 'low' | 'normal' | 'high';
  scheduledAt: number;
  attempts: number;
  maxAttempts: number;
}

// In-memory task queue
const taskQueue: BackgroundTask[] = [];
const processingTasks = new Set<string>();
const taskHistory = new Map<string, { status: string; completedAt: number; error?: string }>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, task } = await req.json();

    switch (action) {
      case 'schedule':
        return await scheduleTask(task);
      case 'process':
        return await processNextTask();
      case 'status':
        return await getTaskStatus(task?.id);
      case 'queue_status':
        return await getQueueStatus();
      case 'cleanup':
        return await cleanupCompletedTasks();
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Background processing error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function scheduleTask(taskData: Omit<BackgroundTask, 'id' | 'scheduledAt' | 'attempts'>) {
  const task: BackgroundTask = {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    scheduledAt: Date.now(),
    attempts: 0,
    ...taskData
  };

  // Insert task based on priority
  const insertIndex = taskQueue.findIndex(t => 
    getPriorityValue(t.priority) < getPriorityValue(task.priority)
  );
  
  if (insertIndex === -1) {
    taskQueue.push(task);
  } else {
    taskQueue.splice(insertIndex, 0, task);
  }

  console.log(`📋 Scheduled background task: ${task.type} (${task.id})`);

  // Start processing if queue was empty
  if (taskQueue.length === 1 && processingTasks.size === 0) {
    EdgeRuntime.waitUntil(processTaskQueue());
  }

  return new Response(JSON.stringify({
    success: true,
    taskId: task.id,
    queuePosition: insertIndex === -1 ? taskQueue.length - 1 : insertIndex
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function processNextTask() {
  if (taskQueue.length === 0) {
    return new Response(JSON.stringify({
      success: true,
      message: 'No tasks in queue'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const task = taskQueue.shift()!;
  processingTasks.add(task.id);

  try {
    console.log(`🔄 Processing background task: ${task.type} (${task.id})`);
    
    const result = await executeTask(task);
    
    taskHistory.set(task.id, {
      status: 'completed',
      completedAt: Date.now()
    });

    console.log(`✅ Background task completed: ${task.type} (${task.id})`);

    return new Response(JSON.stringify({
      success: true,
      taskId: task.id,
      result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`❌ Background task failed: ${task.type} (${task.id})`, error);
    
    task.attempts++;
    
    if (task.attempts < task.maxAttempts) {
      // Retry with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, task.attempts), 30000);
      setTimeout(() => {
        taskQueue.unshift(task); // Add back to front of queue
      }, delay);
      
      console.log(`🔄 Retrying task ${task.id} in ${delay}ms (attempt ${task.attempts + 1}/${task.maxAttempts})`);
    } else {
      taskHistory.set(task.id, {
        status: 'failed',
        completedAt: Date.now(),
        error: error.message
      });
    }

    return new Response(JSON.stringify({
      success: false,
      taskId: task.id,
      error: error.message,
      willRetry: task.attempts < task.maxAttempts
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } finally {
    processingTasks.delete(task.id);
  }
}

async function executeTask(task: BackgroundTask): Promise<any> {
  switch (task.type) {
    case 'watermark':
      return await processWatermarkTask(task.payload);
    case 'optimization':
      return await processOptimizationTask(task.payload);
    case 'analytics':
      return await processAnalyticsTask(task.payload);
    case 'cleanup':
      return await processCleanupTask(task.payload);
    default:
      throw new Error(`Unknown task type: ${task.type}`);
  }
}

async function processWatermarkTask(payload: any) {
  const { postId, imageUrl, watermarkText } = payload;
  
  console.log(`🔧 Processing watermark for post ${postId}`);
  
  // Update status to processing
  await supabase
    .from('social_media_posts')
    .update({ image_1_1_watermark_status: 'processing' })
    .eq('id', postId);

  // Simulate watermarking process (in real implementation, this would apply watermark)
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Update with completed status
  await supabase
    .from('social_media_posts')
    .update({ 
      image_1_1_watermark_status: 'complete',
      image_1_1_watermark_url: imageUrl // Would be the watermarked URL
    })
    .eq('id', postId);

  return { postId, watermarked: true };
}

async function processOptimizationTask(payload: any) {
  const { postId, imageUrl, optimizations } = payload;
  
  console.log(`⚡ Processing optimizations for post ${postId}`);
  
  // Simulate image optimization (compression, format conversion, etc.)
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Update with optimized versions
  const optimizedUrls = {
    webp: `${imageUrl}_optimized.webp`,
    avif: `${imageUrl}_optimized.avif`,
    compressed: `${imageUrl}_compressed.jpg`
  };

  await supabase
    .from('social_media_posts')
    .update({ 
      optimized_image_urls: optimizedUrls,
      optimization_status: 'complete'
    })
    .eq('id', postId);

  return { postId, optimized: true, formats: Object.keys(optimizedUrls) };
}

async function processAnalyticsTask(payload: any) {
  const { postId, event, metadata } = payload;
  
  console.log(`📊 Processing analytics for post ${postId}`);
  
  // Store analytics event
  await supabase
    .from('post_analytics')
    .insert({
      post_id: postId,
      event_type: event,
      metadata,
      timestamp: new Date().toISOString()
    });

  // Update aggregated metrics
  const { data: existing } = await supabase
    .from('post_metrics')
    .select('*')
    .eq('post_id', postId)
    .single();

  if (existing) {
    await supabase
      .from('post_metrics')
      .update({
        total_events: existing.total_events + 1,
        last_activity: new Date().toISOString()
      })
      .eq('post_id', postId);
  } else {
    await supabase
      .from('post_metrics')
      .insert({
        post_id: postId,
        total_events: 1,
        last_activity: new Date().toISOString()
      });
  }

  return { postId, eventProcessed: event };
}

async function processCleanupTask(payload: any) {
  const { type, olderThan } = payload;
  
  console.log(`🧹 Processing cleanup task: ${type}`);
  
  const cutoffDate = new Date(Date.now() - olderThan).toISOString();
  let deletedCount = 0;

  switch (type) {
    case 'temp_files':
      // Cleanup temporary files from storage
      const { data: tempFiles } = await supabase.storage
        .from('temp-files')
        .list('', { limit: 1000 });
      
      if (tempFiles) {
        const oldFiles = tempFiles.filter(file => 
          new Date(file.created_at || file.updated_at!) < new Date(cutoffDate)
        );
        
        for (const file of oldFiles) {
          await supabase.storage.from('temp-files').remove([file.name]);
          deletedCount++;
        }
      }
      break;

    case 'error_logs':
      // Cleanup old error logs
      const { data: deletedLogs } = await supabase
        .from('error_logs')
        .delete()
        .lt('created_at', cutoffDate)
        .select('count');
      
      deletedCount = deletedLogs?.length || 0;
      break;

    case 'cache_entries':
      // Cleanup expired cache entries
      const { data: deletedCache } = await supabase
        .from('prompt_cache')
        .delete()
        .lt('created_at', cutoffDate)
        .select('count');
      
      deletedCount = deletedCache?.length || 0;
      break;
  }

  return { type, deletedCount, cutoffDate };
}

async function processTaskQueue() {
  console.log('🚀 Starting background task queue processing');
  
  while (taskQueue.length > 0) {
    try {
      await processNextTask();
      
      // Small delay between tasks to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Task queue processing error:', error);
      // Continue processing other tasks
    }
  }
  
  console.log('✅ Background task queue processing completed');
}

async function getTaskStatus(taskId: string) {
  const queuePosition = taskQueue.findIndex(task => task.id === taskId);
  const isProcessing = processingTasks.has(taskId);
  const history = taskHistory.get(taskId);

  return new Response(JSON.stringify({
    success: true,
    taskId,
    status: isProcessing ? 'processing' : 
            queuePosition >= 0 ? 'queued' : 
            history ? history.status : 'not_found',
    queuePosition: queuePosition >= 0 ? queuePosition : null,
    isProcessing,
    history
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getQueueStatus() {
  return new Response(JSON.stringify({
    success: true,
    queueLength: taskQueue.length,
    processingCount: processingTasks.size,
    completedCount: Array.from(taskHistory.values()).filter(h => h.status === 'completed').length,
    failedCount: Array.from(taskHistory.values()).filter(h => h.status === 'failed').length,
    tasksByType: taskQueue.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function cleanupCompletedTasks() {
  const cutoffTime = Date.now() - 3600000; // 1 hour ago
  let cleanedCount = 0;

  for (const [taskId, history] of taskHistory.entries()) {
    if (history.completedAt < cutoffTime) {
      taskHistory.delete(taskId);
      cleanedCount++;
    }
  }

  return new Response(JSON.stringify({
    success: true,
    cleanedCount,
    remainingHistorySize: taskHistory.size
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function getPriorityValue(priority: 'low' | 'normal' | 'high'): number {
  switch (priority) {
    case 'high': return 3;
    case 'normal': return 2;
    case 'low': return 1;
    default: return 1;
  }
}