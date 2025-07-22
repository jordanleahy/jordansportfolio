
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Plus, TrendingUp, Star } from 'lucide-react';
import { useEnhancedPrompts } from '@/hooks/useEnhancedPrompts';

export const QuickActions = () => {
  const { data: recentPrompts } = useEnhancedPrompts({});
  const { data: favoritePrompts } = useEnhancedPrompts({ is_favorite: true });

  const stats = {
    total: recentPrompts?.length || 0,
    favorites: favoritePrompts?.length || 0,
    recentlyUsed: recentPrompts?.filter(p => p.last_used_at).length || 0,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Prompt Library
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Prompts</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.favorites}</div>
            <div className="text-xs text-muted-foreground">Favorites</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.recentlyUsed}</div>
            <div className="text-xs text-muted-foreground">Recently Used</div>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button size="sm" asChild className="w-full">
            <a href="/prompt-library">
              <Lightbulb className="h-4 w-4 mr-2" />
              View Library
            </a>
          </Button>
          <Button size="sm" variant="outline" asChild className="w-full">
            <a href="/prompt-library?tab=favorites">
              <Star className="h-4 w-4 mr-2" />
              My Favorites
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
