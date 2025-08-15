import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Download, Loader2, Upload } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useProcessingStatesContext } from "@/contexts/ProcessingStatesContext";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
  title?: string;
  aspectRatio?: string;
}

export const ImagePreviewModal = ({ isOpen, onClose, imageUrl, alt, title, aspectRatio }: ImagePreviewModalProps) => {
  const isMobile = useIsMobile();
  const { hasAnyImageProcessing } = useProcessingStatesContext();
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

  // Add drag and drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔄 Drag over detected');
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('📁 Drop event triggered');
    
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) {
      console.log('❌ No files in drop event');
      return;
    }

    console.log('📁 Files dropped:', files.length);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`📁 File ${i}: name=${file.name}, type=${file.type}, size=${file.size}`);
      
      if (file.type.startsWith('image/')) {
        console.log('🖼️ Processing dropped image');
        await processReferenceImage(file);
        break; // Only process the first image
      }
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

  // Add keyboard handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log('⌨️ Key pressed:', e.key, { ctrl: e.ctrlKey, meta: e.metaKey });
    
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      console.log('🚀 Submitting edit via keyboard shortcut');
      e.preventDefault();
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      console.log('❌ Closing edit sheet via Escape key');
      setSheetOpen(false);
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
    
    // Quality control: Check if any image processing is active
    if (hasAnyImageProcessing()) {
      toast.error('Quality is key! 🎨', {
        description: 'We\'re limiting to one image processing at a time to ensure the best results for you.'
      });
      return;
    }
    
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
      
      // Check for specific OpenAI moderation errors
      const errorMessage = err?.message || '';
      if (errorMessage.includes('safety system') || errorMessage.includes('moderation')) {
        toast.error('Edit blocked by content safety system. Try rephrasing your request or use different wording.');
      } else if (errorMessage.includes('rate limit')) {
        toast.error('Rate limit exceeded. Please wait a moment and try again.');
      } else {
        toast.error('Edit failed. Please try again with different wording.');
      }
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

  // Shared content component
  const ModalContent = () => (
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
          >
            Edit
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

      {/* Image container with version thumbnails */}
      <div className="flex flex-1 min-h-0">
        {/* Version thumbnails - only show if more than one version */}
        {imageVersions.length > 1 && (
          <div className="w-16 bg-black/50 border-r border-white/10 p-2 space-y-2 overflow-y-auto">
            {imageVersions.map((version, index) => (
              <div 
                key={version.id}
                className={`relative cursor-pointer rounded border-2 transition-all ${
                  index === currentVersionIndex 
                    ? 'border-white/80 scale-110' 
                    : 'border-white/20 hover:border-white/40'
                }`}
                onClick={() => setCurrentVersionIndex(index)}
                title={version.prompt || `Version ${version.version_number + 1}`}
              >
                <img 
                  src={version.url} 
                  alt={`Version ${version.version_number + 1}`}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="absolute -top-1 -right-1 bg-white/90 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {version.version_number + 1}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main image area */}
        <div 
          className="flex-1 flex items-center justify-center p-4"
          style={{ paddingBottom: isSheetOpen ? `${sheetHeight + 16}px` : '16px' }}
        >
          <img
            src={currentImageUrl}
            alt={alt}
            className="max-w-full max-h-full object-contain rounded"
            loading="lazy"
          />
        </div>
      </div>

      {/* Edit Sheet - slides up from bottom */}
      <AnimatePresence>
        {isSheetOpen && (
          <motion.div
            ref={sheetRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-white/20 rounded-t-xl max-h-[70vh] overflow-hidden"
          >
            <div className="p-6 space-y-4">
              {/* Edit header */}
              <div className="flex items-center justify-between">
                <h3 className="text-white text-lg font-semibold">Edit Image</h3>
                <Button
                  onClick={() => setSheetOpen(false)}
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
                      className="text-white/60 hover:text-white text-xs"
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="relative">
                    <img 
                      src={referenceImage} 
                      alt="Reference" 
                      className="w-full max-h-32 object-contain rounded border border-white/20"
                    />
                    {referenceImageAnalysis && (
                      <div className="mt-2 p-2 bg-white/10 rounded text-xs text-white/80">
                        <p><strong>Style:</strong> {referenceImageAnalysis.extractedCharacteristics?.artisticStyle}</p>
                        <p><strong>Mood:</strong> {referenceImageAnalysis.extractedCharacteristics?.overallMood}</p>
                        {referenceImageAnalysis.extractedCharacteristics?.colorPalette && (
                          <p><strong>Colors:</strong> {referenceImageAnalysis.extractedCharacteristics.colorPalette.slice(0, 3).join(', ')}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Edit prompt */}
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Describe your edit:</label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onPaste={handleImagePaste}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onKeyDown={handleKeyDown}
                  placeholder={isMobile 
                    ? "Describe how you want to edit the image...\n• Paste or drag images for reference"
                    : "Describe how you want to edit the image... \n• Paste or drag images for reference\n• Press Ctrl/Cmd+Enter to submit\n• Press Escape to close"
                  }
                  className={cn(
                    "resize-none bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40",
                    isMobile ? "min-h-[80px]" : "min-h-[100px]"
                  )}
                  disabled={isProcessing}
                />
              </div>

              {/* Upload button and submit */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10"
                    disabled={isProcessing}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Reference
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                
                <Button
                  onClick={handleEditSubmit}
                  disabled={!prompt.trim() || isProcessing}
                  className={cn(
                    "disabled:bg-white/20 disabled:text-white/40",
                    !isMobile && "bg-white text-black hover:bg-white/90",
                    isMobile && "w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 px-4 rounded-lg font-medium"
                  )}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Edit image"
                  )}
                </Button>
              </div>

              {/* Keyboard shortcuts info - desktop only */}
              {!isMobile && (
                <div className="text-xs text-white/50 border-t border-white/10 pt-2">
                  <p>💡 Ctrl/Cmd+Enter to submit • Escape to close • Paste or drag images for reference</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="h-[92vh] overflow-hidden bg-black/90">
          <div className="flex-1 overflow-hidden">
            <ModalContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[95vw] w-auto h-[100dvh] md:h-[95vh] p-0 border-0 bg-black/90 overflow-hidden"
        onPointerDownOutside={onClose}
      >
        <ModalContent />
      </DialogContent>
    </Dialog>
  );
};
