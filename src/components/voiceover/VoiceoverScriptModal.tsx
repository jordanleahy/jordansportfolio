import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Loader2, Save, Mic } from 'lucide-react';
import { useGenerateVoiceoverScript, useCreateVoiceoverScript } from '@/hooks/useVoiceoverScripts';
import { toast } from 'sonner';

interface VoiceoverScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceId: string;
  sourceType: 'blog_post' | 'social_media_post';
  originalContent: string;
  contentType?: 'blog_post' | 'calendar_entry';
}

const toneOptions = [
  { value: 'engaging', label: 'Engaging', description: 'Conversational and captivating' },
  { value: 'confident', label: 'Confident', description: 'Authoritative and decisive' },
  { value: 'educational', label: 'Educational', description: 'Clear and informative' },
  { value: 'energetic', label: 'Energetic', description: 'Dynamic and enthusiastic' },
];

const styleOptions = [
  { value: 'teleprompter', label: 'Teleprompter', description: 'Short lines for on-camera delivery' },
  { value: 'short_lines', label: 'Short Lines', description: 'Punchy, bite-sized segments' },
  { value: 'podcast_voice', label: 'Podcast Voice', description: 'Natural conversational flow' },
];

export const VoiceoverScriptModal = ({ 
  isOpen, 
  onClose, 
  sourceId, 
  sourceType, 
  originalContent,
  contentType = 'blog_post'
}: VoiceoverScriptModalProps) => {
  const [tone, setTone] = useState('engaging');
  const [style, setStyle] = useState('teleprompter');
  const [generatedScript, setGeneratedScript] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState(0);

  const generateScript = useGenerateVoiceoverScript();
  const saveScript = useCreateVoiceoverScript();

  const handleGenerate = async () => {
    try {
      const result = await generateScript.mutateAsync({
        content_type: contentType,
        source_text: originalContent,
        tone,
        style
      });

      setGeneratedScript(result.script);
      setWordCount(result.word_count || 0);
      setEstimatedDuration(result.estimated_duration_seconds || 0);
    } catch (error) {
      console.error('Failed to generate script:', error);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedScript);
      toast.success('Script copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy script');
    }
  };

  const handleSave = async () => {
    if (!generatedScript) {
      toast.error('No script to save');
      return;
    }

    await saveScript.mutateAsync({
      source_id: sourceId,
      source_type: sourceType,
      original_content: originalContent,
      generated_script: generatedScript,
      tone,
      style,
      word_count: wordCount,
      estimated_duration_seconds: estimatedDuration
    });
  };

  const handleDownload = () => {
    if (!generatedScript) {
      toast.error('No script to download');
      return;
    }

    const blob = new Blob([generatedScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voiceover-script-${tone}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Script downloaded!');
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Generate Voiceover Script
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tone</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Style</label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {styleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate} 
            disabled={generateScript.isPending}
            className="w-full"
          >
            {generateScript.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Script...
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Generate Voiceover Script
              </>
            )}
          </Button>

          {/* Generated Script */}
          {generatedScript && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Generated Script</h3>
                  {wordCount > 0 && (
                    <div className="flex gap-2">
                      <Badge variant="secondary">{wordCount} words</Badge>
                      <Badge variant="secondary">~{formatDuration(estimatedDuration)}</Badge>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSave}
                    disabled={saveScript.isPending}
                  >
                    {saveScript.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Textarea
                value={generatedScript}
                onChange={(e) => setGeneratedScript(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
                placeholder="Generated script will appear here..."
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};