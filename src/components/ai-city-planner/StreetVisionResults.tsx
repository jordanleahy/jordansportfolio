/**
 * STREET VISION RESULTS COMPONENT - AI Transformation Results Display
 * 
 * PURPOSE:
 * This component displays the results of street photo AI transformations in a comprehensive
 * and user-friendly format. It shows original vs transformed images side-by-side, displays
 * the user's prompt and AI analysis, and provides download and retry functionality.
 * 
 * DISPLAY FEATURES:
 * - Side-by-side comparison of original and transformed street photos
 * - Real-time processing status indicators with descriptive messages
 * - User's transformation prompt display for reference
 * - GPT-5 vision analysis and recommendations
 * - Processing time statistics when completed
 * - Download functionality for transformed images
 * - Retry mechanism for failed transformations
 * 
 * STATE HANDLING:
 * - Shows loading shimmers during processing phases
 * - Displays appropriate messages for each processing status
 * - Handles error states with user-friendly messages and retry options
 * - Gracefully handles missing or incomplete data
 * 
 * USER EXPERIENCE:
 * - Hover effects reveal download button on transformed images
 * - Clear visual hierarchy with labeled sections
 * - Responsive grid layout for mobile and desktop
 * - Consistent styling with design system tokens
 * 
 * INTEGRATION POINTS:
 * - Receives data from useStreetVisionProcessing hook
 * - Downloads images directly from Supabase storage URLs
 * - Triggers retry functionality through parent component callbacks
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SimpleShimmer } from '@/components/ui/simple-shimmer';
import { UnifiedLoadingIndicator } from '@/components/ui/unified-loading-indicator';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';

/**
 * Database record structure for street vision transformations
 * Contains all data needed for result display and user interaction
 */
interface StreetVisionRecord {
  id: string;                           // Unique record identifier
  user_prompt: string;                  // User's transformation description
  original_image_url: string;           // URL of uploaded street photo
  transformed_image_url?: string;       // URL of AI-generated transformation
  vision_analysis?: string;             // GPT-5's street analysis and recommendations
  status: 'pending' | 'analyzing' | 'generating' | 'completed' | 'failed'; // Processing status
  error_message?: string;               // Error details for user display
  processing_time_ms?: number;          // Total processing duration
}

/**
 * Component props interface defining all required and optional properties
 */
interface StreetVisionResultsProps {
  record: StreetVisionRecord | null;    // Database record with transformation data
  isProcessing: boolean;                // Processing status flag for loading states
  error: string | null;                 // Error message for display
  originalImageUrl?: string;            // Fallback original image URL for immediate display
  onRetry?: () => void;                 // Callback function to retry failed processing
}

/**
 * Converts database status codes into user-friendly messages
 * Used by loading indicators to show current processing phase
 * 
 * @param status - Current processing status from database record
 * @returns User-friendly status message
 */
const getStatusMessage = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Initializing processing...';      // Initial state after edge function call
    case 'analyzing':
      return 'Analyzing street conditions...';   // GPT-5 vision analysis phase
    case 'generating':
      return 'Generating transformation...';     // Image generation phase
    case 'completed':
      return 'Processing complete!';            // Successfully finished
    case 'failed':
      return 'Processing failed';               // Error occurred
    default:
      return 'Processing...';                   // Fallback for unknown states
  }
};

/**
 * Street Vision Results component
 * Displays transformation results with side-by-side image comparison
 * 
 * @param props - Component properties including record data and callbacks
 */
export const StreetVisionResults: React.FC<StreetVisionResultsProps> = ({
  record,          // Database record with transformation data
  isProcessing,    // Processing status for loading states
  error,           // Error message for user display
  originalImageUrl, // Fallback original image URL
  onRetry          // Retry callback function
}) => {
  // Don't render anything if no processing has started
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