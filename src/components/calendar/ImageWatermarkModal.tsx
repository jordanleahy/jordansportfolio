import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { WatermarkCanvas } from './WatermarkCanvas';
import { Loader2 } from 'lucide-react';

interface ImageWatermarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  onConfirm: (watermarkedFile: File) => void;
  watermarkText?: string;
}

export const ImageWatermarkModal: React.FC<ImageWatermarkModalProps> = ({
  isOpen,
  onClose,
  file,
  onConfirm,
  watermarkText = 'www.jordanleahy.com'
}) => {
  const [watermarkedFile, setWatermarkedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  const handleWatermarked = (file: File) => {
    setWatermarkedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setIsProcessing(false);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsProcessing(false);
  };

  const handleConfirm = () => {
    if (watermarkedFile) {
      console.log('ImageWatermarkModal: Confirming upload with watermarked file'); // Debug log
      onConfirm(watermarkedFile);
      handleClose();
    }
  };

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setWatermarkedFile(null);
    setPreviewUrl('');
    setError('');
    setIsProcessing(false);
    onClose();
  };

  React.useEffect(() => {
    if (file && isOpen) {
      setIsProcessing(true);
      setError('');
    }
  }, [file, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Watermark</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {file && (
            <WatermarkCanvas
              file={file}
              watermarkText={watermarkText}
              onWatermarked={handleWatermarked}
              onError={handleError}
            />
          )}

          {isProcessing && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Processing image...</span>
            </div>
          )}

          {error && (
            <div className="text-destructive text-center p-4">
              {error}
            </div>
          )}

          {previewUrl && !isProcessing && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Preview with watermark:
              </div>
              <div className="flex justify-center">
                <img
                  src={previewUrl}
                  alt="Watermarked preview"
                  className="max-w-full max-h-96 object-contain border rounded"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!watermarkedFile || isProcessing}
          >
            Upload with Watermark
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};