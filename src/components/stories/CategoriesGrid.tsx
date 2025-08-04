import { CategoryCard } from "./CategoryCard";
import { EmptyState } from "./EmptyState";

interface CategoriesGridProps {
  categories: string[];
  postCounts: Record<string, number>;
  categoryImages: Record<string, string>;
  onImportClick?: () => void;
  shimmerCategories?: string[];
}

export const CategoriesGrid = ({ categories, postCounts, categoryImages, onImportClick, shimmerCategories = [] }: CategoriesGridProps) => {
  const hasAnyContent = categories.length > 0 || shimmerCategories.length > 0;
  
  if (!hasAnyContent) {
    return <EmptyState onImportClick={onImportClick} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {/* Shimmer cards first */}
      {shimmerCategories.map((category) => (
        <CategoryCard
          key={`shimmer-${category}`}
          category={category}
          postCount={0}
          isShimmer={true}
        />
      ))}
      
      {/* Real categories */}
      {categories.map((category) => (
        <CategoryCard
          key={category}
          category={category}
          postCount={postCounts[category] || 0}
          imageUrl={categoryImages[category]}
        />
      ))}
    </div>
  );
};