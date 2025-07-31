import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useImageSeeds } from '@/hooks/useImageSeeds';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { SocialMediaPost } from '@/types/socialMedia';
import type { ImageSeed } from '@/types/imageSeeds';
import { Loader2, Layers, X } from 'lucide-react';

interface SeedSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: SocialMediaPost;
  onSeedSelect: (postId: string, seedId: string | null) => void;
}

export const SeedSelectionModal: React.FC<SeedSelectionModalProps> = ({
  isOpen,
  onClose,
  post,
  onSeedSelect,
}) => {
  const { toast } = useToast();
  const { getSeedsByCategory, getDefaultSeed } = useImageSeeds();
  const [updating, setUpdating] = useState(false);
  
  const categorySeeds = getSeedsByCategory(post.category);
  const defaultSeed = getDefaultSeed(post.category);
  
  const handleSeedSelect = async (seed: ImageSeed | null) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('social_media_posts')
        .update({ selected_seed_id: seed?.id || null })
        .eq('id', post.id);
      
      if (error) throw error;
      
      onSeedSelect(post.id, seed?.id || null);
      toast({
        title: "Seed Updated",
        description: seed 
          ? `Selected seed: ${seed.name}` 
          : "Cleared seed selection",
      });
      onClose();
    } catch (error) {
      console.error('Error updating seed:', error);
      toast({
        title: "Error",
        description: "Failed to update seed selection",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Select Image Seed
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Category: <span className="font-medium">{post.category}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Seeds help generate consistent image styles across your content.
            </p>
          </div>

          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {/* Option to clear selection */}
              <Button
                variant={!post.selected_seed_id ? "default" : "outline"}
                size="sm"
                onClick={() => handleSeedSelect(null)}
                disabled={updating}
                className="w-full justify-start"
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                <span className="ml-2">No specific seed</span>
                {defaultSeed && (
                  <Badge variant="secondary" className="ml-auto">
                    Default: {defaultSeed.name}
                  </Badge>
                )}
              </Button>

              {/* Available seeds */}
              {categorySeeds.map((seed) => (
                <Button
                  key={seed.id}
                  variant={post.selected_seed_id === seed.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSeedSelect(seed)}
                  disabled={updating}
                  className="w-full justify-start"
                >
                  <Layers className="h-4 w-4" />
                  <div className="flex-1 text-left ml-2">
                    <div className="font-medium">{seed.name}</div>
                    {seed.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {seed.description}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {seed.seed_value}
                  </div>
                  {seed.is_default && (
                    <Badge variant="secondary" className="ml-2">Default</Badge>
                  )}
                </Button>
              ))}
            </div>
          </ScrollArea>

          {categorySeeds.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No seeds available for "{post.category}"</p>
              <p className="text-xs">Create seeds in the admin panel to get started.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};