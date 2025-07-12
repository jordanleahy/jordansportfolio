import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

// Mock blog data - replace with real data later
const blogPosts = [
  {
    id: "why-cdi-needs-ai-now",
    title: "Why CDI Needs AI Now",
    excerpt: "AI is the lifeline for overworked CDI teams struggling to keep up. CDI teams face more charts, fewer staff, and ever-changing payer rules.",
    date: "2024-02-01",
    readTime: "2 min read",
    category: "CDI",
    featured: true,
    image: "/lovable-uploads/b040919d-eb34-428f-ba71-3ee1aba6596b.png"
  },
  {
    id: "cdi-ai-opportunity",
    title: "Manual Chart Review Overload in CDI: The AI Opportunity",
    excerpt: "Discover how AI can revolutionize CDI by reducing manual burdens and boosting hospital revenue with compelling ROI data.",
    date: "2024-01-25",
    readTime: "6 min read",
    category: "Healthcare Investment",
    featured: false,
    image: "/lovable-uploads/b040919d-eb34-428f-ba71-3ee1aba6596b.png"
  },
  {
    id: "ai-transform-cdi",
    title: "How Will AI Transform CDI?",
    excerpt: "AI isn't just enhancing Clinical Documentation Integrity — it's reshaping it. Explore the interactive journey of CDI transformation.",
    date: "2024-01-20",
    readTime: "12 min read",
    category: "Healthcare AI",
    featured: false,
    image: "/lovable-uploads/2cc42ee2-452d-41c2-a353-4d948c656a4a.png"
  },
  {
    id: "design-systems-at-scale",
    title: "Building Design Systems at Scale",
    excerpt: "How we created a unified design language across 50+ product teams and reduced design debt by 40%.",
    date: "2024-01-15",
    readTime: "8 min read",
    category: "Design Systems",
    featured: false,
    image: "/placeholder.svg"
  },
  {
    id: "ai-ux-research",
    title: "AI-Powered UX Research: The Future is Here",
    excerpt: "Exploring how artificial intelligence is transforming user research methodologies and accelerating insights.",
    date: "2024-01-10",
    readTime: "6 min read",
    category: "AI & Research",
    featured: false,
    image: "/placeholder.svg"
  },
  {
    id: "mobile-first-healthcare",
    title: "Mobile-First Design in Healthcare",
    excerpt: "Lessons learned from designing patient-centered mobile experiences in regulated environments.",
    date: "2024-01-05",
    readTime: "10 min read",
    category: "Healthcare UX",
    featured: false,
    image: "/placeholder.svg"
  },
  {
    id: "inclusive-design-practices",
    title: "Inclusive Design: Beyond Accessibility",
    excerpt: "Creating products that work for everyone, not just the majority. Real examples from enterprise software.",
    date: "2023-12-28",
    readTime: "7 min read",
    category: "Inclusive Design",
    featured: false,
    image: "/placeholder.svg"
  }
];

const Blog = () => {
  const featuredPost = blogPosts.find(post => post.featured);
  const otherPosts = blogPosts.filter(post => !post.featured);

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
          <Button variant="outline" size="sm">
            <a href="#contact">Contact Jordan</a>
          </Button>
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
              <Link to={`/blog/${featuredPost.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                  <div className="md:flex">
                    <div className="md:w-1/2">
                      <div className="aspect-video bg-muted"></div>
                    </div>
                    <div className="md:w-1/2 p-8">
                      <Badge className="mb-4">{featuredPost.category}</Badge>
                      <h2 className="text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                        {featuredPost.title}
                      </h2>
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(featuredPost.date).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {featuredPost.readTime}
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
                <Link to={`/blog/${post.id}`}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 group">
                    <div className="aspect-video bg-muted"></div>
                    <CardContent className="p-6">
                      <Badge className="mb-3" variant="secondary">{post.category}</Badge>
                      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(post.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {post.readTime}
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
