import { CategoryCard } from "./CategoryCard";

interface Theme {
  id: string;
  theme_name: string;
  description: string | null;
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
  onDeleteCategory: (category: string) => void;
}

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
        />
      ))}
    </div>
  );
};