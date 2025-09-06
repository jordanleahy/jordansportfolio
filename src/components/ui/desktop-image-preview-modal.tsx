import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Download, Loader2, Edit } from "lucide-react";
import { useImageVersions } from "@/hooks/useImageVersions";
import { useWatermarkStatus } from "@/hooks/useWatermarkStatus";

import { useImageEdit } from "@/hooks/useImageEdit";
import { useImageGenerationTimerContext } from "@/contexts/ImageGenerationTimerContext";

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
  // Grouped state management for better stability
  const [editState, setEditState] = useState({
    isSheetOpen: false, // Always start closed
    prompt: '',
    isProcessing: false
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const formattedTitle = title && aspectRatio 
    ? `${title} ${aspectRatio} jordanleahy.com`
    : alt;

  const { wmUrl, wmStatus, isLoading } = useWatermarkStatus(imageUrl);
  const { 
    imageVersions, 
    currentVersionIndex, 
    setCurrentVersionIndex, 
    currentImageUrl, 
    fetchVersionsFromDatabase 
  } = useImageVersions(imageUrl, aspectRatio);
  
  const { isProcessing, handleEditSubmit } = useImageEdit(
    imageUrl, 
    aspectRatio, 
    title,
    fetchVersionsFromDatabase,
    imageVersions,
    undefined,
    setCurrentVersionIndex
  );

  // Timer for edit processing (centrally managed)
  const { 
    isRunning: isTimerRunning, 
    secondsRemaining, 
    isExpired: isTimerExpired
  } = useImageGenerationTimerContext();

  // Clean up edit state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEditState({ isSheetOpen: false, prompt: '', isProcessing: false });
    }
  }, [isOpen]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editState.isSheetOpen) return;

      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onSubmitEdit();
      } else if (e.key === 'Escape') {
        setEditState(prev => ({ ...prev, isSheetOpen: false }));
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, editState.isSheetOpen, editState.prompt]);

  const handleDownload = async () => {
    try {
      const finalUrl = wmUrl || currentImageUrl;
      const response = await fetch(finalUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${formattedTitle}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const onSubmitEdit = () => {
    if (!editState.prompt.trim()) return;

    setEditState(prev => ({ ...prev, isProcessing: true }));

    handleEditSubmit(
      editState.prompt,
      null,
      () => {
        setEditState({ isSheetOpen: false, prompt: '', isProcessing: false });
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-0 bg-black/90"
        onPointerDownOutside={onClose}
      >
        <div className="relative flex flex-col w-full h-full">
          {/* Header with title and buttons */}
          <div className="flex items-center justify-between p-4 bg-black/70">
            <DialogTitle className="text-white text-lg font-semibold truncate mr-4">
              {formattedTitle}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDownload}
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
                title={isLoading ? 'Preparing watermark...' : 'Download'}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
              </Button>

              <Button
                onClick={() => setEditState(prev => ({ ...prev, isSheetOpen: true }))}
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
                title="Edit Image"
              >
                <Edit className="h-5 w-5" />
              </Button>
              
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Main content area with flexible layout */}
          <div className="flex flex-col flex-1 min-h-0">
            {/* Image Container - Scrollable */}
            <div className="flex-1 p-4 min-h-0 overflow-auto">
              <div className="min-h-full flex items-center justify-center">
                <img
                  src={currentImageUrl}
                  alt={alt}
                  className="block object-contain rounded"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Version Thumbnails */}
            {imageVersions.length > 1 && !editState.isSheetOpen && (
              <div className="flex justify-center p-4">
                <div className="flex gap-2 bg-black/70 backdrop-blur-sm rounded-lg p-2">
                  {imageVersions.map((version, index) => (
                    <button
                      key={version.id}
                      onClick={() => setCurrentVersionIndex(index)}
                      className={`relative w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                        index === currentVersionIndex 
                          ? 'border-white shadow-lg scale-110' 
                          : 'border-transparent hover:border-white/50'
                      }`}
                    >
                      <img
                        src={version.url}
                        alt={`Version ${version.version_number}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {version.version_number === 0 ? 'O' : version.version_number}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Edit Sheet - Conditionally rendered to prevent visibility issues */}
          {editState.isSheetOpen && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-white/10 transition-transform duration-300 max-h-[60vh] animate-in slide-in-from-bottom">
            <div className="flex flex-col h-full max-h-full overflow-hidden">
              <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
                <h3 className="text-white text-lg font-semibold">Edit Image</h3>
                <Button
                  onClick={() => setEditState(prev => ({ ...prev, isSheetOpen: false }))}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
              {/* Edit prompt area */}
              <Textarea
                ref={textareaRef}
                placeholder="Describe how you want to edit the image..."
                value={editState.prompt}
                onChange={(e) => setEditState(prev => ({ ...prev, prompt: e.target.value }))}
                className="min-h-20 bg-white/10 border-white/20 text-white placeholder:text-white/60 resize-none focus:border-white/40"
                disabled={editState.isProcessing}
              />

                {/* Action buttons */}
                <div className="flex justify-end gap-3 pt-2 border-t border-white/10 mt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setEditState(prev => ({ ...prev, isSheetOpen: false }))}
                    className="text-white hover:bg-white/10"
                    disabled={editState.isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={onSubmitEdit}
                    className="bg-white text-black hover:bg-white/90"
                    disabled={editState.isProcessing || !editState.prompt.trim()}
                  >
                    {editState.isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isTimerRunning && !isTimerExpired 
                          ? `Processing... (${secondsRemaining}s)` 
                          : isTimerExpired 
                            ? "Processing..." 
                            : "Processing..."
                        }
                      </>
                    ) : (
                      'Apply Edit'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};