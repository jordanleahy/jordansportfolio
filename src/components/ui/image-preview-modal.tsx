import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
                onClick={() => {
                  console.log('Edit Image clicked!');
                  // TODO: Wire up edit functionality
                }}
                variant="ghost"
                size="sm"
                className="h-9 px-3 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
                title="Edit Image"
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
          <div className="flex items-center justify-center flex-1 p-4">
            <img
              src={imageUrl}
              alt={alt}
              className="max-w-full max-h-full object-contain rounded"
              loading="lazy"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
