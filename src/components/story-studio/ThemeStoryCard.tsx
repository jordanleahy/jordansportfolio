import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, FileText, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ThemeStoryCardProps {
  themeId: string;
  themeName: string;
  description?: string;
  category: string;
  postCount: number;
  imageUrl?: string;
  className?: string;
}

export const ThemeStoryCard: React.FC<ThemeStoryCardProps> = ({
  themeId,
  themeName,
  description,
  category,
  postCount,
  imageUrl,
  className = ''
}) => {
  const navigate = useNavigate();

  const getReadinessScore = () => {
    if (postCount >= 5) return { score: 95, label: 'Excellent', color: 'bg-green-500' };
    if (postCount >= 3) return { score: 80, label: 'Good', color: 'bg-blue-500' };
    if (postCount >= 2) return { score: 60, label: 'Fair', color: 'bg-yellow-500' };
    return { score: 30, label: 'Needs More', color: 'bg-red-500' };
  };

  const readiness = getReadinessScore();
  const estimatedReadTime = Math.max(3, Math.ceil(postCount * 1.5));
  const isReady = postCount >= 2;

  const handleCreateStory = () => {
    navigate(`/stories/studio/${themeId}`);
  };

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 border-accent/20 hover:border-accent/40 bg-gradient-to-br from-card to-accent/5 ${className}`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="border-accent/50 text-accent text-xs">
                  {category}
                </Badge>
                <div className="flex items-center space-x-1">
                  <div className={`h-2 w-2 rounded-full ${readiness.color}`} />
                  <span className="text-xs text-muted-foreground">
                    {readiness.label}
                  </span>
                </div>
              </div>
              
              <h3 className="font-serif font-bold text-lg text-foreground leading-tight line-clamp-2 group-hover:text-accent transition-colors">
                {themeName}
              </h3>
              
              {description && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {imageUrl && (
              <div className="flex-shrink-0 ml-4">
                <img
                  src={imageUrl}
                  alt={themeName}
                  className="w-16 h-16 rounded-lg object-cover border border-border/50"
                />
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between py-3 border-t border-b border-border/50">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <FileText className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">{postCount}</span>
                <span className="text-xs text-muted-foreground">posts</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">~{estimatedReadTime}</span>
                <span className="text-xs text-muted-foreground">min read</span>
              </div>
            </div>
            
            <Badge 
              variant={isReady ? "default" : "secondary"}
              className={isReady ? "bg-accent hover:bg-accent/90" : ""}
            >
              {isReady ? "Story Ready" : "In Progress"}
            </Badge>
          </div>

          {/* Readiness Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">Story Readiness</span>
              <span className="text-xs text-muted-foreground">{readiness.score}%</span>
            </div>
            <Progress value={readiness.score} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {postCount >= 3 
                ? "Perfect for comprehensive story generation"
                : `Add ${3 - postCount} more posts for optimal story depth`
              }
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Button
              onClick={handleCreateStory}
              className="w-full bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 group/btn"
              size="lg"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              <span>Create Story Blog</span>
              <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Features Preview */}
          <div className="pt-3 border-t border-border/30">
            <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Sparkles className="h-3 w-3" />
                <span>AI-Generated</span>
              </div>
              <div className="flex items-center space-x-1">
                <FileText className="h-3 w-3" />
                <span>SEO Optimized</span>
              </div>
              <div className="flex items-center space-x-1">
                <BookOpen className="h-3 w-3" />
                <span>Multi-Format</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};