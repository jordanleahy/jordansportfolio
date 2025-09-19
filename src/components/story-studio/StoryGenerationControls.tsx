import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Sparkles, BookOpen, Users, Zap, Eye } from 'lucide-react';

interface StoryConfig {
  style: 'narrative' | 'analytical' | 'educational' | 'tutorial';
  tone: 'professional' | 'casual' | 'technical';
  length: 'quick' | 'deep' | 'comprehensive';
  audience: 'general' | 'professional' | 'technical' | 'executive';
}

interface StoryGenerationControlsProps {
  config: StoryConfig;
  onConfigChange: (config: StoryConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isGenerated: boolean;
  themeId?: string;
}

export const StoryGenerationControls: React.FC<StoryGenerationControlsProps> = ({
  config,
  onConfigChange,
  onGenerate,
  isGenerating,
  isGenerated,
  themeId
}) => {
  const updateConfig = (key: keyof StoryConfig, value: string) => {
    onConfigChange({ ...config, [key]: value });
  };

  const getEstimatedLength = () => {
    const baseWords = {
      quick: { min: 800, max: 1200 },
      deep: { min: 1500, max: 2500 },
      comprehensive: { min: 3000, max: 5000 }
    };
    
    const range = baseWords[config.length];
    return `${range.min.toLocaleString()}-${range.max.toLocaleString()} words`;
  };

  const getEstimatedTime = () => {
    const times = {
      quick: '3-5 minutes',
      deep: '8-12 minutes', 
      comprehensive: '15-25 minutes'
    };
    return times[config.length];
  };

  const styleOptions = [
    {
      value: 'narrative',
      label: 'Narrative',
      description: 'Story-driven with flow between concepts',
      icon: '📖'
    },
    {
      value: 'analytical',
      label: 'Analytical',
      description: 'Data-driven with insights and analysis',
      icon: '📊'
    },
    {
      value: 'educational',
      label: 'Educational',
      description: 'Teaching-focused with clear explanations',
      icon: '🎓'
    },
    {
      value: 'tutorial',
      label: 'Tutorial',
      description: 'Step-by-step actionable guide',
      icon: '📝'
    }
  ];

  const toneOptions = [
    { value: 'professional', label: 'Professional', icon: '👔' },
    { value: 'casual', label: 'Casual', icon: '😊' },
    { value: 'technical', label: 'Technical', icon: '⚙️' }
  ];

  const lengthOptions = [
    { value: 'quick', label: 'Quick Read', icon: '⚡' },
    { value: 'deep', label: 'Deep Dive', icon: '🏊' },
    { value: 'comprehensive', label: 'Comprehensive', icon: '📚' }
  ];

  const audienceOptions = [
    { value: 'general', label: 'General Audience', icon: '👥' },
    { value: 'professional', label: 'Professionals', icon: '💼' },
    { value: 'technical', label: 'Technical Experts', icon: '🔧' },
    { value: 'executive', label: 'Executives', icon: '👑' }
  ];

  return (
    <div className="space-y-6">
      {/* Generation Button */}
      <Card className="bg-gradient-to-r from-accent/10 to-primary/5 border-accent/30">
        <CardContent className="p-6">
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            size="lg"
            className="w-full h-12 text-base font-medium bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90"
          >
            {isGenerating ? (
              <>
                <Sparkles className="h-5 w-5 mr-3 animate-spin" />
                Generating Story...
              </>
            ) : isGenerated ? (
              <>
                <Zap className="h-5 w-5 mr-3" />
                Regenerate Story
              </>
            ) : (
              <>
                <BookOpen className="h-5 w-5 mr-3" />
                Generate Story
              </>
            )}
          </Button>
          
          <div className="mt-4 pt-4 border-t border-accent/20">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Estimated length: {getEstimatedLength()}</span>
              <span>Reading time: {getEstimatedTime()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blog Preview Button */}
      {themeId && (
        <Card className="bg-muted/20 border-dashed">
          <CardContent className="p-4">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full h-10"
            >
              <Link to={`/stories/studio/${themeId}/blog-preview`}>
                <Eye className="h-4 w-4 mr-2" />
                Preview as Blog Post
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              See how your theme would look as a published blog article
            </p>
          </CardContent>
        </Card>
      )}

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-accent" />
            <span>Story Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Style Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Writing Style</Label>
            <RadioGroup
              value={config.style}
              onValueChange={(value) => updateConfig('style', value)}
              className="space-y-2"
            >
              {styleOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label 
                    htmlFor={option.value} 
                    className="flex-1 cursor-pointer p-3 rounded-lg border border-transparent hover:border-accent/30 hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{option.icon}</span>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Tone Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Tone</Label>
            <div className="grid grid-cols-1 gap-2">
              {toneOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={config.tone === option.value ? "default" : "outline"}
                  className="justify-start h-auto p-3"
                  onClick={() => updateConfig('tone', option.value)}
                >
                  <span className="mr-3">{option.icon}</span>
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Length Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Length</Label>
            <div className="grid grid-cols-1 gap-2">
              {lengthOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={config.length === option.value ? "default" : "outline"}
                  className="justify-start h-auto p-3"
                  onClick={() => updateConfig('length', option.value)}
                >
                  <span className="mr-3">{option.icon}</span>
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Audience Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Target Audience</Label>
            <div className="grid grid-cols-1 gap-2">
              {audienceOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={config.audience === option.value ? "default" : "outline"}
                  className="justify-start h-auto p-3"
                  onClick={() => updateConfig('audience', option.value)}
                >
                  <span className="mr-3">{option.icon}</span>
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Configuration Summary */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="font-medium text-sm">Current Configuration</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{config.style}</Badge>
            <Badge variant="outline">{config.tone}</Badge>
            <Badge variant="outline">{config.length}</Badge>
            <Badge variant="outline">{config.audience}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};