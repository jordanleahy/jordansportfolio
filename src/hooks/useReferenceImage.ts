import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const useReferenceImage = () => {
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImageAnalysis, setReferenceImageAnalysis] = useState<any>(null);
  const [createdCharacterId, setCreatedCharacterId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

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
              image: base64.split(',')[1],
              aspects: ['colors', 'composition', 'style', 'lighting', 'mood']
            }
          });

          if (error) {
            console.error('❌ Error analyzing reference image:', error);
            toast.error('Failed to analyze reference image');
          } else {
            console.log('✅ Reference image analysis completed:', data);
            setReferenceImageAnalysis(data);
            
            // Immediately create character record with visual seed
            if (user && data.extractedCharacteristics) {
              try {
                console.log('🎭 Creating character from visual seed...');
                const characterResponse = await supabase
                  .from('characters')
                  .insert({
                    user_id: user.id,
                    original_image_url: base64,
                    sample_image_url: base64,
                    character_description: `Visual seed: ${data.extractedCharacteristics.colors?.join(', ') || 'analyzed image'} - ${data.extractedCharacteristics.style || 'visual style'}`,
                    character_name: `Seed ${new Date().toLocaleTimeString()}`,
                    image_hash: crypto.randomUUID(), // Simple hash replacement
                    style: 'vector' // Default style
                  })
                  .select()
                  .single();

                if (characterResponse.error) {
                  console.error('❌ Failed to create character:', characterResponse.error);
                } else {
                  console.log('✅ Character created from visual seed:', characterResponse.data.id);
                  setCreatedCharacterId(characterResponse.data.id);
                  toast.success('Visual seed saved as character');
                }
              } catch (error) {
                console.error('❌ Error creating character:', error);
              }
            }
            
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

  const handleImagePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    console.log('📋 Paste event triggered');
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const items = clipboardData.items;
    if (!items) return;
    
    let hasImage = false;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.startsWith('image/')) {
        hasImage = true;
        e.preventDefault();
        e.stopPropagation();
        
        const file = item.getAsFile();
        if (file) {
          await processReferenceImage(file);
        }
        break;
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.type.startsWith('image/')) {
        await processReferenceImage(file);
        break;
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      await processReferenceImage(file);
    } else {
      toast.error('Please select a PNG or JPEG image');
    }
  };

  const clearReferenceImage = () => {
    setReferenceImage(null);
    setReferenceImageAnalysis(null);
    setCreatedCharacterId(null);
  };

  return {
    referenceImage,
    referenceImageAnalysis,
    createdCharacterId,
    fileInputRef,
    processReferenceImage,
    handleImagePaste,
    handleDragOver,
    handleDrop,
    handleImageUpload,
    clearReferenceImage
  };
};