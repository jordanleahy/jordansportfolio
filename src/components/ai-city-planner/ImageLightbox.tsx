/**
 * IMAGE LIGHTBOX COMPONENT - Interactive Image Viewer with Coding Confirmation
 * 
 * PURPOSE:
 * This component provides a fullscreen lightbox experience for viewing street transformation
 * images with a confirmation dialog for proceeding to code generation. It displays both
 * original and transformed images side-by-side with clear labeling and action buttons.
 * 
 * FEATURES:
 * - Fullscreen overlay with backdrop blur
 * - Side-by-side image comparison
 * - Confirmation dialog for coding intent
 * - Escape key and backdrop click to close
 * - Responsive design for mobile and desktop
 * - Smooth animations and transitions
 * 
 * INTEGRATION:
 * - Used by StreetVisionResults component
 * - Triggers code generation through callback
 * - Handles image URLs from Supabase storage
 */

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Code, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  originalImageUrl?: string;
  transformedImageUrl?: string;
  userPrompt?: string;
  onConfirmCoding?: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  onClose,
  originalImageUrl,
  transformedImageUrl,
  userPrompt,
  onConfirmCoding
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Reset confirmation state when lightbox closes
  useEffect(() => {
    if (!isOpen) {
      setShowConfirmation(false);
    }
  }, [isOpen]);

  const handleCodeIntent = () => {
    setShowConfirmation(true);
  };

  const handleConfirmCoding = () => {
    onConfirmCoding?.();
    onClose();
  };

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full h-[90vh] p-0">
        <div className="relative h-full flex flex-col">
          
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">Street Transformation Comparison</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Images Content */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="grid md:grid-cols-2 gap-6 h-full">
              
              {/* Original Image */}
              <Card className="h-full">
                <CardContent className="p-4 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-foreground">Original Street</h3>
                    {originalImageUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(originalImageUrl, 'original-street.png')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                  {originalImageUrl ? (
                    <div className="flex-1 min-h-0">
                      <img
                        src={originalImageUrl}
                        alt="Original street"
                        className="w-full h-full object-contain rounded-lg border border-border"
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg border border-border">
                      <p className="text-muted-foreground">Original image not available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transformed Image */}
              <Card className="h-full">
                <CardContent className="p-4 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-foreground">Transformed Vision</h3>
                    {transformedImageUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(transformedImageUrl, 'transformed-street.png')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                  {transformedImageUrl ? (
                    <div className="flex-1 min-h-0">
                      <img
                        src={transformedImageUrl}
                        alt="Transformed street"
                        className="w-full h-full object-contain rounded-lg border border-border"
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg border border-border">
                      <p className="text-muted-foreground">Transformed image not available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* User Prompt Display */}
            {userPrompt && (
              <Card className="mt-6">
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Your Vision</h3>
                  <p className="text-foreground italic">"{userPrompt}"</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Click "Start Coding" to generate implementation based on this transformation
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={handleCodeIntent} className="bg-primary hover:bg-primary/90">
                  <Code className="h-4 w-4 mr-2" />
                  Start Coding
                </Button>
              </div>
            </div>
          </div>

          {/* Confirmation Dialog Overlay */}
          {showConfirmation && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
              <Card className="w-full max-w-md mx-4">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                      <Code className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Confirm Coding Intent</h3>
                      <p className="text-muted-foreground text-sm">
                        Are you ready to generate code based on this street transformation? 
                        This will create implementation plans and architecture for your vision.
                      </p>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowConfirmation(false)}
                      >
                        Not Yet
                      </Button>
                      <Button 
                        onClick={handleConfirmCoding}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Yes, Start Coding
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};