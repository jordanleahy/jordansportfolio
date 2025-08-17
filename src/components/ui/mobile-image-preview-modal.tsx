import React, { useState, useRef, useEffect } from "react";
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Download, Loader2, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { useImageVersions } from "@/hooks/useImageVersions";
import { useWatermarkStatus } from "@/hooks/useWatermarkStatus";
import { useReferenceImage } from "@/hooks/useReferenceImage";
import { useImageEdit } from "@/hooks/useImageEdit";
import { useImageGenerationTimer } from "@/hooks/useImageGenerationTimer";

interface MobileImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
  title?: string;
  aspectRatio?: string;
}

export const MobileImagePreviewModal = ({ 
  isOpen, 
  onClose, 
  imageUrl, 
  alt, 
  title, 
  aspectRatio 
}: MobileImagePreviewModalProps) => {
  const formattedTitle = title && aspectRatio 
    ? `jordanleahy.com ${title} ${aspectRatio}`
    : alt;

  const { wmUrl, wmStatus, isLoading } = useWatermarkStatus(imageUrl);
  const { 
    imageVersions, 
    currentVersionIndex, 
    setCurrentVersionIndex, 
    currentImageUrl, 
    fetchVersionsFromDatabase 
  } = useImageVersions(imageUrl, aspectRatio);
  
  const {
    referenceImage,
    referenceImageAnalysis,
    fileInputRef,
    handleImagePaste,
    handleDragOver,
    handleDrop,
    handleImageUpload,
    clearReferenceImage
  } = useReferenceImage();

  const { isProcessing, handleEditSubmit } = useImageEdit(
    imageUrl, 
    aspectRatio, 
    title,
    fetchVersionsFromDatabase,
    imageVersions,
    undefined,
    undefined
  );

  // Timer for edit processing
  const { 
    isRunning: isTimerRunning, 
    secondsRemaining, 
    isExpired: isTimerExpired,
    startTimer, 
    stopTimer 
  } = useImageGenerationTimer();

  // Mobile-specific state
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [sheetHeight, setSheetHeight] = useState(0);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  // Handle download
  const handleDownload = async () => {
    try {
      const downloadUrl = wmUrl && wmStatus === 'complete' ? wmUrl : currentImageUrl;
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = formattedTitle;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Mobile keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmitEdit();
    } else if (e.key === 'Escape') {
      setSheetOpen(false);
    }
  };

  const onSubmitEdit = async () => {
    startTimer();
    await handleEditSubmit(prompt, referenceImageAnalysis, () => {
      stopTimer();
      setPrompt("");
      clearReferenceImage();
      setSheetOpen(false);
    });
  };

  // Mobile-specific sheet height management
  const updateSheetHeight = useDebouncedCallback(
    (newHeight: number) => {
      setSheetHeight(prev => {
        if (Math.abs(newHeight - prev) > 5) {
          return newHeight;
        }
        return prev;
      });
    },
    50
  );

  useEffect(() => {
    const el = sheetRef.current;
    if (!isSheetOpen || !el) {
      setSheetHeight(0);
      return;
    }
    
    const update = () => {
      const height = el.getBoundingClientRect().height;
      updateSheetHeight(height);
    };

    const observer = new ResizeObserver(update);
    observer.observe(el);
    update();

    return () => observer.disconnect();
  }, [isSheetOpen, updateSheetHeight]);

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[95vh] flex flex-col">
        <DrawerHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-semibold truncate pr-4">
              {formattedTitle}
            </DrawerTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSheetOpen(!isSheetOpen)}
              >
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex-1 flex flex-col min-h-0" style={{ paddingBottom: isSheetOpen ? `${sheetHeight}px` : 0 }}>
          {/* Image area */}
          <div className="flex-1 flex items-center justify-center p-4 bg-muted/20">
            <img
              src={currentImageUrl}
              alt={alt}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Version thumbnails */}
          {imageVersions.length > 1 && (
            <div className="p-4 border-t bg-background flex-shrink-0">
              <div className="flex gap-2 overflow-x-auto">
                {imageVersions.map((version, index) => (
                  <button
                    key={version.id}
                    onClick={() => setCurrentVersionIndex(index)}
                    className={cn(
                      "flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden transition-all",
                      currentVersionIndex === index
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <img
                      src={version.url}
                      alt={`Version ${version.version_number}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edit sheet */}
        <AnimatePresence>
          {isSheetOpen && (
            <motion.div
              ref={sheetRef}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50"
            >
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Edit prompt
                  </label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handleImagePaste}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    placeholder="Describe how you want to edit this image..."
                    className="min-h-[80px] resize-none"
                    disabled={isProcessing}
                  />
                </div>

                {/* Reference image display */}
                {referenceImage && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <img
                      src={referenceImage}
                      alt="Reference"
                      className="w-10 h-10 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Reference image</p>
                      <p className="text-xs text-muted-foreground">
                        Style will be applied
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearReferenceImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Upload area */}
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-3">
                  <div className="text-center">
                    <Upload className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground mb-2">
                      Drop image or paste from clipboard
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose File
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSheetOpen(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={onSubmitEdit}
                    disabled={!prompt.trim() || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {isTimerRunning && !isTimerExpired 
                          ? `Processing... (${secondsRemaining}s)` 
                          : isTimerExpired 
                            ? "Processing..." 
                            : "Processing..."
                        }
                      </>
                    ) : (
                      "Apply Edit"
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DrawerContent>
    </Drawer>
  );
};