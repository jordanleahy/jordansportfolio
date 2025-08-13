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
  
  // Reference image state
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImageAnalysis, setReferenceImageAnalysis] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  // Handle image paste functionality
  const handleImagePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    console.log('📋 Paste event triggered in UI modal');
    console.log('📋 Event type:', e.type);
    console.log('📋 ClipboardData available:', !!e.clipboardData);
    
    const clipboardData = e.clipboardData;
    if (!clipboardData) {
      console.log('❌ No clipboard data found');
      return;
    }

    const items = clipboardData.items;
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
        e.stopPropagation();
        
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

  // Process reference image
  const processReferenceImage = async (file: File) => {
    console.log('🔄 Processing reference image:', { name: file.name, size: file.size, type: file.type });
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        console.log('✅ File converted to base64, length:', base64.length);
        
        setReferenceImage(base64);
        
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
            setReferenceImageAnalysis(data);
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

  // Handle image upload from file input
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

  // Enhance prompt with reference image analysis
  const enhancePromptWithReference = (basePrompt: string) => {
    if (!referenceImageAnalysis?.extractedCharacteristics) return basePrompt;
    
    const characteristics = referenceImageAnalysis.extractedCharacteristics;
    return `${basePrompt}\n\nReference image characteristics:
- Color palette: ${characteristics.colorPalette?.join(', ')}
- Artistic style: ${characteristics.artisticStyle}
- Lighting mood: ${characteristics.lightingMood}
- Overall mood: ${characteristics.overallMood}
- Complexity: ${characteristics.complexity}`;
  };

  // Submit handler: calls edge function
  // Enhance prompt with AI agent
  const enhancePromptWithAgent = async (userInput: string) => {
    console.log('🤖 Calling Image Enhancement Agent with input:', userInput);
    
    try {
      const sourceContext = {
        title: title,
        aspectRatio: aspectRatio || '1:1'
      };

      const requestBody = {
        userInput,
        sourceContext,
        ...(referenceImageAnalysis && { referenceImageAnalysis: referenceImageAnalysis.extractedCharacteristics })
      };

      console.log('🤖 Enhancement request:', requestBody);

      const { data, error } = await supabase.functions.invoke('image-enhancement-agent', {
        body: requestBody
      });

      if (error) {
        console.error('❌ Enhancement agent error:', error);
        toast.error('Failed to enhance prompt, using original input');
        return userInput;
      }

      console.log('✅ Enhancement result:', data);

      // Show enhancement feedback to user
      if (data.confidence === 'low' && data.clarificationNeeded) {
        toast.warning(`Clarification needed: ${data.clarificationNeeded}`);
      } else if (data.confidence === 'high') {
        toast.success('Prompt enhanced successfully');
      }

      return data.enhancedPrompt || userInput;

    } catch (error) {
      console.error('❌ Enhancement agent failed:', error);
      toast.error('Failed to enhance prompt, using original input');
      return userInput;
    }
  };

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
      
      // First enhance the prompt with the AI agent
      const enhancedPrompt = await enhancePromptWithAgent(prompt);
      console.log('📝 Original prompt:', prompt);
      console.log('🚀 Enhanced prompt:', enhancedPrompt);

      // Then enhance with reference image if available
      const finalPrompt = enhancePromptWithReference(enhancedPrompt);
      console.log('🎯 Final prompt with reference:', finalPrompt);

      const { data, error } = await supabase.functions.invoke('edit-image', {
        body: { 
          prompt: finalPrompt, 
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
        setReferenceImage(null); // Clear reference image
        setReferenceImageAnalysis(null); // Clear analysis
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
                <div className="max-w-5xl mx-auto space-y-3">
                  
                  {/* Reference image display */}
                  {referenceImage && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm">Reference Image:</span>
                        <Button
                          onClick={() => {
                            console.log('🗑️ Removing reference image');
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

                  <label htmlFor="edit-prompt" className="sr-only">Describe the edit</label>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
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
                          📷 Upload
                        </Button>
                      </div>
                      <textarea
                        id="edit-prompt"
                        placeholder="Describe the edit… e.g., Remove the shadows from this image (You can also paste images here)"
                        className="w-full h-24 resize-none rounded-md border bg-card text-card-foreground placeholder-muted-foreground p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background border-2 border-dashed"
                        value={prompt}
                        onChange={(e) => {
                          console.log('✏️ Prompt changed:', e.target.value);
                          setPrompt(e.target.value);
                        }}
                        onPaste={handleImagePaste}
                      />
                    </div>
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
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Press ⌘/Ctrl + Enter to submit · Paste images (Ctrl/Cmd+V) · Esc to close</span>
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
