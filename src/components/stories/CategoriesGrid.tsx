import { CategoryCard } from "./CategoryCard";
import { CategoriesGridProps } from "@/types/stories";

export const CategoriesGrid = ({ 
  themes, 
  onDeleteCategory, 
  selectedThemes,
  onThemeSelect,
  isSelectionMode,
  isGeneratingTheme,
  onCancelGeneration
}: CategoriesGridProps) => {
  const hasPendingShimmer = themes.some(t => t.id?.startsWith('pending-'));

  if (themes.length === 0 && !isGeneratingTheme) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {/* Always show a shimmer card while generating, even if no pending item exists */}
      {isGeneratingTheme && !hasPendingShimmer && (
        <CategoryCard
          key="shimmer"
          theme="Generating theme..."
          themeDescription="Preparing your theme"
          category=""
          postCount={0}
          isShimmer
          isSelectionMode={false}
          isGeneratingTheme={isGeneratingTheme}
          onCancelGeneration={onCancelGeneration}
        />
      )}

      {/* Theme cards */}
      {themes.map((theme) => (
        <CategoryCard
          key={theme.id}
          theme={theme.theme_name}
          themeDescription={theme.description}
          category={theme.category}
          postCount={theme.post_count}
          imageUrl={theme.first_post?.image_url}
          firstPostData={theme.first_post ? {
            title: theme.first_post.title,
            description: theme.first_post.description
          } : undefined}
          onDelete={onDeleteCategory}
          isShimmer={theme.id.startsWith('pending-')}
          isSelected={selectedThemes?.has(theme.id)}
          onSelect={() => onThemeSelect?.(theme.id)}
          isSelectionMode={isSelectionMode}
          isGeneratingTheme={isGeneratingTheme}
          onCancelGeneration={onCancelGeneration}
        />
      ))}
    </div>
  );
};