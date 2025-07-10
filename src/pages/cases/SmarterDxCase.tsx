import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Brain, Users, TrendingUp, Clock } from "lucide-react";
import { Link } from "react-router-dom";
const SmarterDxCase = () => {
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header initial={{
      opacity: 0,
      y: -20
    }} animate={{
      opacity: 1,
      y: 0
    }} className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
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
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-xl bg-blue-500/10">
                <Brain className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Improve Sepsis Diagnosis Rates</h1>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">My Role</h3>
                <p>Lead Product Designer</p>
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">Timeline</h3>
                <p>January 2023 - June 2023</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {["#RCM", "#LLM", "#ICD-10", "#Clinical AI"].map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }}>
            <h2 className="text-3xl font-bold mb-6">The Challenge</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">Clinical documentation accuracy directly impacts patient care and hospital revenue. Physicians were spending 15+ minutes per case manually reviewing AI-suggested diagnoses, creating bottlenecks in an already time-pressed healthcare environment.</p>
          </motion.div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Design Process</h2>
          
          <div className="space-y-12">
            <motion.div initial={{
            opacity: 0,
            x: -30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }}>
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">1. Clinical Research & User Interviews</h3>
                <p className="text-muted-foreground mb-4">
                  Conducted 12 interviews with hospitalists, CDI specialists, and coders to understand current diagnosis review workflows and pain points.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm italic">"I need to see the evidence trail - how did the AI arrive at this diagnosis?"</p>
                  <p className="text-xs text-muted-foreground mt-2">- Hospitalist, 250-bed hospital</p>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            x: 30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }}>
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">2. Journey Mapping & Workflow Analysis</h3>
                <p className="text-muted-foreground">
                  Mapped the complete diagnosis review journey from chart access to final coding submission, identifying 7 critical decision points where clinicians needed additional context.
                </p>
              </Card>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            x: -30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }}>
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">3. Rapid Prototyping & Clinical Validation</h3>
                <p className="text-muted-foreground">
                  Built and tested 3 dashboard concepts with real clinical data, iterating based on physician feedback to create an evidence-based interface that builds trust in AI recommendations.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Impact & Results</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.1
          }}>
              <Card className="text-center p-6">
                <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-blue-600 mb-2">60%</h3>
                <p className="text-muted-foreground">Reduction in diagnosis review time</p>
              </Card>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.2
          }}>
              <Card className="text-center p-6">
                <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-green-600 mb-2">95%</h3>
                <p className="text-muted-foreground">Physician adoption rate</p>
              </Card>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.3
          }}>
              <Card className="text-center p-6">
                <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-purple-600 mb-2">$2.1M</h3>
                <p className="text-muted-foreground">Annual revenue recovery improvement</p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }}>
            <h2 className="text-3xl font-bold mb-6">Ready to discuss your healthcare design challenge?</h2>
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
    </div>;
};
export default SmarterDxCase;