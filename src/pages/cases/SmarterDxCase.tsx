import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Brain, Users, TrendingUp, Clock, Target, Activity, FileText, Microscope, AlertCircle, CheckCircle, Lightbulb, Eye } from "lucide-react";
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
            <div className="space-y-6 mb-8">
              <div>
                <h1 className="text-4xl font-bold mb-4">Pre-bill Validation Dashboard</h1>
                
                {/* Hero Image */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="relative mt-6 rounded-2xl overflow-hidden shadow-lg border border-border/50"
                >
                  <img 
                    src="/lovable-uploads/4be80a48-e90b-4b76-af9c-259fe703976d.png"
                    alt="Sepsis diagnosis interface showing patient data, SIRS criteria, infection markers, and clinical decision support"
                    className="w-full h-auto object-cover"
                  />
                </motion.div>
              </div>
              
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-8">
                <p className="text-lg text-muted-foreground">
                  <strong>Project Summary:</strong> Redesigned the internal CDS dashboard to validate AI-flagged sepsis opportunities by surfacing clinical evidence in a structured, scroll-free layout—aiming to improve the diagnosis agree rate from 23% to 42%.
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">My Role</h3>
                <div className="space-y-1">
                  <p className="font-semibold">Staff Product Designer</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• End-to-end UX/UI ownership</li>
                    <li>• Led research, product strategy, and workflow design</li>
                  </ul>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">Timeline</h3>
                <div className="space-y-1">
                  <p className="font-semibold">4 months</p>
                  <p className="text-sm text-muted-foreground">March – July 2024</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {["PriorAuth", "Formulary", "MedicalRequirements", "Step Therapy", "Reauthorization"].map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
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
            <h2 className="text-3xl font-bold mb-6">Context & Problem</h2>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-bold mb-3">Healthcare Context</h4>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Sepsis is defined as SIRS (Systemic Inflammatory Response Syndrome) plus suspicion of infection. It is the most commonly denied primary diagnosis across U.S. hospitals. Yet, validating sepsis manually is cognitively demanding and error-prone especially when multiple criteria must be remembered and justified.
                </p>
              </div>
              
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-destructive mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-destructive mb-2">Problem Statement</h4>
                    <p className="text-muted-foreground mb-4">
                      CDS specialists were relying on memory and fragmented data to validate sepsis recommendations—leading to:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <ul className="space-y-2 text-muted-foreground">
                          <li>• <strong className="text-red-600">Low agree rates (23%)</strong></li>
                          <li>• Missed revenue opportunities due to denials</li>
                        </ul>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <ul className="space-y-2 text-muted-foreground">
                          <li>• Inefficient workflows filled with manual cross-checking</li>
                          <li>• High cognitive load and review fatigue</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* My Role & Team */}
      <section className="py-12 px-4">
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
            <h2 className="text-3xl font-bold mb-8">My Role & Team</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6">
                <Users className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-3">My Role</h3>
                <p className="text-muted-foreground mb-2">Staff Product Designer</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• User research</li>
                  <li>• Workflow redesign & prototyping</li>
                  <li>• JSON output design for LLM integration</li>
                </ul>
              </Card>

              <Card className="p-6">
                <Users className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-3">Team & Stakeholders</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 2 Clinical Documentation Specialists (CDS)</li>
                  <li>• 1 Medical Doctor (Sepsis SME)</li>
                  <li>• 2 AI Engineers</li>
                  <li>• Product Manager (advisory only)</li>
                </ul>
              </Card>

              <Card className="p-6">
                <Target className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-3">Duration & Scope</h3>
                <p className="text-muted-foreground mb-2">4-month engagement</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Redesign of CDS review interface for sepsis</li>
                  <li>• Built diagnostic checklist pattern for SIRS + infection criteria</li>
                  <li>• LLM integration design</li>
                  <li>• Clinical workflow optimization</li>
                </ul>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Design Process */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Design Process</h2>
          
          <div className="space-y-8">
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
                <h3 className="text-xl font-bold mb-4">1. Research & Discovery</h3>
                <ul className="space-y-2 text-muted-foreground mb-4">
                  <li>• Shadowed CDS specialists during sepsis review</li>
                  <li>• Ran sample validation sessions on real sepsis cases</li>
                  <li>• Audited rule based triggering rule set</li>
                  <li>• Mapped pain points in timeline review and data recall</li>
                </ul>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm italic">"I have to memorize the criteria every time and double-check the vitals. It's exhausting."</p>
                  <p className="text-xs text-muted-foreground mt-2">— CDS Specialist, Internal Team</p>
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
                <h3 className="text-xl font-bold mb-4">2. Ideation & Concepting</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Designed diagnostic checklist model to anchor reasoning</li>
                  <li>• Timeline prototypes for visualizing BiPAP, Op Note timestamps</li>
                  <li>• Created chip-based filters for quick navigation</li>
                  <li>• Drafted pin-to-compare interactions for data evidence</li>
                  <li>• Explored multiple layouts to reduce scrolling and noise</li>
                </ul>
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
                <h3 className="text-xl font-bold mb-4">3. Prototyping & Validation</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Created 10 iterative versions of the interface</li>
                  <li>• Tested diagnostic clarity with CDS specialists in weekly reviews</li>
                  <li>• Integrated JSON export aligned with LLM summarization format</li>
                  <li>• Validated scroll free layout and pinning behavior usability</li>
                </ul>
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
                <h3 className="text-xl font-bold mb-4">4. Iteration & Handoff</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Created scalable component library for diagnostic UI</li>
                  <li>• Delivered annotated wireframes and dev ready JSON schemas</li>
                  <li>• Created design documentation for AI integration</li>
                  <li>• Supported QA with UI testing across known case types</li>
                </ul>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Solution & Key Features */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Solution & Key Features</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{ delay: 0.1 }}>
              <Card className="p-6">
                <Target className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">1. Diagnostic Criteria Checklist</h3>
                <p className="text-muted-foreground">Structured top-right display showing met/missing SIRS and infection criteria with color-coded status chips.</p>
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
          }} transition={{ delay: 0.2 }}>
              <Card className="p-6">
                <Activity className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">2. Scroll-Free Data View</h3>
                <p className="text-muted-foreground">All relevant vitals, labs, and interventions displayed within a single viewport to speed up case validation.</p>
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
          }} transition={{ delay: 0.3 }}>
              <Card className="p-6">
                <Clock className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">3. Timeline-Embedded Evidence</h3>
                <p className="text-muted-foreground">Visualizes when key actions (e.g., BiPAP, Op Notes) occurred relative to vitals and symptoms.</p>
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
          }} transition={{ delay: 0.4 }}>
              <Card className="p-6">
                <Users className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">4. Pin-to-Compare Interaction</h3>
                <p className="text-muted-foreground">Allows CDS to pin two data points (e.g., temp + WBC) for side-by-side clinical reasoning.</p>
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
          }} transition={{ delay: 0.5 }}>
              <Card className="p-6">
                <FileText className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">5. JSON Criteria Output</h3>
                <p className="text-muted-foreground">Machine-readable output of diagnostic validation model for downstream use in LLM prompts and reporting.</p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Outcome & Impact */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Outcome & Impact</h2>
          
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }}>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">User Feedback</h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-lg italic mb-2">"This layout helped me review cases without toggling between tabs. I'm not second-guessing the criteria anymore."</p>
                <p className="text-sm text-muted-foreground">Internal CDS Reviewer</p>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Reflection & Learnings */}
      <section className="py-16 px-4">
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
            <h2 className="text-3xl font-bold mb-12 text-center">Reflection & Learnings</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-6">
                <CheckCircle className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-4">What Went Well</h3>
                <ul className="text-muted-foreground space-y-2">
                  <li>• Iteration with real CDSs validated design early</li>
                  <li>• JSON export unlocked future LLM integration use cases</li>
                  <li>• Compact layout reduced review fatigue</li>
                </ul>
              </Card>

              <Card className="p-6">
                <AlertCircle className="h-8 w-8 text-orange-500 mb-4" />
                <h3 className="text-xl font-semibold mb-4">Challenges & Solutions</h3>
                <ul className="text-muted-foreground space-y-2">
                  <li>• Criteria rules were opaque → solved with diagnostic checklist</li>
                  <li>• Visualizing time-based data was messy → solved via custom timeline logic</li>
                  <li>• CDS trust in AI suggestions was low → transparency improved through pin-to-compare feature</li>
                </ul>
              </Card>
            </div>

            <Card className="p-6 mt-8">
              <Lightbulb className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-4">Next Steps & Evolution</h3>
              <ul className="text-muted-foreground space-y-2">
                <li>• Integrate real-time vitals and labs feed from EMR</li>
                <li>• Expand checklist model to other complex diagnoses (e.g., ARF)</li>
                <li>• Train LLM summarizers using JSON diagnostic outputs</li>
              </ul>
            </Card>
          </motion.div>
        </div>
      </section>
      
      {/* Visuals & Artifacts */}
      <section className="py-16 px-4 bg-muted/30">
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
            <h2 className="text-3xl font-bold mb-12 text-center">Visuals & Artifacts</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <Card className="p-6">
                <Eye className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">Design Artifacts</h3>
                <ul className="text-muted-foreground space-y-2">
                  <li>• Annotated wireframes showing workflow logic</li>
                  <li>• Interactive prototype GIFs demonstrating key interactions</li>
                  <li>• Final UI screens with responsive breakpoints</li>
                  <li>• Component library documentation</li>
                </ul>
              </Card>

              <Card className="p-6">
                <Target className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">Process Documentation</h3>
                <ul className="text-muted-foreground space-y-2">
                  <li>• User journey maps with pain point analysis</li>
                  <li>• Information architecture flowcharts</li>
                  <li>• Usability test results and iteration history</li>
                  <li>• Design system guidelines and tokens</li>
                </ul>
              </Card>
            </div>

            <div className="text-center mb-8">
              <p className="text-muted-foreground text-lg mb-6">
                A balanced mix of process documentation (60%) and visual artifacts (40%) demonstrates both strategic thinking and execution excellence.
              </p>
              <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90">
                Request Full Case Study Details
              </Button>
            </div>
          </motion.div>
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
