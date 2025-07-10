import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Database, Palette, BarChart3, Users } from "lucide-react";
import { Link } from "react-router-dom";

const DefinitiveCase = () => {
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
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-xl bg-orange-500/10">
                <Database className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">UI Design System + Reporting</h1>
                
                {/* Hero Image */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="relative mt-4 rounded-2xl overflow-hidden shadow-lg border border-border/50"
                >
                  <img 
                    src="/lovable-uploads/8c1110c1-02c2-4041-987c-a9d030ffef3b.png"
                    alt="UI Design System and reporting dashboard interface"
                    className="w-full h-auto object-cover aspect-video"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent"></div>
                </motion.div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">My Role</h3>
                <p>Senior Product Designer & Design Systems Lead</p>
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">Timeline</h3>
                <p>June 2020 - December 2021</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {["#DesignSystem", "#Analytics", "#Healthcare", "#B2B"].map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-6">The Challenge</h2>
            <p className="text-lg leading-relaxed text-muted-foreground mb-6">
              Definitive Healthcare had 15+ disconnected products with inconsistent user experiences. Healthcare executives were struggling to find insights across different data platforms, leading to low user engagement and high churn rates.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 border-l-4 border-l-destructive">
                <h4 className="font-semibold mb-2 text-destructive">Design Debt</h4>
                <ul className="text-muted-foreground text-sm space-y-1">
                  <li>• 15 different UI patterns for similar functions</li>
                  <li>• 6 months to design new features</li>
                  <li>• 40% customer confusion rate</li>
                </ul>
              </Card>
              <Card className="p-6 border-l-4 border-l-primary">
                <h4 className="font-semibold mb-2 text-primary">Business Need</h4>
                <ul className="text-muted-foreground text-sm space-y-1">
                  <li>• Unified healthcare data experience</li>
                  <li>• Faster time-to-insight for executives</li>
                  <li>• Scalable design for rapid growth</li>
                </ul>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Design System Development</h2>
          
          <div className="space-y-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">1. Healthcare Data Audit & User Research</h3>
                <p className="text-muted-foreground mb-4">
                  Analyzed how 50+ healthcare executives consume market intelligence data, identifying key patterns in decision-making workflows and information hierarchy needs.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm italic">"I need to see trends quickly, then drill down to specifics. Too many clicks kills the insight."</p>
                  <p className="text-xs text-muted-foreground mt-2">- VP of Strategy, Regional Health System</p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">2. Unified Component Library</h3>
                <p className="text-muted-foreground">
                  Built a comprehensive design system with 120+ components optimized for complex healthcare data visualization, ensuring consistency across all product touchpoints.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">3. Advanced Analytics Interface</h3>
                <p className="text-muted-foreground">
                  Designed intelligent dashboards that adapt to user roles and automatically surface relevant healthcare market insights, reducing time-to-insight from hours to minutes.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Components */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Key Design System Features</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 h-full">
                <Palette className="h-8 w-8 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-3">Healthcare-Optimized Components</h3>
                <p className="text-muted-foreground">
                  Purpose-built components for medical data visualization, including patient flow charts, clinical outcome tables, and regulatory compliance indicators.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6 h-full">
                <BarChart3 className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-3">Intelligent Data Visualization</h3>
                <p className="text-muted-foreground">
                  Self-configuring charts and tables that automatically select optimal visualization types based on healthcare data patterns and user context.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">System Impact</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="text-center p-6">
                <Palette className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-blue-600 mb-2">80%</h3>
                <p className="text-muted-foreground">Faster feature development</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="text-center p-6">
                <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-green-600 mb-2">45%</h3>
                <p className="text-muted-foreground">Increase in user engagement</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Card className="text-center p-6">
                <BarChart3 className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-orange-600 mb-2">15+</h3>
                <p className="text-muted-foreground">Products using unified system</p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-6">Need a scalable design system for complex data?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                <a href="#contact">Get in Touch</a>
              </Button>
              <Link to="/">
                <Button variant="outline" size="lg">
                  View More Projects
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default DefinitiveCase;