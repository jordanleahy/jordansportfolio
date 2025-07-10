import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Activity, Users, TrendingUp, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const BCGXCase = () => {
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
            <div className="mb-6">
              <h1 className="text-4xl font-bold mb-2">Pharma Workflow Redesign</h1>
              <p className="text-xl text-muted-foreground">BCG X</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">My Role</h3>
                <p>Lead UX Designer & Strategy Consultant</p>
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">Timeline</h3>
                <p>August 2021 - March 2022</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {["#Pharma", "#Research", "#UX", "#Strategy"].map((tag) => (
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
              A Fortune 500 pharmaceutical company was experiencing 30% longer drug development timelines compared to industry standards. Research teams were using disconnected systems, causing collaboration friction and data silos that delayed critical discoveries.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="font-semibold mb-2">Business Impact</h4>
                <p className="text-muted-foreground text-sm">
                  Every month of delay represented $50M+ in lost market opportunity for breakthrough treatments.
                </p>
              </Card>
              <Card className="p-6">
                <h4 className="font-semibold mb-2">Research Challenge</h4>
                <p className="text-muted-foreground text-sm">
                  Scientists were spending 40% of their time on administrative tasks instead of actual research.
                </p>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Design & Strategy Process</h2>
          
          <div className="space-y-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">1. Global Research Team Analysis</h3>
                <p className="text-muted-foreground mb-4">
                  Conducted ethnographic research across 5 countries, observing 40+ researchers in their natural work environments to understand collaboration patterns and workflow inefficiencies.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm italic">"I have the same conversation 6 times with different teams because our systems don't talk to each other."</p>
                  <p className="text-xs text-muted-foreground mt-2">- Senior Research Scientist, Oncology Division</p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">2. Cross-Functional Journey Mapping</h3>
                <p className="text-muted-foreground">
                  Mapped the complete drug discovery journey from target identification to clinical trials, identifying 23 critical handoff points where information was lost or duplicated.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">3. Integrated Platform Design</h3>
                <p className="text-muted-foreground">
                  Designed a unified research platform that connects lab data, collaboration tools, and regulatory documentation, reducing context switching and enabling real-time collaboration across global teams.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Innovations */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Key Design Innovations</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 h-full">
                <Users className="h-8 w-8 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-3">Smart Collaboration Hub</h3>
                <p className="text-muted-foreground">
                  AI-powered recommendation engine that surfaces relevant experts, similar research, and potential collaboration opportunities based on project context.
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
                <Zap className="h-8 w-8 text-yellow-600 mb-4" />
                <h3 className="text-xl font-bold mb-3">Automated Documentation</h3>
                <p className="text-muted-foreground">
                  Intelligent capture of lab results, meeting notes, and research insights that automatically generates regulatory-compliant documentation.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Business Impact</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="text-center p-6">
                <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-green-600 mb-2">25%</h3>
                <p className="text-muted-foreground">Faster time-to-market for new compounds</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="text-center p-6">
                <Activity className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-purple-600 mb-2">65%</h3>
                <p className="text-muted-foreground">Increase in cross-team collaboration</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Card className="text-center p-6">
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-blue-600 mb-2">90%</h3>
                <p className="text-muted-foreground">Research team satisfaction score</p>
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
            <h2 className="text-3xl font-bold mb-6">Need strategic design for complex workflows?</h2>
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

export default BCGXCase;