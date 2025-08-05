import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, Save, Loader2, Globe, Check } from 'lucide-react';
import { useTranslateScript } from '@/hooks/useStoryTelling';

interface StoryTellingReadPageProps {
  storyType: 'childrens_story' | 'convincing_story';
  generatedScript: string;
  post: {
    title: string;
    theme?: string;
    category?: string;
  };
  onBack: () => void;
  onSave: () => void;
  isSaving: boolean;
}

const StoryTellingReadPage: React.FC<StoryTellingReadPageProps> = ({
  storyType,
  generatedScript,
  post,
  onBack,
  onSave,
  isSaving
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('original');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [currentScript, setCurrentScript] = useState(generatedScript);
  
  const translateMutation = useTranslateScript();

  const languages = [
    { code: 'original', label: 'Original', flag: '🇺🇸' },
    { code: 'german', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'spanish', label: 'Español', flag: '🇪🇸' },
    { code: 'chinese', label: '中文', flag: '🇨🇳' },
    { code: 'swedish', label: 'Svenska', flag: '🇸🇪' },
  ];

  const handleTranslate = async (targetLanguage: string) => {
    if (targetLanguage === 'original') {
      setCurrentScript(generatedScript);
      setCurrentLanguage('original');
      return;
    }

    // Check if translation already exists
    if (translations[targetLanguage]) {
      setCurrentScript(translations[targetLanguage]);
      setCurrentLanguage(targetLanguage);
      return;
    }

    try {
      const result = await translateMutation.mutateAsync({
        script_text: generatedScript,
        target_language: targetLanguage as any,
        story_type: storyType,
      });

      setTranslations(prev => ({
        ...prev,
        [targetLanguage]: result.translated_script
      }));
      setCurrentScript(result.translated_script);
      setCurrentLanguage(targetLanguage);
    } catch (error) {
      console.error('Translation failed:', error);
    }
  };

  const currentWordCount = currentScript.split(' ').length;
  const readingTime = Math.ceil(currentWordCount / 150);

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between border-b pb-4">
        <Button variant="ghost" onClick={onBack} size="sm">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 flex-nowrap">
          <Badge variant="outline" className="text-xs">
            {storyType === 'childrens_story' ? "Children's Story" : 'Professional Narrative'}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {readingTime} min read
          </Badge>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 px-2 text-xs"
                disabled={translateMutation.isPending}
              >
                {translateMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Globe className="h-3 w-3" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="end">
              <div className="space-y-1">
                <p className="text-sm font-medium mb-2">Translate to:</p>
                {languages.map((language) => (
                  <Button
                    key={language.code}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8 px-2"
                    onClick={() => handleTranslate(language.code)}
                    disabled={translateMutation.isPending && currentLanguage !== language.code}
                  >
                    <span className="mr-2">{language.flag}</span>
                    <span className="flex-1 text-left">{language.label}</span>
                    {currentLanguage === language.code && (
                      <Check className="h-3 w-3 ml-2" />
                    )}
                    {translateMutation.isPending && currentLanguage === language.code && (
                      <Loader2 className="h-3 w-3 ml-2 animate-spin" />
                    )}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>


      {/* Script display */}
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <div className="bg-muted/30 rounded-lg p-6 md:p-8">
          <div className="whitespace-pre-wrap text-base leading-relaxed font-serif">
            {currentScript}
          </div>
        </div>
      </div>

      {/* Reading stats */}
      <div className="flex justify-center">
        <div className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full border">
          {currentWordCount} words • {currentScript.length} characters • {readingTime} minute read
          {currentLanguage !== 'original' && (
            <span className="ml-2">• {languages.find(l => l.code === currentLanguage)?.label}</span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Edit Script
        </Button>
        <Button 
          onClick={onSave}
          disabled={isSaving}
          className="min-w-[120px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving story...
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
  );
};

export default StoryTellingReadPage;