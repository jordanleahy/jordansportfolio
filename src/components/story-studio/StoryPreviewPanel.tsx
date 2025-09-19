import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, FileText, Clock, BarChart3, Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ThemeData {
  id: string;
  theme_name: string;
  description: string;
  category: string;
  post_count: number;
}

interface StoryConfig {
  style: 'narrative' | 'analytical' | 'educational' | 'tutorial';
  tone: 'professional' | 'casual' | 'technical';
  length: 'quick' | 'deep' | 'comprehensive';
  audience: 'general' | 'professional' | 'technical' | 'executive';
}

interface StoryPreviewPanelProps {
  content: string;
  config: StoryConfig;
  theme: ThemeData;
}

export const StoryPreviewPanel: React.FC<StoryPreviewPanelProps> = ({
  content,
  config,
  theme
}) => {
  const { toast } = useToast();
  const [previewMode, setPreviewMode] = useState<'article' | 'newsletter' | 'case-study'>('article');

  const wordCount = content.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200);

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied!",
        description: "Story content copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy content to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theme.theme_name.toLowerCase().replace(/\s+/g, '-')}-story.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: "Story content downloaded as Markdown file"
    });
  };

  const getStylePreview = () => {
    switch (previewMode) {
      case 'newsletter':
        return {
          className: 'max-w-2xl mx-auto font-sans',
          prefix: '📧 Newsletter Format'
        };
      case 'case-study':
        return {
          className: 'max-w-4xl mx-auto',
          prefix: '📊 Case Study Format'
        };
      default:
        return {
          className: 'max-w-3xl mx-auto font-serif',
          prefix: '📰 Article Format'
        };
    }
  };

  const stylePreview = getStylePreview();

  if (!content) {
    return (
      <Card className="bg-card/80 backdrop-blur border-accent/20">
        <CardContent className="py-16">
          <div className="text-center space-y-4">
            <Eye className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-medium">No Preview Available</h3>
            <p className="text-muted-foreground">
              Generate your story to see the preview here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur border-accent/20">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-accent" />
            <span>Story Preview</span>
          </CardTitle>

          <div className="flex flex-wrap items-center gap-3">
            {/* Preview Mode Selector */}
            <div className="flex rounded-lg border bg-card p-1">
              {[
                { key: 'article', label: 'Article' },
                { key: 'newsletter', label: 'Newsletter' },
                { key: 'case-study', label: 'Case Study' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setPreviewMode(tab.key as any)}
                  className={`px-3 py-1 text-sm rounded font-medium transition-all ${
                    previewMode === tab.key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyContent}
                className="border-accent/30 hover:bg-accent/10"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="border-accent/30 hover:bg-accent/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>

        {/* Content Stats */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border/50">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-accent" />
            <span className="text-sm text-muted-foreground">
              {wordCount.toLocaleString()} words
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-accent" />
            <span className="text-sm text-muted-foreground">
              ~{readTime} min read
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-accent" />
            <Badge variant="outline" className="text-xs border-accent/50 text-accent">
              {config.style} · {config.tone} · {config.audience}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Format Indicator */}
        <div className="mb-6">
          <Badge variant="secondary" className="text-xs">
            {stylePreview.prefix}
          </Badge>
        </div>

        {/* Content Preview */}
        <div className={`prose prose-lg max-w-none ${stylePreview.className}`}>
          <div className="bg-background/50 rounded-lg p-6 border border-border/50">
            <div className="whitespace-pre-wrap text-foreground leading-relaxed">
              {content}
            </div>
          </div>
        </div>

        {/* SEO Preview */}
        <Separator className="my-8" />
        
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">SEO Preview</h4>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h5 className="text-blue-600 text-lg font-medium cursor-pointer hover:underline">
              {theme.theme_name}: A Comprehensive Guide
            </h5>
            <p className="text-green-600 text-sm">
              yoursite.com/blog/{theme.theme_name.toLowerCase().replace(/\s+/g, '-')}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {theme.description || `Explore ${theme.theme_name} with this comprehensive guide covering ${theme.post_count} key insights and actionable strategies.`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};