import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addGoToMarketPosts } from '@/scripts/addGoToMarketPosts';

export const AddGoToMarketPosts: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddPosts = async () => {
    setLoading(true);
    try {
      const success = await addGoToMarketPosts();
      if (success) {
        toast({
          title: "Posts Added",
          description: "Successfully added 4 Go to Market posts to the theme.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add posts. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while adding posts.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-2">Add Go to Market Posts</h3>
      <p className="text-sm text-muted-foreground mb-4">
        This will add 4 posts (Storytelling, Gamification, Virality & Distribution, DOT & Consultants) to theme f49d5042-e1a4-4f9e-b30c-fe73aa545bd8
      </p>
      <Button onClick={handleAddPosts} disabled={loading}>
        {loading ? 'Adding Posts...' : 'Add Go to Market Posts'}
      </Button>
    </div>
  );
};