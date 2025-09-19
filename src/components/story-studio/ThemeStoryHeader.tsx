import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { BookOpen, FileText, Calendar, Tag } from 'lucide-react';

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
    image_url?: string;
  }>;
}

interface ThemeStoryHeaderProps {
  theme: ThemeData;
}

export const ThemeStoryHeader: React.FC<ThemeStoryHeaderProps> = ({ theme }) => {
  const getReadinessScore = () => {
    if (theme.post_count >= 5) return { score: 95, label: 'Excellent', color: 'bg-green-500' };
    if (theme.post_count >= 3) return { score: 80, label: 'Good', color: 'bg-blue-500' };
    if (theme.post_count >= 2) return { score: 60, label: 'Fair', color: 'bg-yellow-500' };
    return { score: 30, label: 'Needs More Content', color: 'bg-red-500' };
  };

  const readiness = getReadinessScore();
  const estimatedReadTime = Math.max(2, Math.ceil(theme.post_count * 1.5));

  return (
    <Card className="p-8 bg-gradient-to-r from-card via-card/80 to-accent/5 border-accent/20">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
        {/* Theme Info */}
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="border-accent/50 text-accent">
                <Tag className="h-3 w-3 mr-1" />
                {theme.category}
              </Badge>
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${readiness.color}`} />
                <span className="text-sm text-muted-foreground">
                  Story Readiness: {readiness.label}
                </span>
              </div>
            </div>
            
            <h1 className="text-3xl font-serif font-bold text-foreground leading-tight">
              {theme.theme_name}
            </h1>
            
            {theme.description && (
              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                {theme.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats Panel */}
        <div className="flex-shrink-0">
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:min-w-[200px]">
            <div className="text-center lg:text-right">
              <div className="flex items-center justify-center lg:justify-end space-x-2">
                <FileText className="h-4 w-4 text-accent" />
                <span className="text-2xl font-bold text-foreground">{theme.post_count}</span>
              </div>
              <p className="text-sm text-muted-foreground">Source Posts</p>
            </div>
            
            <div className="text-center lg:text-right">
              <div className="flex items-center justify-center lg:justify-end space-x-2">
                <BookOpen className="h-4 w-4 text-accent" />
                <span className="text-2xl font-bold text-foreground">~{estimatedReadTime}</span>
              </div>
              <p className="text-sm text-muted-foreground">Min Read</p>
            </div>
          </div>
        </div>
      </div>

      {/* Story Readiness Progress */}
      <div className="mt-6 pt-6 border-t border-border/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Story Readiness</span>
          <span className="text-sm text-muted-foreground">{readiness.score}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${readiness.color}`}
            style={{ width: `${readiness.score}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {theme.post_count >= 3 
            ? `Perfect! Your theme has enough content for a comprehensive story.`
            : `Consider adding ${3 - theme.post_count} more posts for a richer narrative.`
          }
        </p>
      </div>
    </Card>
  );
};