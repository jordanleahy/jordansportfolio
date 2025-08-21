import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, ArrowRight, Edit, Plus, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { usePublishedBlogPosts, usePrefetchBlogPost } from "@/hooks/useBlogQueries";
import { useUserRole } from "@/hooks/useUserRole";
import type { BlogPost } from "@/types/blog";
import { PageLayout } from "@/components/layout/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { generateSEOMetadata } from "@/utils/seoHelpers";

const Blog = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  // Generate SEO metadata for blog page
  const blogSEO = generateSEOMetadata({
    title: "Design Stories - Insights & Case Studies",
    description: "Explore design insights, learnings, and behind-the-scenes stories from creating products that matter. Healthcare technology, UX design, and product development insights.",
    image: "/og-blog.png",
    url: "/blog",
    type: "website"
  });

  // Use TanStack Query for blog posts
  const {
    data: blogPosts = [],
    isLoading: loading,
    error
  } = usePublishedBlogPosts();
  const prefetchBlogPost = usePrefetchBlogPost();

  // Handle prefetching on hover for performance
  const handleMouseEnter = (slug: string) => {
    prefetchBlogPost(slug);
  };

  const featuredPost = blogPosts.find(post => post.featured);
  const otherPosts = blogPosts.filter(post => !post.featured);

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading blog posts...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md mx-auto px-4">
            <FileText className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold">Failed to load blog posts</h2>
            <p className="text-muted-foreground">
              There was an error loading the blog posts. Please try again.
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Empty state when no published blogs exist
  if (blogPosts.length === 0) {
    return (
      <PageLayout>
        {/* Hero Section */}
        <section className="py-16 px-4 pt-24">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 animate-fade-in">
              <h1 className="text-5xl font-bold mb-4">Design Stories</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Insights, learnings, and behind-the-scenes stories from designing products that matter.
              </p>
            </div>
          </div>
        </section>

        {/* Empty State */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-6">
              <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto" />
              <div className="space-y-3">
                <h2 className="text-3xl font-bold">No blog posts yet</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Blog posts will appear here once they're published. 
                  {user ? " You can create and publish your first blog post to get started." : " Check back soon for new content!"}
                </p>
              </div>
              
              {user && (
                <div className="pt-4">
                  <Button asChild size="lg">
                    <Link to="/blog-editor">
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Blog Post
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-2xl mx-auto text-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
              <p className="text-muted-foreground mb-8">
                Get notified when new design insights and case studies are published.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="flex-1 px-4 py-2 rounded-lg border border-input bg-background" 
                />
                <Button>Subscribe</Button>
              </div>
            </div>
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>{blogSEO.title}</title>
        <meta name="description" content={blogSEO.description} />
        <meta property="og:title" content={blogSEO.ogTitle} />
        <meta property="og:description" content={blogSEO.ogDescription} />
        <meta property="og:image" content={blogSEO.image} />
        <meta property="og:url" content={blogSEO.url} />
        <meta property="og:type" content={blogSEO.type} />
        <meta property="og:site_name" content={blogSEO.siteName} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={blogSEO.ogTitle} />
        <meta name="twitter:description" content={blogSEO.ogDescription} />
        <meta name="twitter:image" content={blogSEO.image} />
      </Helmet>
      <PageLayout>

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div>
              <Link 
                to={`/blog/${featuredPost.slug}`} 
                onMouseEnter={() => handleMouseEnter(featuredPost.slug)}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                  <div className="md:flex">
                    <div className="md:w-1/2">
                      <div className="blog-image-container">
                        {featuredPost.hero_image_url ? (
                          <img 
                            src={featuredPost.hero_image_url} 
                            alt={featuredPost.hero_headline} 
                            className="blog-index-image" 
                          />
                        ) : (
                          <div className="blog-index-image bg-muted"></div>
                        )}
                      </div>
                    </div>
                    <div className="md:w-1/2 p-8">
                      <div className="flex items-start justify-between mb-4">
                        <Badge>{featuredPost.category}</Badge>
                        {user && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.preventDefault();
                              window.location.href = `/blog-editor/${featuredPost.slug}`;
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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
            </div>
          </div>
        </section>
      )}

      {/* Other Posts Grid */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">
              {featuredPost ? 'Latest Stories' : 'All Stories'}
            </h2>
            
            {user && (
              <Button asChild variant="outline">
                <Link to="/blog-editor">
                  <Plus className="mr-2 h-4 w-4" />
                  New Post
                </Link>
              </Button>
            )}
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherPosts.map((post) => (
              <div key={post.id}>
                <Link 
                  to={`/blog/${post.slug}`} 
                  onMouseEnter={() => handleMouseEnter(post.slug)}
                >
                  <Card className="flex flex-col hover:shadow-lg transition-all duration-300 group">
                    <div className="blog-image-container">
                      {post.hero_image_url ? (
                        <img 
                          src={post.hero_image_url} 
                          alt={post.hero_headline} 
                          className="blog-index-image" 
                        />
                      ) : (
                        <div className="blog-index-image bg-muted"></div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="secondary">{post.category}</Badge>
                        {user && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.preventDefault();
                              window.location.href = `/blog-editor/${post.slug}`;
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-2xl mx-auto text-center">
          <div>
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
          </div>
        </div>
      </section>
      </PageLayout>
    </>
  );
};

export default Blog;
