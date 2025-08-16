import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUnifiedRealtime } from '@/hooks/useUnifiedRealtime';
import { supabase } from '@/integrations/supabase/client';

export const RealtimeThemeTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [realtimeEvents, setRealtimeEvents] = useState<any[]>([]);

  const addLog = (message: string) => {
    console.log(`🧪 TEST: ${message}`);
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Monitor realtime events
  useUnifiedRealtime({
    enabled: true,
    userId: '3e7858df-9613-4285-98d2-ffb818c26f6d', // Test user ID from the data
    onThemeStatusUpdate: (theme) => {
      addLog(`📡 REALTIME: Theme status update received - ID: ${theme.id}, Status: ${theme.prompt_generation_status}`);
      setRealtimeEvents(prev => [...prev, {
        timestamp: new Date().toISOString(),
        type: 'theme_status_update',
        data: theme
      }]);
    }
  });

  const testThemeUpdate = async () => {
    addLog('🚀 Starting theme update test...');
    
    try {
      // Get a theme to test with
      const { data: themes, error: fetchError } = await supabase
        .from('themes')
        .select('*')
        .eq('user_id', '3e7858df-9613-4285-98d2-ffb818c26f6d')
        .limit(1);

      if (fetchError) {
        addLog(`❌ Error fetching themes: ${fetchError.message}`);
        return;
      }

      if (!themes || themes.length === 0) {
        addLog('❌ No themes found for testing');
        return;
      }

      const testTheme = themes[0];
      addLog(`📝 Found test theme: ${testTheme.theme_name} (${testTheme.id})`);

      // Test update - change status temporarily
      const currentStatus = testTheme.prompt_generation_status;
      const testStatus = currentStatus === 'completed' ? 'in_progress' : 'completed';
      
      addLog(`🔄 Updating theme status from '${currentStatus}' to '${testStatus}'`);
      
      const { error: updateError } = await supabase
        .from('themes')
        .update({ 
          prompt_generation_status: testStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', testTheme.id);

      if (updateError) {
        addLog(`❌ Error updating theme: ${updateError.message}`);
        return;
      }

      addLog(`✅ Theme updated successfully, waiting for realtime event...`);

      // Revert back after 3 seconds
      setTimeout(async () => {
        addLog(`🔄 Reverting theme status back to '${currentStatus}'`);
        
        const { error: revertError } = await supabase
          .from('themes')
          .update({ 
            prompt_generation_status: currentStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', testTheme.id);

        if (revertError) {
          addLog(`❌ Error reverting theme: ${revertError.message}`);
        } else {
          addLog(`✅ Theme reverted successfully`);
        }
      }, 3000);

    } catch (error) {
      addLog(`❌ Test failed: ${error}`);
    }
  };

  const clearLogs = () => {
    setTestResults([]);
    setRealtimeEvents([]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Realtime Theme Subscription Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testThemeUpdate}>
            Test Theme Update
          </Button>
          <Button onClick={clearLogs} variant="outline">
            Clear Logs
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">📋 Test Logs</h3>
            <div className="bg-muted p-3 rounded-md h-64 overflow-y-auto font-mono text-sm">
              {testResults.length === 0 ? (
                <p className="text-muted-foreground">No logs yet...</p>
              ) : (
                testResults.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">📡 Realtime Events</h3>
            <div className="bg-muted p-3 rounded-md h-64 overflow-y-auto font-mono text-sm">
              {realtimeEvents.length === 0 ? (
                <p className="text-muted-foreground">No realtime events yet...</p>
              ) : (
                realtimeEvents.map((event, index) => (
                  <div key={index} className="mb-2 p-2 bg-background rounded border">
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="font-semibold">{event.type}</div>
                    <div className="text-xs">
                      Theme: {event.data.theme_name || event.data.id}
                    </div>
                    <div className="text-xs">
                      Status: {event.data.prompt_generation_status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <h4 className="font-semibold">Test Instructions:</h4>
          <ol className="list-decimal list-inside space-y-1 mt-1">
            <li>Click "Test Theme Update" to simulate a theme status change</li>
            <li>Watch the logs for database update confirmation</li>
            <li>Watch the realtime events panel for incoming subscription data</li>
            <li>The theme status will be reverted after 3 seconds</li>
            <li>If realtime works correctly, you should see events appear instantly</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};