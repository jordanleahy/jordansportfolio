import { CategoryCard } from "./CategoryCard";

interface CategoriesGridProps {
  categories: string[];
  postCounts: Record<string, number>;
  categoryImages: Record<string, string>;
  shimmerCategories?: string[];
  firstPostsData?: Record<string, { title: string; description: string }>;
}

export const CategoriesGrid = ({ categories, postCounts, categoryImages, shimmerCategories = [], firstPostsData = {} }: CategoriesGridProps) => {
  const hasAnyContent = categories.length > 0 || shimmerCategories.length > 0;
  
  if (!hasAnyContent) {
    return null;
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
          firstPostData={firstPostsData[category]}
        />
      ))}
    </div>
  );
};