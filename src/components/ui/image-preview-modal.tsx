import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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

  // Edit sheet state and version control
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [sheetHeight, setSheetHeight] = useState(0);
  
  // Version control state
  const [imageVersions, setImageVersions] = useState<Array<{id: string, url: string, prompt?: string, version_number: number}>>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  
  
  // Fetch existing versions from database
  const fetchVersionsFromDatabase = async (postId: string, currentAspectRatio: string) => {
    try {
      const { data: versions, error } = await supabase
        .from('image_versions')
        .select('*')
        .eq('post_id', postId)
        .eq('aspect_ratio', currentAspectRatio)
        .order('version_number', { ascending: true });
        
      if (error) {
        console.error('Error fetching image versions:', error);
        return;
      }
      
      const originalVersion = { id: 'original', url: imageUrl, version_number: 0 };
      
      if (versions && versions.length > 0) {
        const allVersions = [
          originalVersion,
          ...versions.map(v => ({
            id: v.id,
            url: v.edited_url,
            prompt: v.edit_prompt,
            version_number: v.version_number
          }))
        ];
        setImageVersions(allVersions);
        // Set to the latest version
        setCurrentVersionIndex(allVersions.length - 1);
      } else {
        setImageVersions([originalVersion]);
        setCurrentVersionIndex(0);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
      // Fallback to original image only
      setImageVersions([{ id: 'original', url: imageUrl, version_number: 0 }]);
      setCurrentVersionIndex(0);
    }
  };

  useEffect(() => {
    const initializeVersions = async () => {
      // Extract post ID from image URL
      const urlMatch = imageUrl.match(/generated_([a-f0-9-]+)_/) || 
                       imageUrl.match(/([a-f0-9-]{8}-[a-f0-9-]{4}-[a-f0-9-]{4}-[a-f0-9-]{4}-[a-f0-9-]{12})/);
      const postId = urlMatch?.[1];
      
      console.log('Initializing versions for postId:', postId);
      
      if (postId) {
        await fetchVersionsFromDatabase(postId, aspectRatio || '1:1');
      } else {
        // Fallback to original image only
        setImageVersions([{ id: 'original', url: imageUrl, version_number: 0 }]);
        setCurrentVersionIndex(0);
      }
    };
    
    initializeVersions();
  }, [imageUrl, aspectRatio]);
  
  // Current image URL based on selected version
  const currentImageUrl = imageVersions[currentVersionIndex]?.url || imageUrl;
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

  // Submit handler: calls edge function
  const handleEditSubmit = async () => {
    if (!prompt?.trim() || isProcessing) return;
    try {
      setIsProcessing(true);
      
      // Extract post ID from image URL for database storage
      const urlMatch = imageUrl.match(/generated_([a-f0-9-]+)_/) || 
                       imageUrl.match(/([a-f0-9-]{8}-[a-f0-9-]{4}-[a-f0-9-]{4}-[a-f0-9-]{4}-[a-f0-9-]{12})/);
      const postId = urlMatch?.[1];
      
      console.log('Extracted postId:', postId, 'from URL:', imageUrl);
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('edit-image', {
        body: { 
          prompt, 
          imageUrl, 
          aspectRatio,
          postId,
          userId: user?.id
        }
      });
      
      if (error) throw error;
      const newUrl = (data as any)?.url as string | undefined;
      if (newUrl) {
        // If we have postId, fetch updated versions from database
        if (postId && user?.id) {
          await fetchVersionsFromDatabase(postId, aspectRatio || '1:1');
        } else {
          // Fallback to local state if no postId
          const newVersion = {
            id: `edit-${Date.now()}`,
            url: newUrl,
            prompt: prompt.trim(),
            version_number: imageVersions.length
          };
          setImageVersions(prev => [...prev, newVersion]);
          setCurrentVersionIndex(prev => prev + 1);
        }
        
        setPrompt(""); // Clear prompt after successful edit
        setSheetOpen(false); // Close edit sheet
        toast.success('Edit complete');
      } else {
        toast.error('No image returned');
      }
    } catch (err) {
      console.error('Edit failed:', err);
      toast.error('Edit failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Keyboard shortcuts for the edit sheet
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isSheetOpen) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleEditSubmit();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSheetOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSheetOpen, handleEditSubmit]);

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

          {/* Version Control Thumbnails */}
          {imageVersions.length > 1 && (
            <div className="px-4 py-2 bg-black/50">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {imageVersions.map((version, index) => (
                  <button
                    key={version.id}
                    onClick={() => setCurrentVersionIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentVersionIndex 
                        ? 'border-white shadow-lg' 
                        : 'border-white/30 hover:border-white/60'
                    }`}
                    title={version.prompt || (index === 0 ? 'Original' : `Edit ${index}`)}
                  >
                    <img
                      src={version.url}
                      alt={version.prompt || (index === 0 ? 'Original' : `Edit ${index}`)}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Image */}
          <div
            className="flex items-center justify-center flex-1 p-4 min-h-0 overflow-auto"
            style={{ paddingBottom: isSheetOpen ? `calc(${sheetHeight}px + env(safe-area-inset-bottom))` : 'env(safe-area-inset-bottom)' }}
          >
            <img
              src={currentImageUrl}
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
                className="absolute bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/80 text-white backdrop-blur supports-[backdrop-filter]:bg-black/60 p-3 md:p-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
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
                      onClick={handleEditSubmit}
                      disabled={isProcessing || !prompt.trim()}
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
                    <span className="hidden md:inline">Edits run on server — saved automatically</span>
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
