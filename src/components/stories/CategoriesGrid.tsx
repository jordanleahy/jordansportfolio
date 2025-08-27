import { CategoryCard } from "./CategoryCard";
import { CategoriesGridProps } from "@/types/stories";
import { SHIMMER_CONSTANTS } from "@/constants/shimmerConstants";
import { LAYOUT_CONSTANTS } from "@/constants/layoutConstants";

export const CategoriesGrid = ({ 
  themes, 
  onDeleteCategory, 
  selectedThemes,
  onThemeSelect,
  isSelectionMode,
  isGeneratingTheme,
  onCancelGeneration,
  getTransitionClasses,
  isThemeTransitioning
}: CategoriesGridProps) => {
  const hasPendingShimmer = themes.some(t => t.id?.startsWith(SHIMMER_CONSTANTS.PREFIXES.PENDING_THEME));

  if (themes.length === 0 && !isGeneratingTheme) {
    return null;
  }

  return (
    <div className={`grid ${LAYOUT_CONSTANTS.GRID.CATEGORIES} ${LAYOUT_CONSTANTS.SPACING.GRID_GAP}`}>
      {/* Theme cards */}
      {themes.map((theme) => {
        return (
          <div key={theme.id}>
            <CategoryCard
              theme={theme.theme_name}
              themeId={theme.id}
              themeDescription={theme.theme_description}
              category={theme.category}
              postCount={theme.post_count}
              imageUrl={theme.first_post?.image_url}
              firstPostData={theme.first_post ? {
                title: theme.first_post.title,
                description: theme.first_post.story_description
              } : undefined}
              onDelete={onDeleteCategory}
              isShimmer={theme.id.startsWith(SHIMMER_CONSTANTS.PREFIXES.PENDING_THEME)}
              isError={theme.theme_name === SHIMMER_CONSTANTS.MESSAGES.GENERATION_FAILED}
              isSelected={selectedThemes?.has(theme.id)}
              onSelect={() => onThemeSelect?.(theme.id)}
              isSelectionMode={isSelectionMode}
              isGeneratingTheme={isGeneratingTheme}
              onCancelGeneration={onCancelGeneration}
            />
          </div>
        );
      })}
    </div>
  );
};