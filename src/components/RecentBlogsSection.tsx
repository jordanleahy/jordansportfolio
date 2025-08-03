import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ArrowRight, BookOpen } from "lucide-react";
import { usePublishedBlogPosts } from "@/hooks/useBlogQueries";
import { BlogPost } from "@/types/blog";
import { calculateReadTime, extractPlainText } from "@/types/blog";

const RecentBlogsSection = () => {
  const { data: blogPosts = [], isLoading, error } = usePublishedBlogPosts();

  // Get 6 most recent posts
  const recentPosts = blogPosts.slice(0, 6);

  if (error || recentPosts.length === 0) {
    return null; // Hide section if no posts or error
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getReadTime = (post: BlogPost) => {
    if (post.read_time) return `${post.read_time} min read`;
    
    // Calculate read time from intro content
    const wordCount = post.intro_content ? 
      extractPlainText(post.intro_content).split(/\s+/).length : 0;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));
    return `${readTime} min read`;
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="h-full border border-border animate-pulse">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="bg-muted rounded-md h-4 w-24 mb-3" />
                  <div className="bg-muted rounded-md h-6 w-full mb-3" />
                  <div className="bg-muted rounded-md h-4 w-full mb-2" />
                  <div className="bg-muted rounded-md h-4 w-3/4 mb-4" />
                  <div className="mt-auto pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div className="bg-muted rounded-md h-4 w-20" />
                      <div className="bg-muted rounded-md h-4 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
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
                <Link to={`/blog/${post.slug}`}>
                  <Card className="h-full hover:shadow-xl transition-all duration-300 border border-border group cursor-pointer">
                    {/* Hero Image */}
                    {post.hero_image_url && (
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img
                          src={post.hero_image_url}
                          alt={post.hero_headline}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    )}
                    
                    <CardContent className="p-6 h-full flex flex-col">
                      <div className="flex items-center gap-2 text-sm text-accent mb-3">
                        <span className="bg-accent/10 px-2 py-1 rounded-md font-medium capitalize">
                          {post.category}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {post.hero_headline}
                      </h3>
                      
                      <p className="text-muted-foreground mb-4 line-clamp-3 flex-grow">
                        {post.hero_subhead}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground mt-auto pt-4 border-t border-border">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>{formatDate(post.published_at || post.created_at)}</span>
                        </div>
                        <span>{getReadTime(post)}</span>
                      </div>
                      
                      <div className="inline-flex items-center gap-2 text-primary font-medium mt-4 hover:text-primary/80 transition-colors group/link">
                        Read More
                        <ArrowRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
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