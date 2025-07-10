import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Brain, Users, TrendingUp, Clock, Target, Activity, FileText, Microscope } from "lucide-react";
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
                <h1 className="text-4xl font-bold mb-4">Drug Prior Authorization</h1>
                
                {/* Hero Image */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="relative mt-6 rounded-2xl overflow-hidden shadow-lg border border-border/50"
                >
                  <img 
                    src="/lovable-uploads/762c3624-2485-4556-b7c7-63709fc409aa.png"
                    alt="Drug Prior Authorization workflow interface showing formulary rules, authorization process, and e-submission workflow"
                    className="w-full h-auto object-cover"
                  />
                </motion.div>
              </div>
              
              {/* Project Summary */}
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Project Summary
                </h3>
                <p className="text-sm">
                  Designed an AI drug prior authorization workflow tool that identifies formulary rules, medical requirements, step therapy, reauthorization dates, drafts the letter, and sends to the appropriate insurance company.
                </p>
              </Card>
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
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">Keywords</h3>
                <div className="flex flex-wrap gap-1">
                  {["Prior Authorization", "Drug Formulary", "Healthcare AI", "Workflow Automation", "E-Submission", "Insurance"].map(tag => 
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  )}
                </div>
              </div>
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
                  Sepsis is defined as SIRS (Systemic Inflammatory Response Syndrome) plus suspicion of infection. It is the most commonly denied primary diagnosis across U.S. hospitals. Yet, validating sepsis manually is cognitively demanding and error-prone—especially when multiple criteria must be remembered and justified.
                </p>
              </div>
              
              <div>
                <h4 className="text-xl font-bold mb-3">Problem Statement</h4>
                <p className="text-lg leading-relaxed text-muted-foreground mb-4">
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
          </motion.div>
        </div>
      </section>

      {/* My Role & Team */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">My Role & Team</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
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
                <h3 className="text-xl font-bold mb-4">My Role</h3>
                <p className="font-semibold text-red-600 mb-3">Staff Product Designer</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• User research & criteria mapping</li>
                  <li>• Workflow redesign & prototyping</li>
                  <li>• JSON output design for LLM integration</li>
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
                <h3 className="text-xl font-bold mb-4">Team & Stakeholders</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• 2 Clinical Documentation Specialists (CDS)</li>
                  <li>• 1 Medical Doctor (Sepsis SME)</li>
                  <li>• 2 AI Engineers</li>
                  <li>• Product Manager (advisory only)</li>
                </ul>
              </Card>
            </motion.div>
          </div>

          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="mt-8">
            <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
              <h4 className="text-lg font-bold mb-3">Duration & Scope</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>4-month engagement</strong>
                </div>
                <div>
                  Redesign of CDS review interface for sepsis
                </div>
                <div>
                  Built diagnostic checklist pattern for SIRS + infection criteria
                </div>
              </div>
            </Card>
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
                  <li>• Audited AI-triggering rule set</li>
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
                  <li>• Validated scroll-free layout and pinning behavior usability</li>
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
                  <li>• Delivered annotated wireframes and dev-ready JSON schemas</li>
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
          
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{ delay: 0.1 }}>
              <Card className="p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Target className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold">Diagnostic Criteria Checklist</h3>
                </div>
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
              <Card className="p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold">Scroll-Free Data View</h3>
                </div>
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
              <Card className="p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold">Timeline-Embedded Evidence</h3>
                </div>
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
              <Card className="p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-bold">Pin-to-Compare Interaction</h3>
                </div>
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
              <Card className="p-6 md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold">JSON Criteria Output</h3>
                </div>
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
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                <h3 className="text-lg font-bold mb-4">User Feedback</h3>
                <div className="bg-white/50 dark:bg-background/50 p-4 rounded-lg">
                  <p className="text-sm italic mb-2">"This layout helped me review cases without toggling between tabs. I'm not second-guessing the criteria anymore."</p>
                  <p className="text-xs text-muted-foreground">— Internal CDS Reviewer</p>
                </div>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="text-center p-6">
                  <Target className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-green-600 mb-2">42%</h3>
                  <p className="text-muted-foreground">Target agree rate improvement</p>
                </Card>

                <Card className="text-center p-6">
                  <Activity className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-blue-600 mb-2">Adopted internally</h3>
                  <p className="text-muted-foreground">New framework for complex diagnostic review</p>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Reflection & Learnings */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Reflection & Learnings</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div initial={{
            opacity: 0,
            x: -30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }}>
              <Card className="p-6 h-full">
                <h3 className="text-xl font-bold mb-4 text-green-600">What Went Well</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Iteration with real CDSs validated design early</li>
                  <li>• JSON export unlocked future LLM integration use cases</li>
                  <li>• Compact layout reduced review fatigue</li>
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
              <Card className="p-6 h-full">
                <h3 className="text-xl font-bold mb-4 text-orange-600">Challenges & Solutions</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div>
                    <strong>Criteria rules were opaque</strong> → solved with diagnostic checklist
                  </div>
                  <div>
                    <strong>Visualizing time-based data was messy</strong> → solved via custom timeline logic
                  </div>
                  <div>
                    <strong>CDS trust in AI suggestions was low</strong> → transparency improved through pin-to-compare feature
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Next Steps & Evolution */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Next Steps & Evolution</h2>
          
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
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Real-time Integration</h4>
                  <p className="text-sm text-muted-foreground">Integrate real-time vitals and labs feed from EMR</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Expand Scope</h4>
                  <p className="text-sm text-muted-foreground">Expand checklist model to other complex diagnoses (e.g., ARF)</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">LLM Training</h4>
                  <p className="text-sm text-muted-foreground">Train LLM summarizers using JSON diagnostic outputs</p>
                </div>
              </div>
            </Card>
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