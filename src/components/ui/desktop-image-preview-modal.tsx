import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Download, Loader2, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useImageVersions } from "@/hooks/useImageVersions";
import { useWatermarkStatus } from "@/hooks/useWatermarkStatus";
import { useReferenceImage } from "@/hooks/useReferenceImage";
import { useImageEdit } from "@/hooks/useImageEdit";

interface DesktopImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
  title?: string;
  aspectRatio?: string;
}

export const DesktopImagePreviewModal = ({ 
  isOpen, 
  onClose, 
  imageUrl, 
  alt, 
  title, 
  aspectRatio 
}: DesktopImagePreviewModalProps) => {
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

  // Desktop-specific state
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Desktop keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmitEdit();
    } else if (e.key === 'Escape') {
      setSheetOpen(false);
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isSheetOpen) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        onSubmitEdit();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSheetOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSheetOpen]);

  const onSubmitEdit = async () => {
    await handleEditSubmit(prompt, referenceImageAnalysis, () => {
      setPrompt("");
      clearReferenceImage();
      setSheetOpen(false);
    });
  };

  // Focus textarea when sheet opens
  useEffect(() => {
    if (isSheetOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isSheetOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold truncate">
              {formattedTitle}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
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
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Image area */}
          <div className="flex-1 flex items-center justify-center p-6 bg-muted/20">
            <img
              src={currentImageUrl}
              alt={alt}
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ maxHeight: 'calc(100% - 2rem)' }}
            />
          </div>

          {/* Version thumbnails */}
          {imageVersions.length > 1 && (
            <div className="p-4 border-t bg-background">
              <div className="flex gap-2 overflow-x-auto">
                {imageVersions.map((version, index) => (
                  <button
                    key={version.id}
                    onClick={() => setCurrentVersionIndex(index)}
                    className={cn(
                      "flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all",
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

          {/* Edit sheet */}
          <AnimatePresence>
            {isSheetOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="border-t bg-background overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Edit prompt (Ctrl/Cmd + Enter to submit)
                    </label>
                    <Textarea
                      ref={textareaRef}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onPaste={handleImagePaste}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      placeholder="Describe how you want to edit this image..."
                      className="min-h-[100px] resize-none"
                      disabled={isProcessing}
                    />
                  </div>

                  {/* Reference image display */}
                  {referenceImage && (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <img
                        src={referenceImage}
                        alt="Reference"
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Reference image attached</p>
                        <p className="text-xs text-muted-foreground">
                          Style characteristics will be applied to your edit
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
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                    <div className="text-center">
                      <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Drop a reference image here, paste from clipboard, or
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
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSheetOpen(false)}
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={onSubmitEdit}
                      disabled={!prompt.trim() || isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processing...
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
        </div>
      </DialogContent>
    </Dialog>
  );
};