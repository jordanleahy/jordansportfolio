import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ArrowRight, BookOpen } from "lucide-react";

// Mock blog posts - in real app, these would come from your data source
const blogPosts = [
  {
    id: "cdi-ai-opportunity",
    title: "Manual Chart Review Overload in CDI: The AI Opportunity",
    excerpt: "How AI can revolutionize CDI by reducing manual burdens and boosting hospital revenue by 75%.",
    publishedAt: "2024-01-20",
    readTime: "12 min read",
    category: "Healthcare AI"
  },
  {
    id: "designing-for-healthcare-workflows",
    title: "Designing for Complex Healthcare Workflows",
    excerpt: "How to balance user needs with regulatory requirements in healthcare product design.",
    publishedAt: "2024-01-15",
    readTime: "8 min read",
    category: "Design Process"
  },
  {
    id: "data-visualization-best-practices",
    title: "Data Visualization Best Practices for Healthcare",
    excerpt: "Making complex medical data accessible and actionable for healthcare professionals.",
    publishedAt: "2024-01-08",
    readTime: "6 min read",
    category: "Data Design"
  },
  {
    id: "user-research-in-healthcare",
    title: "User Research in Regulated Healthcare Environments",
    excerpt: "Conducting effective user research while maintaining patient privacy and regulatory compliance.",
    publishedAt: "2024-01-01",
    readTime: "10 min read",
    category: "Research"
  }
];

const BlogTeaser = () => {
  return (
    <section id="blog-teaser" className="py-20 px-4 bg-background">
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {blogPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
              className="h-full"
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 border border-border group cursor-pointer">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex items-center gap-2 text-sm text-accent mb-3">
                    <span className="bg-accent/10 px-2 py-1 rounded-md font-medium">
                      {post.category}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-4 line-clamp-3 flex-grow">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground mt-auto pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                    </div>
                    <span>{post.readTime}</span>
                  </div>
                  
                  <Link
                    to={`/blog/${post.id}`}
                    className="inline-flex items-center gap-2 text-primary font-medium mt-4 hover:text-primary/80 transition-colors group/link"
                  >
                    Read More
                    <ArrowRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

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

export default BlogTeaser;