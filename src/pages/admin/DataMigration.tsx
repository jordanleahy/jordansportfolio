import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import { migrateAllComparisonsToStructured } from '@/utils/migrationHelpers';
import { supabase } from '@/integrations/supabase/client';

export const DataMigrationPage: React.FC = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string>('');

  const handleMigration = async () => {
    setIsMigrating(true);
    setMigrationStatus('Starting migration...');
    
    try {
      await migrateAllComparisonsToStructured();
      setMigrationStatus('Migration completed successfully!');
      toast.success('All comparisons migrated to structured format');
    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationStatus(`Migration failed: ${error}`);
      toast.error('Migration failed');
    } finally {
      setIsMigrating(false);
    }
  };

  const checkMigrationStatus = async () => {
    try {
      // Check if we have any data in the new structure
      const { data: structuredData, error: structuredError } = await supabase
        .from('comparison_companies')
        .select('*', { count: 'exact', head: true });

      const { data: oldData, error: oldError } = await supabase
        .from('comparisons')
        .select('*', { count: 'exact', head: true });

      if (structuredError || oldError) {
        throw new Error('Failed to check migration status');
      }

      setMigrationStatus(`
        Structured data: ${structuredData?.length || 0} company records
        Total comparisons: ${oldData?.length || 0}
      `);
    } catch (error) {
      console.error('Failed to check status:', error);
      toast.error('Failed to check migration status');
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Data Migration</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Migrate Comparisons to Structured Format</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This will migrate existing comparison data from JSONB format to the new structured tables.
              This is a safe operation that preserves existing data.
            </p>
            
            <div className="flex gap-4">
              <Button 
                onClick={handleMigration} 
                disabled={isMigrating}
                variant="default"
              >
                {isMigrating ? 'Migrating...' : 'Start Migration'}
              </Button>
              
              <Button 
                onClick={checkMigrationStatus} 
                variant="outline"
              >
                Check Status
              </Button>
            </div>
            
            {migrationStatus && (
              <div className="bg-muted p-4 rounded-md">
                <pre className="text-sm">{migrationStatus}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};