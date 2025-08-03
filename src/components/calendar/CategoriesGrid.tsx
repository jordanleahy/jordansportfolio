import { CategoryCard } from "./CategoryCard";
import { EmptyState } from "./EmptyState";

interface CategoriesGridProps {
  categories: string[];
  postCounts: Record<string, number>;
  onImportClick?: () => void;
}

export const CategoriesGrid = ({ categories, postCounts, onImportClick }: CategoriesGridProps) => {
  if (categories.length === 0) {
    return <EmptyState onImportClick={onImportClick} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {categories.map((category) => (
        <CategoryCard
          key={category}
          category={category}
          postCount={postCounts[category] || 0}
        />
      ))}
    </div>
  );
};