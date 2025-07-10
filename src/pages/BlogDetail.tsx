import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, Calendar, Share2, BookmarkPlus, Heart, Brain, MessageSquare, Lightbulb, TrendingUp, DollarSign, Users, AlertTriangle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import HeroParallaxDemo from "@/components/hero-parallax-demo";

// Mock blog content - replace with real data later
const cdiAiOpportunityContent = [
  {
    type: "hero-section",
    title: "Manual Chart Review Overload in CDI: The AI Opportunity",
    subtitle: "How AI can revolutionize CDI by reducing manual burdens and boosting hospital revenue"
  },
  {
    type: "manual-inefficiencies",
    title: "Manual Work Inefficiencies",
    stats: [
      {
        value: "55%",
        description: "of CDI pros spend 6–7 hours/day reviewing charts",
        quote: "I feel like I'm drowning in paperwork instead of focusing on what matters most - patient care quality." 
      },
      {
        value: "70%",
        description: "of that work is routine and automatable",
        quote: "So much of what I do daily could be handled by smart technology, freeing me for complex cases."
      }
    ]
  },
  {
    type: "bottleneck-impact",
    title: "Bottleneck Impact",
    chartData: {
      timeSpent: [
        { category: "Chart Review", hours: 6, color: "#ef4444" },
        { category: "Query Writing", hours: 1.5, color: "#f97316" },
        { category: "Strategic Analysis", hours: 0.5, color: "#22c55e" }
      ],
      missedRevenue: {
        baseline: 100,
        withBottlenecks: 75,
        potential: 125
      }
    }
  },
  {
    type: "ai-advantage",
    title: "The AI Advantage",
    comparison: {
      without: {
        title: "Without AI",
        steps: [
          "Manual chart screening",
          "Time-intensive documentation review", 
          "Delayed query generation",
          "Reactive compliance checking"
        ]
      },
      with: {
        title: "With AI",
        steps: [
          "AI-powered chart prioritization",
          "Automated documentation analysis",
          "Real-time query suggestions", 
          "Proactive compliance monitoring"
        ]
      }
    }
  },
  {
    type: "roi-impact",
    title: "ROI & Real Impact",
    metrics: [
      {
        value: "+5%",
        label: "Case Mix Index",
        description: "Improved accuracy in severity documentation leads to better case mix performance",
        caseStudy: "Regional Medical Center saw CMI increase from 1.42 to 1.49 within 6 months"
      },
      {
        value: "+50%",
        label: "CDI Productivity", 
        description: "AI automation allows specialists to review 50% more cases per day",
        caseStudy: "Mercy Health reduced average chart review time from 45 to 22 minutes"
      },
      {
        value: ">$2M",
        label: "Net Revenue Gains",
        description: "Combined productivity and accuracy improvements drive significant revenue increases",
        caseStudy: "450-bed hospital system achieved $2.3M additional revenue in first year"
      }
    ]
  },
  {
    type: "investor-insight",
    title: "Investor Insight", 
    marketData: [
      {
        metric: "Annual Growth Rate",
        value: "12.5%",
        description: "CDI market growing rapidly as hospitals prioritize revenue optimization"
      },
      {
        metric: "Total Market Size",
        value: "$3.8B",
        description: "Global CDI software market expected to reach $3.8B by 2028"
      },
      {
        metric: "CFO Priority",
        value: "90%",
        description: "of hospital CFOs prioritize CDI technology investments"
      }
    ],
    forecast: {
      year1: 100,
      year2: 135,
      year3: 180
    }
  },
  {
    type: "closing-cta",
    title: "Ready to Explore the Opportunity?",
    description: "Discover detailed market analysis and investment insights in our comprehensive CDI brief",
    buttonText: "Explore CDI Investment Brief →"
  }
];

