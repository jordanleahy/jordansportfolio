import React, { memo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOptimizedThemes, usePrefetchThemeDetails } from '@/hooks/useOptimizedThemeQueries';
import { useVirtualizedStories } from '@/hooks/useVirtualizedStories';
import { CategoryCard } from './CategoryCard';
import { ThemesSkeleton } from './ThemesSkeleton';
import type { CategoriesGridProps } from '@/types/stories';

// Memoized theme card component
const MemoizedCategoryCard = memo(CategoryCard, (prevProps, nextProps) => {
  return (
    prevProps.theme === nextProps.theme &&
    prevProps.category === nextProps.category &&
    prevProps.postCount === nextProps.postCount &&
    prevProps.isSelectionMode === nextProps.isSelectionMode &&
    prevProps.isSelected === nextProps.isSelected
  );
});

MemoizedCategoryCard.displayName = 'MemoizedCategoryCard';

interface OptimizedCategoriesGridProps extends CategoriesGridProps {
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  pendingTheme?: { theme_name: string; description: string } | null;
}

export const OptimizedCategoriesGrid: React.FC<OptimizedCategoriesGridProps> = memo(({
  themes,
  onDeleteCategory,
  loading = false,
  error = null,
  onRefresh,
  isSelectionMode = false,
  selectedThemes = new Set(),
  onThemeSelect,
  pendingTheme = null,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const prefetchThemeDetails = usePrefetchThemeDetails();
  
  // Use optimized themes if not provided
  const { data: optimizedThemes, isLoading, error: queryError } = useOptimizedThemes();
  const finalThemes = themes || optimizedThemes || [];
  const finalLoading = loading || isLoading;
  const finalError = error || queryError;

  // Virtualization for large lists
  const { virtualItems, totalSize, isVirtualized } = useVirtualizedStories({
    themes: finalThemes,
    containerRef,
    enabled: finalThemes.length > 10,
  });

  // Optimized hover handler with prefetching
  const handleCardHover = useCallback((themeId: string) => {
    prefetchThemeDetails(themeId);
  }, [prefetchThemeDetails]);

  if (finalLoading) {
    return <ThemesSkeleton />;
  }

  if (finalError) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load themes</p>
        {onRefresh && (
          <button onClick={onRefresh} className="mt-2 text-primary hover:underline">
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (finalThemes.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg">No themes created yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Generate your first theme using the form above
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Pending theme at the top */}
      {pendingTheme && (
        <div className="mb-6">
          <CategoryCard
            theme={pendingTheme.theme_name}
            themeDescription={pendingTheme.description}
            category="generating"
            postCount={0}
            isShimmer={true}
            isSelectionMode={false}
            isSelected={false}
            onSelect={() => {}}
          />
        </div>
      )}

      {/* Virtualized or regular grid */}
      <div 
        className="grid gap-6 auto-rows-max"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          height: isVirtualized ? totalSize : 'auto',
        }}
      >
        {virtualItems.map((item) => (
          <div
            key={item.key}
            style={isVirtualized ? {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${item.size}px`,
              transform: `translateY(${item.start}px)`,
            } : undefined}
            onMouseEnter={() => handleCardHover(item.theme.id)}
          >
            <CategoryCard
              theme={item.theme.theme_name}
              themeDescription={item.theme.description}
              category={item.theme.category}
              postCount={item.theme.post_count}
              imageUrl={item.theme.first_post?.image_1_1_url}
              firstPostData={item.theme.first_post ? {
                title: item.theme.first_post.title,
                description: item.theme.first_post.description
              } : undefined}
              onClick={() => navigate(`/stories/theme/${encodeURIComponent(item.theme.theme_name)}`)}
              onDelete={onDeleteCategory}
              isSelectionMode={isSelectionMode}
              isSelected={selectedThemes.has(item.theme.id)}
              onSelect={() => onThemeSelect?.(item.theme.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

OptimizedCategoriesGrid.displayName = 'OptimizedCategoriesGrid';