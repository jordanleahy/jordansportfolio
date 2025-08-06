import { CategoryCard } from "./CategoryCard";
import { CategoriesGridProps } from "@/types/stories";

export const CategoriesGrid = ({ themes, onDeleteCategory }: CategoriesGridProps) => {
  if (themes.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {/* Theme cards */}
      {themes.map((theme) => (
        <CategoryCard
          key={theme.theme_name}
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
        />
      ))}
    </div>
  );
};