const getBlogPost = (id: string) => {
  const posts = {
    "cdi-ai-opportunity": {
      title: "Manual Chart Review Overload in CDI: The AI Opportunity",
      subtitle: "How AI can revolutionize CDI by reducing manual burdens and boosting hospital revenue",
      author: "Jordan Leigh",
      date: "2024-01-25",
      readTime: "6 min read",
      category: "Healthcare Investment",
      content: cdiAiOpportunityContent
    },
    "ai-transform-cdi": {
      title: "How Will AI Transform CDI?",
      subtitle: "AI isn't just enhancing Clinical Documentation Integrity — it's reshaping it.",
      date: "2024-01-20",
      readTime: "12 min read",
      category: "Healthcare AI",
      author: "Healthcare Innovation Team",
      content: [
        {
          type: "hero-title",
          content: "How Will AI Transform CDI?",
          subtitle: "AI isn't just enhancing CDI — it's reshaping it."
        },
        {
          type: "pain-points",
          title: "Today's Pain Points",
          points: [
            {
              title: "Manual Chart Review Overload",
              description: "CDI specialists spend 70% of their time on routine chart reviews that could be automated",
              severity: "high"
            },
            {
              title: "Late-Stage Detection",
              description: "Critical documentation gaps discovered only after discharge, missing revenue opportunities",
              severity: "critical"
            },
            {
              title: "Inconsistent Query Quality",
              description: "Variations in query specificity and clinical accuracy across different specialists",
              severity: "medium"
            },
            {
              title: "Documentation-Reality Disconnect",
              description: "Gaps between what was documented and what was clinically true, affecting quality scores",
              severity: "critical"
            }
          ]
        },
        {
          type: "ai-solutions",
          title: "What AI Will Do Differently",
          solutions: [
            {
              step: 1,
              title: "Intelligent Chart Prioritization",
              description: "AI algorithms will analyze patient records in real-time, scoring and ranking cases by documentation risk and revenue impact.",
              icon: "brain"
            },
            {
              step: 2,
              title: "Automated Query Generation",
              description: "Context-aware AI will draft precise clinical queries based on documentation patterns and medical necessity criteria.",
              icon: "message-square"
            },
            {
              step: 3,
              title: "Real-Time Documentation Guidance",
              description: "Embedded AI assistants will provide live suggestions to physicians during documentation, preventing gaps before they occur.",
              icon: "lightbulb"
            },
            {
              step: 4,
              title: "Predictive Quality Analytics",
              description: "Machine learning models will forecast quality outcomes and identify process improvements before issues impact scores.",
              icon: "trending-up"
            }
          ]
        },
        {
          type: "operations-impact",
          title: "What This Means for CDI Operations",
          impacts: [
            {
              icon: "clock",
              title: "Time Reallocation",
              before: "70% routine review, 30% complex cases",
              after: "20% routine oversight, 80% strategic analysis"
            },
            {
              icon: "dollar-sign",
              title: "Revenue Impact",
              before: "$2-4M annual missed revenue per hospital",
              after: "15-25% improvement in case mix index accuracy"
            },
            {
              icon: "trending-up",
              title: "Quality Outcomes",
              before: "Reactive quality management",
              after: "Proactive quality optimization with predictive insights"
            },
            {
              icon: "users",
              title: "Team Evolution",
              before: "CDI specialists as chart reviewers",
              after: "CDI specialists as clinical documentation strategists"
            }
          ]
        },
        {
          type: "industry-leaders",
          title: "Who's Leading This Today?",
          companies: [
            {
              name: "Nuance",
              description: "Dragon Medical One with AI-powered clinical documentation",
              focus: "Real-time speech recognition and clinical intelligence"
            },
            {
              name: "3M",
              description: "360 Encompass System with predictive analytics",
              focus: "Computer-assisted coding and quality analytics"
            },
            {
              name: "Optum",
              description: "CDI solutions with machine learning capabilities",
              focus: "Risk adjustment and documentation optimization"
            },
            {
              name: "Dolbey",
              description: "Fusion CAC with natural language processing",
              focus: "Automated coding and clinical documentation improvement"
            }
          ],
          citations: [
            "AHIMA: 'AI in Health Information Management' - 2024",
            "Healthcare Financial Management: 'CDI Technology Trends' - 2024",
            "Journal of AHIMA: 'Future of Clinical Documentation' - 2023"
          ]
        },
        {
          type: "visual-break",
          quote: "AI won't replace CDI specialists — it will elevate them from chart reviewers to clinical documentation strategists."
        },
        {
          type: "tldr",
          title: "TL;DR",
          points: [
            "AI will automate 70% of routine CDI tasks, freeing specialists for strategic work",
            "Real-time documentation guidance will prevent gaps before they occur",
            "Predictive analytics will transform CDI from reactive to proactive",
            "Early adopters are already seeing 15-25% improvements in case mix accuracy",
            "The future CDI specialist will be a clinical documentation strategist, not just a chart reviewer"
          ]
        }
      ]
    },
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

      case "hero-title":
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
            className="text-center py-16 mb-16 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {block.content}
            </h1>
            <p className="text-2xl text-muted-foreground italic">
              {block.subtitle}
            </p>
          </motion.div>
        );

      case "pain-points":
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="my-16"
          >
            <h2 className="text-3xl font-bold mb-8 text-center">{block.title}</h2>
            <div className="grid gap-6">
              {block.points.map((point: any, pointIndex: number) => (
                <motion.div
                  key={pointIndex}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: pointIndex * 0.2 }}
                  className="group cursor-pointer"
                >
                  <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-destructive">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${
                        point.severity === 'critical' ? 'bg-destructive/10' :
                        point.severity === 'high' ? 'bg-orange-500/10' : 'bg-yellow-500/10'
                      }`}>
                        <AlertTriangle className={`h-5 w-5 ${
                          point.severity === 'critical' ? 'text-destructive' :
                          point.severity === 'high' ? 'text-orange-500' : 'text-yellow-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{point.title}</h3>
                        <p className="text-muted-foreground group-hover:text-foreground transition-colors">
                          {point.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case "ai-solutions":
        const getIcon = (iconName: string) => {
          switch (iconName) {
            case 'brain': return Brain;
            case 'message-square': return MessageSquare;
            case 'lightbulb': return Lightbulb;
            case 'trending-up': return TrendingUp;
            default: return Brain;
          }
        };

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="my-16"
          >
            <h2 className="text-3xl font-bold mb-8 text-center">{block.title}</h2>
            <div className="grid gap-8">
              {block.solutions.map((solution: any, solutionIndex: number) => {
                const IconComponent = getIcon(solution.icon);
                return (
                  <motion.div
                    key={solutionIndex}
                    initial={{ opacity: 0, x: solutionIndex % 2 === 0 ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: solutionIndex * 0.2 }}
                  >
                    <Card className="p-8 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-start gap-6">
                        <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                          <div className="text-2xl font-bold text-primary mr-2">
                            {solution.step}
                          </div>
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-semibold mb-3">{solution.title}</h3>
                          <p className="text-lg text-muted-foreground leading-relaxed">
                            {solution.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        );

      case "operations-impact":
        const getImpactIcon = (iconName: string) => {
          switch (iconName) {
            case 'clock': return Clock;
            case 'dollar-sign': return DollarSign;
            case 'trending-up': return TrendingUp;
            case 'users': return Users;
            default: return Clock;
          }
        };

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="my-16"
          >
            <h2 className="text-3xl font-bold mb-8 text-center">{block.title}</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {block.impacts.map((impact: any, impactIndex: number) => {
                const IconComponent = getImpactIcon(impact.icon);
                return (
                  <motion.div
                    key={impactIndex}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: impactIndex * 0.15 }}
                  >
                    <Card className="p-6 h-full hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <IconComponent className="h-6 w-6 text-primary" />
                        <h3 className="text-xl font-semibold">{impact.title}</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                          <p className="text-sm text-muted-foreground mb-1">Before:</p>
                          <p className="text-foreground">{impact.before}</p>
                        </div>
                        <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                          <p className="text-sm text-muted-foreground mb-1">With AI:</p>
                          <p className="text-foreground">{impact.after}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        );

      case "industry-leaders":
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="my-16"
          >
            <h2 className="text-3xl font-bold mb-8 text-center">{block.title}</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {block.companies.map((company: any, companyIndex: number) => (
                <motion.div
                  key={companyIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: companyIndex * 0.1 }}
                >
                  <Card className="p-6 h-full hover:shadow-lg transition-all duration-300">
                    <h3 className="text-xl font-bold mb-2 text-primary">{company.name}</h3>
                    <p className="text-muted-foreground mb-3">{company.description}</p>
                    <p className="text-sm font-medium text-foreground">{company.focus}</p>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-muted/30 p-6 rounded-lg"
            >
              <h4 className="font-semibold mb-3">Sources:</h4>
              <ul className="space-y-2">
                {block.citations.map((citation: string, citationIndex: number) => (
                  <li key={citationIndex} className="text-sm text-muted-foreground">
                    • {citation}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        );

      case "visual-break":
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 1.05 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="my-20 py-16 px-8 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl text-center"
          >
            <blockquote className="text-2xl md:text-3xl font-medium italic text-foreground/90 leading-relaxed">
              &ldquo;{block.quote}&rdquo;
            </blockquote>
          </motion.div>
        );

      case "tldr":
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="my-16 p-8 bg-primary/5 rounded-2xl border border-primary/20"
          >
            <h2 className="text-2xl font-bold mb-6 text-center">{block.title}</h2>
            <ul className="space-y-4">
              {block.points.map((point: string, pointIndex: number) => (
                <motion.li
                  key={pointIndex}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: pointIndex * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <span className="text-lg leading-relaxed">{point}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        );

      case "hero-section":
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
            className="text-center py-20 mb-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {block.title}
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground italic max-w-4xl mx-auto">
                {block.subtitle}
              </p>
            </div>
          </motion.div>
        );

      case "manual-inefficiencies":
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="my-16"
          >
            <h2 className="text-3xl font-bold mb-8 text-center">{block.title}</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {block.stats.map((stat: any, statIndex: number) => (
                <motion.div
                  key={statIndex}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: statIndex * 0.3 }}
                  className="group cursor-pointer"
                >
                  <Card className="p-8 hover:shadow-xl transition-all duration-500 border-l-4 border-l-primary group-hover:scale-105">
                    <div className="text-center mb-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: statIndex * 0.3 + 0.2, type: "spring" }}
                        className="text-6xl font-bold text-primary mb-3"
                      >
                        {stat.value}
                      </motion.div>
                      <p className="text-lg text-muted-foreground mb-4">
                        {stat.description}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-muted/50 p-4 rounded-lg">
                      <p className="italic text-foreground/80 text-center">
                        "{stat.quote}"
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case "bottleneck-impact":
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="my-20"
          >
            <h2 className="text-3xl font-bold mb-8 text-center">{block.title}</h2>
            <Card className="p-8">
              <div className="grid md:grid-cols-2 gap-12">
                {/* Time Spent Chart */}
                <div>
                  <h3 className="text-xl font-semibold mb-6">Daily Time Allocation</h3>
                  <div className="space-y-4">
                    {block.chartData.timeSpent.map((item: any, itemIndex: number) => (
                      <motion.div
                        key={itemIndex}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(item.hours / 8) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: itemIndex * 0.2, duration: 1 }}
                        className="relative"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">{item.category}</span>
                          <span className="text-sm text-muted-foreground">{item.hours}h</span>
                        </div>
                        <div className="w-full bg-muted h-3 rounded-full">
                          <motion.div
                            className="h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${(item.hours / 8) * 100}%` }}
                            viewport={{ once: true }}
                            transition={{ delay: itemIndex * 0.2, duration: 1 }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Revenue Impact */}
                <div>
                  <h3 className="text-xl font-semibold mb-6">Revenue Impact</h3>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-4 bg-destructive/5 rounded-lg">
                      <span>Current Performance</span>
                      <span className="text-2xl font-bold text-destructive">{block.chartData.missedRevenue.withBottlenecks}%</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                      <span>Baseline</span>
                      <span className="text-2xl font-bold">{block.chartData.missedRevenue.baseline}%</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-green-500/5 rounded-lg">
                      <span>AI-Enhanced Potential</span>
                      <span className="text-2xl font-bold text-green-600">{block.chartData.missedRevenue.potential}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        );

      case "ai-advantage":
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="my-20"
          >
            <h2 className="text-3xl font-bold mb-8 text-center">{block.title}</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Without AI */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-6 h-full border-destructive/20 bg-destructive/5">
                  <h3 className="text-2xl font-bold mb-6 text-center text-destructive">
                    {block.comparison.without.title}
                  </h3>
                  <div className="space-y-4">
                    {block.comparison.without.steps.map((step: string, stepIndex: number) => (
                      <motion.div
                        key={stepIndex}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 + stepIndex * 0.1 }}
                        className="flex items-center gap-3 p-3 bg-background/50 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-destructive/20 rounded-full flex items-center justify-center text-sm font-bold text-destructive">
                          {stepIndex + 1}
                        </div>
                        <span className="text-foreground/80">{step}</span>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>

              {/* With AI */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <Card className="p-6 h-full border-green-500/20 bg-green-500/5">
                  <h3 className="text-2xl font-bold mb-6 text-center text-green-600">
                    {block.comparison.with.title}
                  </h3>
                  <div className="space-y-4">
                    {block.comparison.with.steps.map((step: string, stepIndex: number) => (
                      <motion.div
                        key={stepIndex}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6 + stepIndex * 0.1 }}
                        className="flex items-center gap-3 p-3 bg-background/50 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-sm font-bold text-green-600">
                          {stepIndex + 1}
                        </div>
                        <span className="text-foreground/80">{step}</span>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        );

      case "roi-impact":
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="my-20"
          >
            <h2 className="text-3xl font-bold mb-8 text-center">{block.title}</h2>
            <div className="space-y-8">
              {block.metrics.map((metric: any, metricIndex: number) => (
                <motion.div
                  key={metricIndex}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: metricIndex * 0.2 }}
                  className="group cursor-pointer"
                >
                  <Card className="p-8 hover:shadow-xl transition-all duration-500 group-hover:scale-[1.02]">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <div className="text-center md:text-left">
                        <div className="text-5xl font-bold text-primary mb-2">{metric.value}</div>
                        <div className="text-xl font-semibold mb-3">{metric.label}</div>
                        <p className="text-muted-foreground leading-relaxed">{metric.description}</p>
                      </div>
                      <div className="md:flex-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <p className="text-sm font-medium text-foreground/80">
                            Case Study: {metric.caseStudy}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case "investor-insight":
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="my-20"
          >
            <h2 className="text-3xl font-bold mb-8 text-center">{block.title}</h2>
            
            {/* Market Data Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {block.marketData.map((data: any, dataIndex: number) => (
                <motion.div
                  key={dataIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: dataIndex * 0.15 }}
                >
                  <Card className="p-6 text-center hover:shadow-lg transition-all duration-300">
                    <div className="text-4xl font-bold text-primary mb-3">{data.value}</div>
                    <div className="text-lg font-semibold mb-2">{data.metric}</div>
                    <p className="text-sm text-muted-foreground">{data.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* 3-Year Forecast */}
            <Card className="p-8">
              <h3 className="text-xl font-semibold mb-6 text-center">3-Year Market Forecast</h3>
              <div className="flex justify-between items-end h-32 gap-4">
                {Object.entries(block.forecast).map(([year, value], forecastIndex) => (
                  <motion.div
                    key={year}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${(value as number / 180) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: forecastIndex * 0.2, duration: 1 }}
                    className="flex-1 bg-gradient-to-t from-primary to-primary/60 rounded-t-lg flex items-end justify-center relative"
                  >
                    <div className="absolute -top-8 text-sm font-bold text-primary">
                      {String(value)}%
                    </div>
                    <div className="absolute -bottom-8 text-sm text-muted-foreground">
                      Year {forecastIndex + 1}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        );

      case "closing-cta":
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="my-20"
          >
            <Card className="p-12 text-center bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <h2 className="text-3xl font-bold mb-4">{block.title}</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {block.description}
              </p>
              <Button size="lg" className="text-lg px-8 py-4">
                {block.buttonText}
              </Button>
            </Card>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden" style={{ touchAction: 'pan-y' }}>
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

      {/* Hero Parallax Section */}
      <HeroParallaxDemo />

      {/* Article Content */}
      <article className="px-4 pb-16 overflow-x-hidden">
        <div className="max-w-3xl mx-auto w-full">
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