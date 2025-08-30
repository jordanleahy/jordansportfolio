import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConcurrencyControlledImageButton } from './ConcurrencyControlledImageButton';
import { RealtimeImageStatusMonitor } from './RealtimeImageStatusMonitor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SocialMediaPost } from '@/types/socialMedia';
import { AlertTriangle, Trash2, RefreshCw } from 'lucide-react';

interface ConcurrencyControlDemoProps {
  post: SocialMediaPost;
}

export const ConcurrencyControlDemo: React.FC<ConcurrencyControlDemoProps> = ({ post }) => {
  const { toast } = useToast();

  const handleCleanupStuckGenerations = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-stuck-generations');
      
      if (error) {
        toast({
          title: "Cleanup failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Cleanup completed",
        description: data?.message || "Cleanup operation completed",
        variant: "default",
      });
    } catch (error) {
      console.error('Cleanup error:', error);
      toast({
        title: "Cleanup failed",
        description: "Failed to run cleanup operation",
        variant: "destructive",
      });
    }
  };

  const aspectRatios = ['1:1', '4:3', '16:9', '9:16', '3:4'];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Concurrency Control Demo
        </CardTitle>
        <CardDescription>
          Test concurrent image generation across multiple tabs. Only one generation per aspect ratio can run at a time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">How to test concurrency control:</h4>
              <ul className="mt-2 text-sm text-amber-700 list-disc list-inside space-y-1">
                <li>Open this page in multiple browser tabs</li>
                <li>Try clicking the same aspect ratio button in different tabs simultaneously</li>
                <li>Only one generation should start; others should show "Generation in progress"</li>
                <li>Watch real-time status updates across all tabs</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Image Generation Controls</h3>
            <Button
              onClick={handleCleanupStuckGenerations}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Cleanup Stuck
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aspectRatios.map((aspectRatio) => (
              <Card key={aspectRatio} className="p-4">
                <div className="space-y-3">
                  <div className="text-center">
                    <h4 className="font-medium">{aspectRatio} Aspect Ratio</h4>
                  </div>
                  
                  <RealtimeImageStatusMonitor
                    postId={post.id}
                    aspectRatio={aspectRatio}
                    className="justify-center"
                  />
                  
                  <ConcurrencyControlledImageButton
                    post={post}
                    aspectRatio={aspectRatio}
                    size="sm"
                    onImageGenerated={() => {
                      console.log(`Image generated for ${aspectRatio}`);
                    }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Status meanings:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Not started:</strong> Ready to generate</li>
            <li><strong>Generating:</strong> Currently being processed</li>
            <li><strong>Complete:</strong> Successfully generated</li>
            <li><strong>Failed:</strong> Generation failed, can retry</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};