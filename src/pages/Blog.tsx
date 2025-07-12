import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Calendar, ArrowRight, Plus, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { usePublishedBlogPosts, usePrefetchBlogPost } from "@/hooks/useBlogQueries";
import type { BlogPost } from "@/types/blog";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const Blog = () => {
  const [user, setUser] = useState<User | null>(null);
  
  // Use TanStack Query for blog posts
  const { 
    data: blogPosts = [], 
    isLoading: loading, 
    error
  } = usePublishedBlogPosts();
  
  const prefetchBlogPost = usePrefetchBlogPost();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUser();
  }, []);

  // Handle prefetching on hover for performance
  const handleMouseEnter = (slug: string) => {
    prefetchBlogPost(slug);
  };

  const featuredPost = blogPosts.find(post => post.featured);
  const otherPosts = blogPosts.filter(post => !post.featured);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50"
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Portfolio
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {user && (
              <Link to="/blog-editor">
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  New Post
                </Button>
              </Link>
            )}
            <Button variant="outline" size="sm">
              <a href="#contact">Contact Jordan</a>
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl font-bold mb-4">Design Stories</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Insights, learnings, and behind-the-scenes stories from designing products that matter.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link 
                to={`/blog/${featuredPost.id}`}
                onMouseEnter={() => handleMouseEnter(featuredPost.slug)}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                  <div className="md:flex">
                    <div className="md:w-1/2">
                      <div className="aspect-video bg-muted"></div>
                    </div>
                    <div className="md:w-1/2 p-8">
                      <div className="flex items-start justify-between mb-4">
                        <Badge>{featuredPost.category}</Badge>
                        {user && (
                          <Link to={`/blog-editor/${featuredPost.slug}`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                      <h2 className="text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                        {featuredPost.hero_headline}
                      </h2>
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        {featuredPost.hero_subhead}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(featuredPost.published_at || featuredPost.created_at).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {featuredPost.read_time ? `${featuredPost.read_time} min read` : 'Quick read'}
                        </div>
                      </div>
                      <div className="flex items-center text-primary font-medium group-hover:gap-3 transition-all">
                        Read the story
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Other Posts Grid */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl font-bold mb-8"
          >
            Latest Stories
          </motion.h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link 
                  to={`/blog/${post.id}`}
                  onMouseEnter={() => handleMouseEnter(post.slug)}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300 group">
                    <div className="aspect-video bg-muted"></div>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="secondary">{post.category}</Badge>
                        {user && (
                          <Link to={`/blog-editor/${post.slug}`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                        {post.hero_headline}
                      </h3>
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        {post.hero_subhead}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {post.read_time ? `${post.read_time} min read` : 'Quick read'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-muted-foreground mb-8">
              Get notified when I publish new design insights and case studies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg border border-input bg-background"
              />
              <Button>Subscribe</Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
