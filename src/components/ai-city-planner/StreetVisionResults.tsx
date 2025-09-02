import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SimpleShimmer } from '@/components/ui/simple-shimmer';
import { UnifiedLoadingIndicator } from '@/components/ui/unified-loading-indicator';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';

interface StreetVisionRecord {
  id: string;
  user_prompt: string;
  original_image_url: string;
  transformed_image_url?: string;
  vision_analysis?: string;
  status: 'pending' | 'analyzing' | 'generating' | 'completed' | 'failed';
  error_message?: string;
  processing_time_ms?: number;
}

interface StreetVisionResultsProps {
  record: StreetVisionRecord | null;
  isProcessing: boolean;
  error: string | null;
  originalImageUrl?: string;
  onRetry?: () => void;
}

const getStatusMessage = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Initializing processing...';
    case 'analyzing':
      return 'Analyzing street conditions...';
    case 'generating':
      return 'Generating transformation...';
    case 'completed':
      return 'Processing complete!';
    case 'failed':
      return 'Processing failed';
    default:
      return 'Processing...';
  }
};

export const StreetVisionResults: React.FC<StreetVisionResultsProps> = ({
  record,
  isProcessing,
  error,
  originalImageUrl,
  onRetry
}) => {
  if (!record && !isProcessing) return null;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="space-y-6">
          
          {/* Status Indicator */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-foreground">Street Transformation</h2>
            {isProcessing && record && (
              <UnifiedLoadingIndicator
                isVisible={true}
                variant="inline"
                message={getStatusMessage(record.status)}
                size="sm"
              />
            )}
          </div>

          {/* Images Side by Side */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Original Image */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Original Street</h3>
              {originalImageUrl || record?.original_image_url ? (
                <div className="relative rounded-lg overflow-hidden border border-border bg-card aspect-video">
                  <img 
                    src={originalImageUrl || record?.original_image_url}
                    alt="Original street"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <SimpleShimmer 
                  aspectRatio="16/9" 
                  className="rounded-lg border border-border"
                />
              )}
            </div>

            {/* Transformed Image */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Transformed Vision</h3>
              {record?.transformed_image_url ? (
                <div className="relative rounded-lg overflow-hidden border border-border bg-card aspect-video group">
                  <img 
                    src={record.transformed_image_url}
                    alt="Transformed street"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = record.transformed_image_url!;
                        link.download = 'street-transformation.png';
                        link.click();
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : isProcessing || (record && record.status !== 'failed') ? (
                <SimpleShimmer 
                  aspectRatio="16/9" 
                  className="rounded-lg border border-border"
                />
              ) : (
                <div className="aspect-video rounded-lg border border-border bg-muted/30 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <p className="text-muted-foreground">No transformation available</p>
                    {onRetry && (
                      <Button variant="outline" size="sm" onClick={onRetry}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Prompt */}
          {record?.user_prompt && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Your Vision</h3>
              <div className="bg-accent/5 rounded-lg p-4 border border-accent/20">
                <p className="text-foreground italic">
                  "{record.user_prompt}"
                </p>
              </div>
            </div>
          )}

          {/* Vision Analysis */}
          {record?.vision_analysis && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Analysis & Recommendations</h3>
              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {record.vision_analysis}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-destructive font-medium">Error: {error}</p>
                {onRetry && (
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Processing Stats */}
          {record?.processing_time_ms && record.status === 'completed' && (
            <div className="text-xs text-muted-foreground text-center">
              Processing completed in {(record.processing_time_ms / 1000).toFixed(1)} seconds
            </div>
          )}

        </div>
      </CardContent>
    </Card>
  );
};