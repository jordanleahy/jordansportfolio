import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import { ThemeStoryHeader } from '@/components/story-studio/ThemeStoryHeader';
import { StoryFlowVisualizer } from '@/components/story-studio/StoryFlowVisualizer';
import { StoryPreviewPanel } from '@/components/story-studio/StoryPreviewPanel';
import { StoryGenerationControls } from '@/components/story-studio/StoryGenerationControls';
import { StoryPublicationPanel } from '@/components/story-studio/StoryPublicationPanel';

interface ThemeData {
  id: string;
  theme_name: string;
  description: string;
  category: string;
  post_count: number;
  posts: Array<{
    id: string;
    title: string;
    description: string;
    day?: number;
    image_16_9_url?: string;
  }>;
}

interface StoryConfig {
  style: 'narrative' | 'analytical' | 'educational' | 'tutorial';
  tone: 'professional' | 'casual' | 'technical';
  length: 'quick' | 'deep' | 'comprehensive';
  audience: 'general' | 'professional' | 'technical' | 'executive';
}

export default function ThemeStoryStudio() {
  const { themeId } = useParams<{ themeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [themeData, setThemeData] = useState<ThemeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeView, setActiveView] = useState<'flow' | 'preview' | 'publish'>('flow');
  
  const [storyConfig, setStoryConfig] = useState<StoryConfig>({
    style: 'narrative',
    tone: 'professional', 
    length: 'deep',
    audience: 'professional'
  });

  const [postOrder, setPostOrder] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState<string>('');

  useEffect(() => {
    if (themeId) {
      fetchThemeData();
    }
  }, [themeId]);

  const fetchThemeData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch theme with posts
      const { data: theme, error: themeError } = await supabase
        .from('themes')
        .select('*')
        .eq('id', themeId)
        .single();

      if (themeError) throw themeError;

      const { data: posts, error: postsError } = await supabase
        .from('social_media_posts')
        .select('id, title, description, day, image_16_9_url')
        .eq('theme_id', themeId)
        .order('day', { ascending: true });

      if (postsError) throw postsError;

      const themeWithPosts: ThemeData = {
        ...theme,
        post_count: posts?.length || 0,
        posts: posts || []
      };

      setThemeData(themeWithPosts);
      setPostOrder(posts?.map(p => p.id) || []);
      
    } catch (error) {
      console.error('Error fetching theme data:', error);
      toast({
        title: "Error",
        description: "Failed to load theme data",
        variant: "destructive"
      });
      navigate('/stories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateStory = async () => {
    if (!themeData) return;

    setIsGenerating(true);
    try {
      // TODO: Call edge function to generate story content
      // For now, simulate generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setGeneratedContent(`# ${themeData.theme_name}: A Comprehensive Guide

This is a preview of your generated story blog post. The full content would be generated based on all ${themeData.post_count} posts in this theme.

## Introduction
Based on your theme "${themeData.theme_name}", this comprehensive guide explores...

## Key Insights
${themeData.posts.map((post, idx) => `
### ${idx + 1}. ${post.title}
${post.description}
`).join('\n')}

## Conclusion
This story brings together all the key insights from your ${themeData.theme_name} theme...`);

      setActiveView('preview');
      
      toast({
        title: "Story Generated!",
        description: "Your theme-based blog story is ready for review"
      });
      
    } catch (error) {
      console.error('Error generating story:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate story content",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading || !themeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
        <div className="container max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <BookOpen className="h-12 w-12 animate-spin mx-auto text-primary" />
              <h2 className="text-xl font-medium">Loading Story Studio...</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <div className="container max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/stories')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Stories
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-2xl font-serif font-bold text-foreground">
              Story Publication Studio
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex rounded-lg border bg-card p-1">
              {[
                { key: 'flow', label: 'Flow', icon: '📝' },
                { key: 'preview', label: 'Preview', icon: '👁️' },
                { key: 'publish', label: 'Publish', icon: '🚀' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveView(tab.key as any)}
                  className={`px-4 py-2 text-sm rounded font-medium transition-all ${
                    activeView === tab.key
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Theme Header */}
        <ThemeStoryHeader theme={themeData} />

        {/* Main Content Area */}
        <div className="grid grid-cols-12 gap-8 mt-8">
          {/* Left Panel - Controls */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <StoryGenerationControls
              config={storyConfig}
              onConfigChange={setStoryConfig}
              onGenerate={handleGenerateStory}
              isGenerating={isGenerating}
              isGenerated={!!generatedContent}
            />
          </div>

          {/* Right Panel - Main View */}
          <div className="col-span-12 lg:col-span-8">
            {activeView === 'flow' && (
              <StoryFlowVisualizer
                posts={themeData.posts}
                postOrder={postOrder}
                onReorder={setPostOrder}
              />
            )}

            {activeView === 'preview' && (
              <StoryPreviewPanel
                content={generatedContent}
                config={storyConfig}
                theme={themeData}
              />
            )}

            {activeView === 'publish' && (
              <StoryPublicationPanel
                content={generatedContent}
                theme={themeData}
                config={storyConfig}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}