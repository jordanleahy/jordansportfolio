import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Calendar, Share2, BookmarkPlus, Heart } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

// Mock blog content - replace with real data later
const getBlogPost = (id: string) => {
  const posts = {
    "design-systems-at-scale": {
      title: "Building Design Systems at Scale",
      subtitle: "How we created a unified design language across 50+ product teams and reduced design debt by 40%",
      date: "2024-01-15",
      readTime: "8 min read",
      category: "Design Systems",
      author: "Jordan Holt",
      content: [
        {
          type: "paragraph",
          content: "Design systems have become the backbone of modern product development. But scaling them across large organizations presents unique challenges that go far beyond creating a component library."
        },
        {
          type: "image",
          src: "/placeholder.svg",
          alt: "Design system components",
          caption: "Our unified component library serving 50+ product teams"
        },
        {
          type: "heading",
          level: 2,
          content: "The Challenge"
        },
        {
          type: "paragraph",
          content: "When I joined the company, we had 15 different design systems across various product lines. Each team was solving the same problems independently, leading to inconsistent user experiences and massive duplication of effort."
        },
        {
          type: "quote",
          content: "We were essentially building 15 different products that happened to share the same brand.",
          author: "Design team lead"
        },
        {
          type: "paragraph",
          content: "The impact was significant: 40% longer development cycles, inconsistent user experiences, and design debt that was growing exponentially. Something had to change."
        },
        {
          type: "heading",
          level: 2,
          content: "The Solution"
        },
        {
          type: "paragraph",
          content: "We embarked on a comprehensive design system initiative that would unify all product teams under a single, scalable design language. This wasn't just about creating components – it was about changing how we work."
        },
        {
          type: "list",
          items: [
            "Established a centralized design system team",
            "Created adoption incentives for product teams",
            "Built automated tooling for consistency checks",
            "Implemented gradual migration strategies"
          ]
        },
        {
          type: "image",
          src: "/placeholder.svg",
          alt: "Design system adoption metrics",
          caption: "Adoption rates across teams over 12 months"
        },
        {
          type: "heading",
          level: 2,
          content: "Key Insights"
        },
        {
          type: "paragraph",
          content: "The most important lesson was that design systems are not just about design – they're about organizational change. Success required buy-in from engineering leadership, product management, and executive stakeholders."
        },
        {
          type: "paragraph",
          content: "We learned that gradual adoption works better than forced migration. Teams that chose to adopt early became our strongest advocates and helped refine the system for others."
        },
        {
          type: "heading",
          level: 2,
          content: "Results"
        },
        {
          type: "paragraph",
          content: "After 18 months of implementation, we achieved remarkable results that exceeded our initial goals:"
        },
        {
          type: "metrics",
          data: [
            { label: "Design debt reduction", value: "40%" },
            { label: "Faster development cycles", value: "30%" },
            { label: "Team adoption rate", value: "95%" },
            { label: "User satisfaction increase", value: "25%" }
          ]
        },
        {
          type: "paragraph",
          content: "The design system became more than a tool – it became a catalyst for better collaboration and shared understanding across the entire organization."
        }
      ]
    }
  };
  
  return posts[id as keyof typeof posts] || null;
};

const BlogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<any>(null);
  const { scrollYProgress } = useScroll();
  
  // Parallax effects for mobile storytelling
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    if (id) {
      const blogPost = getBlogPost(id);
      setPost(blogPost);
    }
  }, [id]);

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <Link to="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  const renderContent = (block: any, index: number) => {
    const baseDelay = index * 0.1;

    switch (block.type) {
      case "paragraph":
        return (
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: baseDelay }}
            className="text-lg leading-relaxed mb-6 text-foreground/90"
          >
            {block.content}
          </motion.p>
        );

      case "heading":
        const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: baseDelay }}
          >
            <HeadingTag className={`font-bold mb-6 mt-12 ${
              block.level === 2 ? "text-3xl" : "text-2xl"
            }`}>
              {block.content}
            </HeadingTag>
          </motion.div>
        );

      case "image":
        return (
          <motion.figure
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: baseDelay, duration: 0.6 }}
            className="my-12"
          >
            <div className="aspect-video bg-muted rounded-lg mb-4"></div>
            {block.caption && (
              <figcaption className="text-sm text-muted-foreground text-center italic">
                {block.caption}
              </figcaption>
            )}
          </motion.figure>
        );

      case "quote":
        return (
          <motion.blockquote
            key={index}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: baseDelay }}
            className="border-l-4 border-primary pl-6 my-8 bg-muted/30 py-6 rounded-r-lg"
          >
            <p className="text-xl italic mb-3">&ldquo;{block.content}&rdquo;</p>
            {block.author && (
              <cite className="text-sm text-muted-foreground">— {block.author}</cite>
            )}
          </motion.blockquote>
        );

      case "list":
        return (
          <motion.ul
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: baseDelay }}
            className="space-y-3 mb-6 ml-6"
          >
            {block.items.map((item: string, itemIndex: number) => (
              <motion.li
                key={itemIndex}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: baseDelay + itemIndex * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                <span className="text-lg leading-relaxed">{item}</span>
              </motion.li>
            ))}
          </motion.ul>
        );

      case "metrics":
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: baseDelay }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 my-12"
          >
            {block.data.map((metric: any, metricIndex: number) => (
              <motion.div
                key={metricIndex}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: baseDelay + metricIndex * 0.1 }}
                className="text-center p-6 bg-card rounded-lg border"
              >
                <div className="text-3xl font-bold text-primary mb-2">
                  {metric.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {metric.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-50 origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-40"
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/blog">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <BookmarkPlus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section with Parallax */}
      <motion.section 
        style={{ y: heroY }}
        className="py-16 px-4 relative overflow-hidden"
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6">{post.category}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              {post.title}
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              {post.subtitle}
            </p>
            
            <div className="flex items-center gap-6 text-muted-foreground mb-8">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(post.date).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {post.readTime}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Featured Image */}
      <motion.section
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="px-4 mb-16"
      >
        <div className="max-w-5xl mx-auto">
          <div className="aspect-video bg-muted rounded-xl"></div>
        </div>
      </motion.section>

      {/* Article Content */}
      <article className="px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          {post.content.map((block: any, index: number) => 
            renderContent(block, index)
          )}
        </div>
      </article>

      {/* Article Footer */}
      <section className="py-12 px-4 border-t bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h3 className="text-2xl font-bold mb-4">Thanks for reading!</h3>
            <p className="text-muted-foreground mb-8">
              If you enjoyed this story, consider following me for more design insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/blog">
                <Button variant="outline">Read More Stories</Button>
              </Link>
              <Button>Follow on LinkedIn</Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default BlogDetail;