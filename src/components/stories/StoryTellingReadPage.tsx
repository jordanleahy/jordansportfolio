import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

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
  const wordCount = generatedScript.split(' ').length;
  const readingTime = Math.ceil(wordCount / 150);

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between border-b pb-4">
        <Button variant="ghost" onClick={onBack} size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Setup
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {storyType === 'childrens_story' ? "Children's Story" : 'Professional Narrative'}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {readingTime} min read
          </Badge>
        </div>
      </div>

      {/* Post context */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="text-xs">{post.category || 'Post'}</Badge>
          {post.theme && <Badge variant="secondary" className="text-xs">{post.theme}</Badge>}
        </div>
        <h2 className="text-xl font-semibold">{post.title}</h2>
        <p className="text-sm text-muted-foreground">
          {storyType === 'childrens_story' 
            ? 'A magical story for young minds' 
            : 'A compelling narrative for professional audiences'
          }
        </p>
      </div>

      {/* Script display */}
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <div className="bg-muted/30 rounded-lg p-6 md:p-8">
          <div className="whitespace-pre-wrap text-base leading-relaxed font-serif">
            {generatedScript}
          </div>
        </div>
      </div>

      {/* Reading stats */}
      <div className="flex justify-center">
        <div className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full border">
          {wordCount} words • {generatedScript.length} characters • {readingTime} minute read
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