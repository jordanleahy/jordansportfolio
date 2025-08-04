import { CategoryCard } from "./CategoryCard";

interface Theme {
  theme: string;
  theme_description: string | null;
  category: string;
  post_count: number;
  first_post: {
    id: string;
    title: string;
    description: string;
    image_url?: string;
  } | null;
}

interface CategoriesGridProps {
  themes: Theme[];
  shimmerThemes?: string[];
  onDeleteCategory?: (category: string) => void;
}

export const CategoriesGrid = ({ themes, shimmerThemes = [], onDeleteCategory }: CategoriesGridProps) => {
  const hasAnyContent = themes.length > 0 || shimmerThemes.length > 0;
  
  if (!hasAnyContent) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {/* Shimmer cards first */}
      {shimmerThemes.map((theme) => (
        <CategoryCard
          key={`shimmer-${theme}`}
          theme={theme}
          category={theme} // fallback for routing
          postCount={0}
          isShimmer={true}
        />
      ))}
      
      {/* Real theme cards */}
      {themes.map((theme) => (
        <CategoryCard
          key={theme.theme}
          theme={theme.theme}
          themeDescription={theme.theme_description}
          category={theme.category}
          postCount={theme.post_count}
          imageUrl={theme.first_post?.image_url}
          firstPostData={theme.first_post ? {
            title: theme.first_post.title,
            description: theme.first_post.description
          } : undefined}
          onDelete={onDeleteCategory}
        />
      ))}
    </div>
  );
};