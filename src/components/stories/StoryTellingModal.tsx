import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  useGenerateStoryScript, 
  useCreateStoryRecording, 
  AudioRecorder,
  StoryRecording
} from '@/hooks/useStoryTelling';
import StoryTellingSetupPage from './StoryTellingSetupPage';
import StoryTellingReadPage from './StoryTellingReadPage';
import type { StoryTellingModalProps } from '@/types/stories/ui';
import { useIsMobile } from '@/hooks/use-mobile';

type StoryType = 'childrens_story' | 'convincing_story';
type ModalPage = 'setup' | 'read';

const StoryTellingModal: React.FC<StoryTellingModalProps> = ({ isOpen, onClose, post }) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState<ModalPage>('setup');
  const [storyType, setStoryType] = useState<StoryType>('childrens_story');
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const generateScript = useGenerateStoryScript();
  const createStoryRecording = useCreateStoryRecording();

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (audioRecorderRef.current?.isRecording()) {
        audioRecorderRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // Reset modal state when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentPage('setup');
      setGeneratedScript('');
      setRecordedAudio(null);
      setRecordingDuration(0);
    }
  }, [isOpen]);

  const handleGenerateScript = async () => {
    try {
      const result = await generateScript.mutateAsync({
        post_content: post.description,
        story_type: storyType,
        post_title: post.title
      });
      
      setGeneratedScript(result.script);
      setCurrentPage('read');
    } catch (error) {
      console.error('Error generating script:', error);
    }
  };

  const handleBack = () => {
    setCurrentPage('setup');
  };

  const startRecording = async () => {
    if (!generatedScript) {
      toast({
        title: "No Script Available",
        description: "Please generate a script first before recording.",
        variant: "destructive",
      });
      return;
    }

    try {
      audioRecorderRef.current = new AudioRecorder();
      await audioRecorderRef.current.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = async () => {
    if (!audioRecorderRef.current) return;

    try {
      const audioBlob = await audioRecorderRef.current.stop();
      setRecordedAudio(audioBlob);
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      console.log('Recording stopped, duration:', recordingDuration, 'seconds');
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to stop recording.",
        variant: "destructive",
      });
    }
  };

  const playRecording = () => {
    if (!recordedAudio) return;

    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    const audioUrl = URL.createObjectURL(recordedAudio);
    const audio = new Audio(audioUrl);
    audioElementRef.current = audio;

    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => {
      setIsPlaying(false);
      URL.revokeObjectURL(audioUrl);
    };

    audio.play().catch(console.error);
  };

  const pauseRecording = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
  };

  const downloadRecording = () => {
    if (!recordedAudio) return;

    const url = URL.createObjectURL(recordedAudio);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${post.title || 'story'}_${storyType}_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const saveStoryRecording = async () => {
    if (!generatedScript) {
      toast({
        title: "No Script to Save",
        description: "Please generate a script first.",
        variant: "destructive",
      });
      return;
    }

    try {
      let audioFileUrl: string | undefined;
      
      // If we have recorded audio, upload it to storage
      if (recordedAudio) {
        const fileName = `story-recordings/${post.id}_${storyType}_${Date.now()}.webm`;
        const { error: uploadError } = await supabase.storage
          .from('voice-recordings')
          .upload(fileName, recordedAudio);

        if (uploadError) {
          console.error('Error uploading audio:', uploadError);
          toast({
            title: "Upload Failed",
            description: "Failed to upload audio file. Saving script only.",
            variant: "destructive",
          });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('voice-recordings')
            .getPublicUrl(fileName);
          audioFileUrl = publicUrl;
        }
      }

      await createStoryRecording.mutateAsync({
        post_id: post.id,
        story_type: storyType,
        generated_script: generatedScript,
        audio_file_url: audioFileUrl,
        duration_seconds: recordingDuration || undefined,
      });

      // Reset modal state
      setGeneratedScript('');
      setRecordedAudio(null);
      setRecordingDuration(0);
      setCurrentPage('setup');
      
      onClose();
    } catch (error) {
      console.error('Error saving story recording:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Shared content component
  const ModalContent = () => (
    <div className="py-6">
      {currentPage === 'setup' ? (
        <StoryTellingSetupPage
          storyType={storyType}
          setStoryType={setStoryType}
          post={post}
          onGenerateScript={handleGenerateScript}
          isGenerating={generateScript.isPending}
        />
      ) : (
        <StoryTellingReadPage
          storyType={storyType}
          generatedScript={generatedScript}
          post={post}
          onBack={handleBack}
          onSave={saveStoryRecording}
          isSaving={createStoryRecording.isPending}
        />
      )}
      
      {currentPage === 'setup' && (
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="h-[92vh] overflow-hidden">
          <DrawerHeader>
            <DrawerTitle>
              {currentPage === 'setup' ? 'Story Telling Setup' : 'Story Script'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4">
            <ModalContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <ModalContent />
      </DialogContent>
    </Dialog>
  );
};

export default StoryTellingModal;