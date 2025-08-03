import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";
import { usePublishedBlogPosts, usePrefetchBlogPost } from "@/hooks/useBlogQueries";
import { BlogCard } from "@/components/ui/BlogCard";

const RecentBlogsSection = () => {
  const { data: blogPosts = [], isLoading, error } = usePublishedBlogPosts();
  const prefetchBlogPost = usePrefetchBlogPost();

  // Get different number of posts based on screen size
  // On mobile: 3 posts, on larger screens: 6 posts
  const recentPosts = blogPosts.slice(0, 6);
  const mobileRecentPosts = blogPosts.slice(0, 3);

  if (error || recentPosts.length === 0) {
    return null; // Hide section if no posts or error
  }

  // Handle prefetching on hover for performance
  const handleMouseEnter = (slug: string) => {
    prefetchBlogPost(slug);
  };

  return (
    <section id="recent-blogs" className="py-20 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 text-foreground">Latest Articles</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Insights on healthcare product design, user research, and building better digital experiences
          </p>
        </motion.div>

        {isLoading ? (
          <>
            {/* Mobile loading state - 3 items */}
            <div className="grid grid-cols-1 gap-8 mb-12 md:hidden">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="blog-image-container">
                    <div className="blog-index-image bg-muted"></div>
                  </div>
                  <div className="p-6">
                    <div className="bg-muted rounded-md h-4 w-24 mb-3" />
                    <div className="bg-muted rounded-md h-6 w-full mb-3" />
                    <div className="bg-muted rounded-md h-4 w-full mb-2" />
                    <div className="bg-muted rounded-md h-4 w-3/4 mb-4" />
                    <div className="flex items-center gap-4">
                      <div className="bg-muted rounded-md h-4 w-20" />
                      <div className="bg-muted rounded-md h-4 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop loading state - 6 items */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="blog-image-container">
                    <div className="blog-index-image bg-muted"></div>
                  </div>
                  <div className="p-6">
                    <div className="bg-muted rounded-md h-4 w-24 mb-3" />
                    <div className="bg-muted rounded-md h-6 w-full mb-3" />
                    <div className="bg-muted rounded-md h-4 w-full mb-2" />
                    <div className="bg-muted rounded-md h-4 w-3/4 mb-4" />
                    <div className="flex items-center gap-4">
                      <div className="bg-muted rounded-md h-4 w-20" />
                      <div className="bg-muted rounded-md h-4 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Mobile view - 3 posts */}
            <div className="grid grid-cols-1 gap-8 mb-12 md:hidden">
              {mobileRecentPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                  className="h-full"
                >
                  <BlogCard 
                    post={post} 
                    onMouseEnter={handleMouseEnter}
                  />
                </motion.div>
              ))}
            </div>
            {/* Desktop view - 6 posts */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {recentPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                  className="h-full"
                >
                  <BlogCard 
                    post={post} 
                    onMouseEnter={handleMouseEnter}
                  />
                </motion.div>
              ))}
            </div>
          </>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button size="lg" variant="outline" asChild>
            <Link to="/blog" className="inline-flex items-center gap-2">
              <BookOpen size={20} />
              View All Articles
              <ArrowRight size={16} />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default RecentBlogsSection;