import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Download, Loader2, Edit, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { ImagePreviewModalProps } from '@/types/stories/ui';
import { supabase } from '@/integrations/supabase/client';

// Aspect ratio mapping for cleaner watermark logic
const ASPECT_RATIO_MAPPING = {
  '16:9': { url: 'image_16_9_watermark_url', status: 'image_16_9_watermark_status', original: 'image_16_9_url' },
  '9:16': { url: 'image_9_16_watermark_url', status: 'image_9_16_watermark_status', original: 'image_9_16_url' },
  '3:4': { url: 'image_3_4_watermark_url', status: 'image_3_4_watermark_status', original: 'image_3_4_url' },
  '4:3': { url: 'image_4_3_watermark_url', status: 'image_4_3_watermark_status', original: 'image_4_3_url' },
  '1:1': { url: 'image_1_1_watermark_url', status: 'image_1_1_watermark_status', original: 'image_1_1_url' },
};

export const ImagePreviewModal = ({
  isOpen,
  onClose,
  imageUrl,
  imageAlt,
  title,
  aspectRatio
}: ImagePreviewModalProps) => {
  console.log('🖼️ ImagePreviewModal rendered with:', { imageUrl, aspectRatio, title });

  const formattedTitle = title && aspectRatio 
    ? `${title} ${aspectRatio} jordanleahy.com`
    : imageAlt;

  // Simplified state management with grouped states
  const [watermarkState, setWatermarkState] = useState({
    url: null as string | null,
    status: 'none' as string
  });

  const [editState, setEditState] = useState({
    isSheetOpen: false,
    prompt: '',
    isProcessing: false
  });

  const [referenceImageState, setReferenceImageState] = useState({
    image: null as string | null,
    analysis: null as any
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isLoading = watermarkState.status !== 'complete' || !watermarkState.url;

  // Simplified watermark fetching with better error handling
  useEffect(() => {
    let isMounted = true;
    
    const fetchWatermarkInfo = async () => {
      console.log('🔍 Fetching watermark info for:', imageUrl);
      
      try {
        const { data, error } = await supabase
          .from('social_media_posts')
          .select('id, image_16_9_url, image_9_16_url, image_3_4_url, image_4_3_url, image_1_1_url, image_16_9_watermark_url, image_9_16_watermark_url, image_3_4_watermark_url, image_4_3_watermark_url, image_1_1_watermark_url, image_16_9_watermark_status, image_9_16_watermark_status, image_3_4_watermark_status, image_4_3_watermark_status, image_1_1_watermark_status')
          .or(
            `image_16_9_url.eq.${imageUrl},image_9_16_url.eq.${imageUrl},image_3_4_url.eq.${imageUrl},image_4_3_url.eq.${imageUrl},image_1_1_url.eq.${imageUrl}`
          )
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('❌ Error fetching watermark info:', error);
          return;
        }

        if (!data || !isMounted) {
          console.log('📭 No data found or component unmounted');
          return;
        }

        // Find matching aspect ratio using the mapping
        let watermarkUrl: string | null = null;
        let watermarkStatus: string = 'none';

        for (const [aspectKey, mapping] of Object.entries(ASPECT_RATIO_MAPPING)) {
          if (data[mapping.original] === imageUrl) {
            watermarkUrl = data[mapping.url];
            watermarkStatus = data[mapping.status] || 'none';
            console.log(`✅ Found watermark for ${aspectKey}:`, { url: watermarkUrl, status: watermarkStatus });
            break;
          }
        }

        setWatermarkState({
          url: watermarkUrl,
          status: watermarkStatus
        });

      } catch (error) {
        console.error('❌ Unexpected error fetching watermark:', error);
      }
    };

    fetchWatermarkInfo();
    const interval = setInterval(fetchWatermarkInfo, 2000);
    
    return () => { 
      isMounted = false; 
      clearInterval(interval); 
    };
  }, [imageUrl]);

  const handleDownload = async () => {
    console.log('📥 Starting download...', { watermarkUrl: watermarkState.url, imageUrl });
    
    try {
      const finalUrl = watermarkState.url || imageUrl;
      console.log('📥 Downloading from:', finalUrl);
      
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
      
      console.log('✅ Download completed successfully');
    } catch (error) {
      console.error('❌ Download failed:', error);
      toast.error('Failed to download image');
    }
  };

  const handleImagePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    console.log('📋 Paste event triggered');
    console.log('📋 Clipboard data:', e.clipboardData);
    
    const items = e.clipboardData?.items;
    if (!items) {
      console.log('❌ No clipboard items found');
      return;
    }

    console.log('📋 Clipboard items count:', items.length);
    
    let hasImage = false;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`📋 Item ${i}: type=${item.type}, kind=${item.kind}`);
      
      if (item.type.startsWith('image/')) {
        console.log('🖼️ Image detected in clipboard!');
        hasImage = true;
        e.preventDefault();
        
        const file = item.getAsFile();
        if (file) {
          console.log('📁 File extracted from clipboard:', { name: file.name, size: file.size, type: file.type });
          await processReferenceImage(file);
        } else {
          console.log('❌ Failed to extract file from clipboard item');
        }
        break;
      }
    }
    
    if (!hasImage) {
      console.log('📝 No image in clipboard, allowing normal text paste');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('📁 File selected from upload:', file);
    
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      console.log('✅ Valid image file type, processing...');
      await processReferenceImage(file);
    } else {
      console.log('❌ Invalid file type or no file selected');
      toast.error('Please select a PNG or JPEG image');
    }
  };

  const processReferenceImage = async (file: File) => {
    console.log('🔄 Processing reference image:', { name: file.name, size: file.size, type: file.type });
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        console.log('✅ File converted to base64, length:', base64.length);
        
        setReferenceImageState(prev => ({ ...prev, image: base64 }));
        
        try {
          console.log('🔍 Sending image for analysis...');
          const { data, error } = await supabase.functions.invoke('analyze-reference-image', {
            body: { 
              image: base64.split(',')[1], // Remove data:image/jpeg;base64, prefix
              aspects: ['colors', 'composition', 'style', 'lighting', 'mood']
            }
          });

          if (error) {
            console.error('❌ Error analyzing reference image:', error);
            toast.error('Failed to analyze reference image');
          } else {
            console.log('✅ Reference image analysis completed:', data);
            setReferenceImageState(prev => ({ ...prev, analysis: data }));
            toast.success('Reference image analyzed successfully');
          }
        } catch (error) {
          console.error('❌ Error analyzing reference image:', error);
          toast.error('Failed to analyze reference image');
        }
      };
      
      reader.onerror = () => {
        console.error('❌ FileReader error');
        toast.error('Failed to read image file');
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('❌ Error processing reference image:', error);
      toast.error('Failed to process reference image');
    }
  };

  const enhancePromptWithReference = (basePrompt: string) => {
    if (!referenceImageState.analysis?.extractedCharacteristics) return basePrompt;
    
    const characteristics = referenceImageState.analysis.extractedCharacteristics;
    return `${basePrompt}\n\nReference image characteristics:
- Color palette: ${characteristics.colorPalette?.join(', ')}
- Artistic style: ${characteristics.artisticStyle}
- Lighting mood: ${characteristics.lightingMood}
- Overall mood: ${characteristics.overallMood}
- Complexity: ${characteristics.complexity}`;
  };

  const handleEditSubmit = async () => {
    if (!editState.prompt.trim()) {
      toast.error('Please enter an edit description');
      return;
    }

    console.log('🎨 Starting image edit process...', { 
      prompt: editState.prompt, 
      hasReference: !!referenceImageState.image,
      aspectRatio 
    });

    setEditState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const enhancedPrompt = enhancePromptWithReference(editState.prompt);
      console.log('📝 Enhanced prompt:', enhancedPrompt);

      const { data, error } = await supabase.functions.invoke('edit-image', {
        body: {
          prompt: enhancedPrompt,
          imageUrl: imageUrl,
          aspectRatio: aspectRatio || '1:1'
        }
      });

      if (error) {
        console.error('❌ Error editing image:', error);
        toast.error('Failed to edit image');
      } else {
        console.log('✅ Image edit completed successfully:', data);
        toast.success('Image edited successfully');
        
        // Reset all states
        setEditState({ isSheetOpen: false, prompt: '', isProcessing: false });
        setReferenceImageState({ image: null, analysis: null });
      }
    } catch (error) {
      console.error('❌ Unexpected error editing image:', error);
      toast.error('Failed to edit image');
    } finally {
      setEditState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log('⌨️ Key pressed:', e.key, { ctrl: e.ctrlKey, meta: e.metaKey });
    
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      console.log('🚀 Submitting edit via keyboard shortcut');
      e.preventDefault();
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      console.log('❌ Closing edit sheet via Escape key');
      setEditState(prev => ({ ...prev, isSheetOpen: false }));
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
                onClick={() => setEditState(prev => ({ ...prev, isSheetOpen: true }))}
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
          <div className={`flex items-center justify-center flex-1 transition-all duration-300 ${editState.isSheetOpen ? 'pb-80' : 'p-4'}`}>
            <img
              src={imageUrl}
              alt={imageAlt}
              className="max-w-full max-h-full object-contain rounded"
              loading="lazy"
            />
          </div>

          {/* Edit Sheet */}
          <div className={`absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-white/10 transition-transform duration-300 ${editState.isSheetOpen ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
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

              {/* Reference image display */}
              {referenceImageState.image && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Reference Image:</span>
                    <Button
                      onClick={() => {
                        console.log('🗑️ Removing reference image');
                        setReferenceImageState({ image: null, analysis: null });
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
                      src={referenceImageState.image} 
                      alt="Reference" 
                      className="w-16 h-16 object-cover rounded border border-white/20"
                    />
                    {referenceImageState.analysis?.extractedCharacteristics && (
                      <div className="text-xs text-white/70 space-y-1">
                        <div>Style: {referenceImageState.analysis.extractedCharacteristics.artisticStyle}</div>
                        <div>Mood: {referenceImageState.analysis.extractedCharacteristics.overallMood}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-white text-sm">Describe the edit:</span>
                  <Button
                    onClick={() => {
                      console.log('📁 Opening file picker');
                      fileInputRef.current?.click();
                    }}
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
                  value={editState.prompt}
                  onChange={(e) => {
                    console.log('✏️ Edit prompt changed:', e.target.value);
                    setEditState(prev => ({ ...prev, prompt: e.target.value }));
                  }}
                  onKeyDown={handleKeyDown}
                  onPaste={handleImagePaste}
                  placeholder="Describe how you want to edit the image... (You can also paste or upload a reference image)"
                  className="min-h-[100px] bg-black/50 border-white/20 text-white placeholder:text-white/50 resize-none"
                  disabled={editState.isProcessing}
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
                      onClick={() => setEditState(prev => ({ ...prev, isSheetOpen: false }))}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10"
                      disabled={editState.isProcessing}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleEditSubmit}
                      size="sm"
                      className="bg-white text-black hover:bg-white/90"
                      disabled={editState.isProcessing || !editState.prompt.trim()}
                    >
                      {editState.isProcessing ? (
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
