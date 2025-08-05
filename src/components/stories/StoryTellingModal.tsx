import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, Play, Pause, Download, Save, Loader2, MessageSquare, Book, Briefcase } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  useGenerateStoryScript, 
  useCreateStoryRecording, 
  AudioRecorder,
  StoryRecording
} from '@/hooks/useStoryTelling';

interface StoryTellingModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    title: string;
    description: string;
    theme?: string;
    category?: string;
  };
}

type StoryType = 'childrens_story' | 'convincing_story';

const StoryTellingModal: React.FC<StoryTellingModalProps> = ({ isOpen, onClose, post }) => {
  const { toast } = useToast();
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

  const handleGenerateScript = async () => {
    try {
      const result = await generateScript.mutateAsync({
        post_content: post.description,
        story_type: storyType,
        post_title: post.title
      });
      
      setGeneratedScript(result.script);
    } catch (error) {
      console.error('Error generating script:', error);
    }
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Create Story Narration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Story Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Story Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  storyType === 'childrens_story' 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setStoryType('childrens_story')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">📚</div>
                    <div className="flex-1">
                      <div className="font-medium mb-1">Children's Story</div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Warm, engaging narrative perfect for parent-child interaction
                      </div>
                      <div className="text-xs text-muted-foreground italic">
                        "Once upon a time in a magical brewery..."
                      </div>
                    </div>
                    <Book className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  storyType === 'convincing_story' 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setStoryType('convincing_story')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">💼</div>
                    <div className="flex-1">
                      <div className="font-medium mb-1">Convincing Story</div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Professional presentation for stakeholder pitches
                      </div>
                      <div className="text-xs text-muted-foreground italic">
                        "Let me tell you why this brewery matters..."
                      </div>
                    </div>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Post Preview */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{post.category || 'Post'}</Badge>
                  {post.theme && <Badge variant="secondary">{post.theme}</Badge>}
                </div>
                <h3 className="font-semibold">{post.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3">{post.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Script Generation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Generated Script</Label>
              <Button 
                onClick={handleGenerateScript}
                disabled={generateScript.isPending}
                size="sm"
                variant="outline"
              >
                {generateScript.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Generate Script
                  </>
                )}
              </Button>
            </div>
            
            <Textarea
              value={generatedScript}
              onChange={(e) => setGeneratedScript(e.target.value)}
              placeholder="Click 'Generate Script' to create a voice-optimized narration script, or write your own..."
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          {/* Recording Controls */}
          {generatedScript && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Voice Recording</Label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {isRecording && (
                    <Badge variant="destructive" className="animate-pulse">
                      Recording {formatDuration(recordingDuration)}
                    </Badge>
                  )}
                  {recordedAudio && !isRecording && (
                    <Badge variant="outline">
                      Recorded {formatDuration(recordingDuration)}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isRecording ? (
                  <Button onClick={startRecording} disabled={isPlaying}>
                    <Mic className="h-4 w-4 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button onClick={stopRecording} variant="destructive">
                    <Square className="h-4 w-4 mr-2" />
                    Stop Recording
                  </Button>
                )}

                {recordedAudio && (
                  <>
                    {!isPlaying ? (
                      <Button onClick={playRecording} variant="outline" disabled={isRecording}>
                        <Play className="h-4 w-4 mr-2" />
                        Play
                      </Button>
                    ) : (
                      <Button onClick={pauseRecording} variant="outline">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    )}

                    <Button onClick={downloadRecording} variant="outline" disabled={isRecording}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={saveStoryRecording}
              disabled={!generatedScript || createStoryRecording.isPending}
            >
              {createStoryRecording.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Story
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoryTellingModal;