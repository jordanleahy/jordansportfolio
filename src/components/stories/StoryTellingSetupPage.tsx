import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Book, Briefcase } from 'lucide-react';

interface StoryTellingSetupPageProps {
  storyType: 'childrens_story' | 'convincing_story';
  setStoryType: (type: 'childrens_story' | 'convincing_story') => void;
  post: {
    id: string;
    title: string;
    description: string;
    theme?: string;
    category?: string;
  };
  onGenerateScript: () => void;
  isGenerating: boolean;
}

const StoryTellingSetupPage: React.FC<StoryTellingSetupPageProps> = ({
  storyType,
  setStoryType,
  post,
  onGenerateScript,
  isGenerating
}) => {
  return (
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
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">{post.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{post.description}</p>
            <div className="text-xs text-muted-foreground border-t pt-2">
              Source content for your {storyType === 'childrens_story' ? "children's story" : 'professional narrative'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex justify-center pt-4">
        <Button 
          onClick={onGenerateScript}
          disabled={isGenerating}
          size="lg"
          className="min-w-[200px]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              {storyType === 'childrens_story' ? 'Creating magical story...' : 'Crafting compelling narrative...'}
            </>
          ) : (
            <>
              <MessageSquare className="h-5 w-5 mr-3" />
              Generate {storyType === 'childrens_story' ? "Children's Story" : 'Convincing Story'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StoryTellingSetupPage;