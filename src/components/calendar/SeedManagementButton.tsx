import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Layers } from 'lucide-react';
import { SeedSelectionModal } from './SeedSelectionModal';
import { useImageSeeds } from '@/hooks/useImageSeeds';
import type { SocialMediaPost } from '@/types/socialMedia';

interface SeedManagementButtonProps {
  post: SocialMediaPost;
  onSeedSelect: (postId: string, seedId: string | null) => void;
  className?: string;
}

export const SeedManagementButton: React.FC<SeedManagementButtonProps> = ({
  post,
  onSeedSelect,
  className = ""
}) => {
  const [showModal, setShowModal] = useState(false);
  const { getDefaultSeed, getSeedsByCategory } = useImageSeeds();
  
  // Disable seed functionality for CDI category
  const isCDI = post.category === 'cdi';
  
  // Get the currently selected seed or default for the category
  const categorySeeds = getSeedsByCategory(post.category);
  const defaultSeed = getDefaultSeed(post.category);
  const hasSeeds = categorySeeds.length > 0 && !isCDI;
  
  // Determine current seed status
  const getCurrentSeedInfo = () => {
    if (isCDI) {
      return 'Seeds disabled for CDI';
    }
    if (post.selected_seed_id) {
      const selectedSeed = categorySeeds.find(s => s.id === post.selected_seed_id);
      return selectedSeed ? `${selectedSeed.name}` : 'Custom seed';
    }
    return defaultSeed ? `Default: ${defaultSeed.name}` : 'No seed';
  };

  const isSelected = !!post.selected_seed_id;
  const seedInfo = getCurrentSeedInfo();

  return (
    <>
      <Button
        variant={isSelected ? "default" : "outline"}
        size="sm"
        onClick={() => setShowModal(true)}
        className={`hidden md:flex h-8 flex-1 ${className}`}
        title={`Seed: ${seedInfo}`}
        disabled={!hasSeeds}
      >
        <Layers className="h-4 w-4" />
      </Button>

      <SeedSelectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        post={post}
        onSeedSelect={onSeedSelect}
      />
    </>
  );
};