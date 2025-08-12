import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
  title?: string;
  aspectRatio?: string;
}

export const ImagePreviewModal = ({ isOpen, onClose, imageUrl, alt, title, aspectRatio }: ImagePreviewModalProps) => {
  const formattedTitle = title && aspectRatio 
    ? `jordanleahy.com ${title} ${aspectRatio}`
    : alt;

  const [wmUrl, setWmUrl] = useState<string | null>(null);
  const [wmStatus, setWmStatus] = useState<string>('none');
  const isLoading = wmStatus !== 'complete' || !wmUrl;

  // Edit sheet state (UI only, no backend wiring yet)
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [sheetHeight, setSheetHeight] = useState(0);
  useEffect(() => {
    let isMounted = true;
    const fetchInfo = async () => {
      try {
        const { data } = await supabase
          .from('social_media_posts')
          .select('id, image_16_9_url, image_9_16_url, image_3_4_url, image_4_3_url, image_1_1_url, image_16_9_watermark_url, image_9_16_watermark_url, image_3_4_watermark_url, image_4_3_watermark_url, image_1_1_watermark_url, image_16_9_watermark_status, image_9_16_watermark_status, image_3_4_watermark_status, image_4_3_watermark_status, image_1_1_watermark_status')
          .or(
            `image_16_9_url.eq.${imageUrl},image_9_16_url.eq.${imageUrl},image_3_4_url.eq.${imageUrl},image_4_3_url.eq.${imageUrl},image_1_1_url.eq.${imageUrl}`
          )
          .limit(1)
          .maybeSingle();
        if (!data || !isMounted) return;
        let url: string | null = null;
        let status: string = 'none';
        if (data.image_16_9_url === imageUrl) { url = data.image_16_9_watermark_url; status = data.image_16_9_watermark_status || 'none'; }
        else if (data.image_9_16_url === imageUrl) { url = data.image_9_16_watermark_url; status = data.image_9_16_watermark_status || 'none'; }
        else if (data.image_3_4_url === imageUrl) { url = data.image_3_4_watermark_url; status = data.image_3_4_watermark_status || 'none'; }
        else if (data.image_4_3_url === imageUrl) { url = data.image_4_3_watermark_url; status = data.image_4_3_watermark_status || 'none'; }
        else if (data.image_1_1_url === imageUrl) { url = data.image_1_1_watermark_url; status = data.image_1_1_watermark_status || 'none'; }
        setWmUrl(url || null);
        setWmStatus(status);
      } catch {}
    };
    fetchInfo();
    const t = setInterval(fetchInfo, 2000);
    return () => { isMounted = false; clearInterval(t); };
  }, [imageUrl]);

  // Keyboard shortcuts for the edit sheet
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isSheetOpen) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        // Simulate submit (UI only)
        setIsProcessing(true);
        setTimeout(() => setIsProcessing(false), 1000);
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSheetOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSheetOpen]);

  // Dynamically measure bottom sheet height and pad the image area
  useEffect(() => {
    const el = sheetRef.current;
    if (!isSheetOpen || !el) {
      setSheetHeight(0);
      return;
    }
    const update = () => setSheetHeight(el.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isSheetOpen]);

  const handleDownload = async () => {
    try {
      const finalUrl = wmUrl || imageUrl;
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[95vw] w-auto h-[100dvh] md:h-[95vh] p-0 border-0 bg-black/90 overflow-hidden"
        onPointerDownOutside={onClose}
      >
        <div className="relative flex flex-col w-full h-full min-h-0">
          {/* Header with title and buttons */}
          <div className="flex items-center justify-between p-4 bg-black/70 md:sticky md:top-0 md:z-10">
            <DialogTitle className="text-white text-lg font-semibold truncate mr-4">
              {formattedTitle}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {/* Download button */}
              <Button
                onClick={handleDownload}
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
                title={isLoading ? "Preparing watermark..." : "Download"}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
              </Button>
              {/* Edit Image text button */}
              <Button
                onClick={() => setSheetOpen(true)}
                variant="ghost"
                size="sm"
                className="h-9 px-3 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
                title="Edit Image"
                aria-controls="edit-image-sheet"
                aria-expanded={isSheetOpen}
                disabled={isProcessing}
              >
                Edit Image
              </Button>
              
              {/* Close button */}
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
                title="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Image */}
          <div
            className="flex items-center justify-center flex-1 p-4 min-h-0 overflow-auto"
            style={{ paddingBottom: isSheetOpen ? `calc(${sheetHeight}px + env(safe-area-inset-bottom))` : 'env(safe-area-inset-bottom)' }}
          >
            <img
              src={imageUrl}
              alt={alt}
              className="max-w-full max-h-full object-contain rounded"
              loading="lazy"
            />
          </div>

          {/* Bottom Edit Sheet */}
          <AnimatePresence>
            {isSheetOpen && (
              <motion.div
                id="edit-image-sheet"
                role="region"
                aria-label="Edit image prompt"
                ref={sheetRef}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-3 md:p-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
              >
                <div className="max-w-5xl mx-auto">
                  <label htmlFor="edit-prompt" className="sr-only">Describe the edit</label>
                  <div className="flex items-end gap-3">
                    <textarea
                      id="edit-prompt"
                      placeholder="Describe the edit… e.g., Remove the shadows from this image"
                      className="flex-1 h-24 resize-none rounded-md border bg-card text-card-foreground placeholder-muted-foreground p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                    <Button
                      onClick={() => {
                        setIsProcessing(true);
                        setTimeout(() => setIsProcessing(false), 1000);
                      }}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Processing…</span>
                      ) : (
                        'Edit image'
                      )}
                    </Button>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Press ⌘/Ctrl + Enter to submit · Esc to close</span>
                    <span className="hidden md:inline">No data sent yet — UI only</span>
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
