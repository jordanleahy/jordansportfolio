import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
              <h1 className="text-4xl font-bold mb-2">Denial and Appeal Management</h1>
              <p className="text-lg text-muted-foreground mb-6">AI-powered prescription denial dashboard with evidence cards and appeal composer.</p>
              
              {/* Hero Image */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative mb-6 rounded-2xl overflow-hidden shadow-lg border border-border/50"
              >
                <img 
                  src="/lovable-uploads/97bfc2ee-31a6-418b-823b-c7835deb9a48.png"
                  alt="Prescription Denials Dashboard – listing rejected claims, extracted clinical evidence, and appeal letter editor"
                  className="w-full h-auto object-cover aspect-video"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent"></div>
              </motion.div>

              <p className="text-base leading-relaxed text-muted-foreground mb-8">
                Denial and Appeal Management automates identification and resolution of prescription claim denials by aggregating clinical evidence and generating editable appeal letters—accelerating reimbursement for small healthcare practices.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">My Role</h3>
                <p>Lead Product Designer</p>
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">Timeline</h3>
                <p>April 2024 – July 2025</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {["#Denials", "#Appeals", "#Templates", "#Payers"].map((tag) => (
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
              Small healthcare practices struggle with prescription claim denials, spending countless hours manually gathering clinical evidence and crafting appeal letters. This administrative burden delays patient care and impacts practice revenue, with denial rates reaching 15-20% for certain medications.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="font-semibold mb-2">Business Impact</h4>
                <p className="text-muted-foreground text-sm">
                  Healthcare practices lose an average of $125,000 annually due to unresolved prescription denials and delayed reimbursements.
                </p>
              </Card>
              <Card className="p-6">
                <h4 className="font-semibold mb-2">Research Challenge</h4>
                <p className="text-muted-foreground text-sm">
                  Healthcare staff spend 60% of their administrative time on denial resolution instead of patient care activities.
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
                <h3 className="text-xl font-bold mb-4">1. Healthcare Practice Observation</h3>
                <p className="text-muted-foreground mb-4">
                  Conducted ethnographic research across 12 healthcare practices, observing staff workflows and pain points in denial management processes.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm italic">"I spend 3 hours every morning just dealing with insurance denials instead of helping patients."</p>
                  <p className="text-xs text-muted-foreground mt-2">- Practice Manager, Family Medicine Clinic</p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">2. Denial Pattern Analysis</h3>
                <p className="text-muted-foreground">
                  Analyzed 2,000+ denial cases to identify common rejection reasons, evidence requirements, and successful appeal strategies.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">3. Automated Evidence Platform</h3>
                <p className="text-muted-foreground">
                  Designed an intelligent system that automatically extracts relevant clinical evidence from patient records and generates customizable appeal templates.
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
                <h3 className="text-xl font-bold mb-3">Smart Evidence Extraction</h3>
                <p className="text-muted-foreground">
                  AI-powered system that automatically identifies and extracts relevant clinical evidence from patient records, reducing manual review time by 80%.
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
                <h3 className="text-xl font-bold mb-3">Customizable Appeal Templates</h3>
                <p className="text-muted-foreground">
                  Pre-built, editable appeal letter templates based on successful cases, with smart field population from extracted evidence.
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
                <h3 className="text-3xl font-bold text-green-600 mb-2">85%</h3>
                <p className="text-muted-foreground">Reduction in time spent on denial resolution</p>
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
                <h3 className="text-3xl font-bold text-purple-600 mb-2">92%</h3>
                <p className="text-muted-foreground">First-time appeal success rate</p>
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
                <h3 className="text-3xl font-bold text-blue-600 mb-2">40%</h3>
                <p className="text-muted-foreground">Increase in practice revenue recovery</p>
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
            <h2 className="text-3xl font-bold mb-6">Need strategic design for healthcare workflows?</h2>
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