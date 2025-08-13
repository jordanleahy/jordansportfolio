import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Download, Loader2, Edit, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { ImagePreviewModalProps } from '@/types/stories/ui';
import { supabase } from '@/integrations/supabase/client';

export const ImagePreviewModal = ({
  isOpen,
  onClose,
  imageUrl,
  imageAlt,
  title,
  aspectRatio
}: ImagePreviewModalProps) => {
  const formattedTitle = title && aspectRatio 
    ? `${title} ${aspectRatio} jordanleahy.com`
    : imageAlt;

  const [wmUrl, setWmUrl] = useState<string | null>(null);
  const [wmStatus, setWmStatus] = useState<string>('none');
  const isLoading = wmStatus !== 'complete' || !wmUrl;
  
  // Edit functionality state
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditProcessing, setIsEditProcessing] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImageAnalysis, setReferenceImageAnalysis] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImagePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    let hasImage = false;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        hasImage = true;
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await processReferenceImage(file);
        }
        break;
      }
    }
    // If no image found, allow normal text pasting
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      await processReferenceImage(file);
    }
  };

  const processReferenceImage = async (file: File) => {
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setReferenceImage(base64);
        
        // Analyze the reference image
        try {
          const { data, error } = await supabase.functions.invoke('analyze-reference-image', {
            body: { 
              image: base64.split(',')[1], // Remove data:image/jpeg;base64, prefix
              aspects: ['colors', 'composition', 'style', 'lighting', 'mood']
            }
          });

          if (error) {
            console.error('Error analyzing reference image:', error);
            toast.error('Failed to analyze reference image');
          } else {
            setReferenceImageAnalysis(data);
            toast.success('Reference image analyzed successfully');
          }
        } catch (error) {
          console.error('Error analyzing reference image:', error);
          toast.error('Failed to analyze reference image');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing reference image:', error);
      toast.error('Failed to process reference image');
    }
  };

  const handleEditSubmit = async () => {
    if (!editPrompt.trim()) {
      toast.error('Please enter an edit description');
      return;
    }

    setIsEditProcessing(true);
    try {
      let enhancedPrompt = editPrompt;
      
      // Enhance prompt with reference image analysis if available
      if (referenceImageAnalysis?.extractedCharacteristics) {
        const characteristics = referenceImageAnalysis.extractedCharacteristics;
        enhancedPrompt += `\n\nReference image characteristics:
- Color palette: ${characteristics.colorPalette?.join(', ')}
- Artistic style: ${characteristics.artisticStyle}
- Lighting mood: ${characteristics.lightingMood}
- Overall mood: ${characteristics.overallMood}
- Complexity: ${characteristics.complexity}`;
      }

      const { data, error } = await supabase.functions.invoke('edit-image', {
        body: {
          prompt: enhancedPrompt,
          imageUrl: imageUrl,
          aspectRatio: aspectRatio || '1:1'
        }
      });

      if (error) {
        console.error('Error editing image:', error);
        toast.error('Failed to edit image');
      } else {
        toast.success('Image edited successfully');
        setIsEditSheetOpen(false);
        setEditPrompt('');
        setReferenceImage(null);
        setReferenceImageAnalysis(null);
        // Optionally refresh the image or navigate to the new version
      }
    } catch (error) {
      console.error('Error editing image:', error);
      toast.error('Failed to edit image');
    } finally {
      setIsEditProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      setIsEditSheetOpen(false);
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
                title={isLoading ? 'Preparing watermark...' : 'Download'}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
              </Button>

              {/* Edit Image button */}
              <Button
                onClick={() => setIsEditSheetOpen(true)}
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
                title="Edit Image"
              >
                <Edit className="h-5 w-5" />
              </Button>
              
              {/* Close button */}
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

          {/* Image */}
          <div className={`flex items-center justify-center flex-1 transition-all duration-300 ${isEditSheetOpen ? 'pb-80' : 'p-4'}`}>
            <img
              src={imageUrl}
              alt={imageAlt}
              className="max-w-full max-h-full object-contain rounded"
              loading="lazy"
            />
          </div>

          {/* Edit Sheet */}
          <div className={`absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-white/10 transition-transform duration-300 ${isEditSheetOpen ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-lg font-semibold">Edit Image</h3>
                <Button
                  onClick={() => setIsEditSheetOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Reference image display */}
              {referenceImage && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Reference Image:</span>
                    <Button
                      onClick={() => {
                        setReferenceImage(null);
                        setReferenceImageAnalysis(null);
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10 h-6 px-2"
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <img 
                      src={referenceImage} 
                      alt="Reference" 
                      className="w-16 h-16 object-cover rounded border border-white/20"
                    />
                    {referenceImageAnalysis?.extractedCharacteristics && (
                      <div className="text-xs text-white/70 space-y-1">
                        <div>Style: {referenceImageAnalysis.extractedCharacteristics.artisticStyle}</div>
                        <div>Mood: {referenceImageAnalysis.extractedCharacteristics.overallMood}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-white text-sm">Describe the edit:</span>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 h-6 px-2"
                    title="Upload reference image"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Upload
                  </Button>
                </div>
                
                <Textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handleImagePaste}
                  placeholder="Describe how you want to edit the image... (You can also paste or upload a reference image)"
                  className="min-h-[100px] bg-black/50 border-white/20 text-white placeholder:text-white/50 resize-none"
                  disabled={isEditProcessing}
                />
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <div className="flex justify-between items-center">
                  <div className="text-xs text-white/50">
                    Tip: Paste images (Ctrl/Cmd+V) or press Ctrl/Cmd+Enter to submit
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setIsEditSheetOpen(false)}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10"
                      disabled={isEditProcessing}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleEditSubmit}
                      size="sm"
                      className="bg-white text-black hover:bg-white/90"
                      disabled={isEditProcessing || !editPrompt.trim()}
                    >
                      {isEditProcessing ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Editing...
                        </>
                      ) : (
                        'Edit Image'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
