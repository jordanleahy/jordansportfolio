import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, Clock, CheckCircle, AlertCircle, Users, Target, Lightbulb, Eye, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
const PrescriberPointCase = () => {
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

      {/* 1. Project Snapshot */}
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
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4">Drug Prior Authorization</h1>
              
              {/* Hero Image */}
              <motion.div initial={{
              opacity: 0,
              scale: 0.95
            }} animate={{
              opacity: 1,
              scale: 1
            }} transition={{
              duration: 0.8,
              delay: 0.2
            }} className="relative mb-8 rounded-2xl overflow-hidden shadow-lg border border-border/50 aspect-video">
                <img src="/lovable-uploads/4c976661-d94f-48e5-ab44-e69c629f2f91.png" alt="Drug Formulary Rules interface showing prior authorization workflow with extraction, parsing, scheduling, drafting, and e-submission steps" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent"></div>
              </motion.div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-8">
                <p className="text-lg text-muted-foreground">
                  <strong>Project Summary:</strong> Designed an AI drug prior authorization workflow tool that identifies formulary rules, medical requirements, step therapy, reauthorization dates, drafts the letter, and sends to the appropriate insurance company.
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">My Role</h3>
                <p>Lead Product Designer</p>
                <p className="text-sm text-muted-foreground">End-to-end UX/UI ownership</p>
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">Timeline</h3>
                <p>6 months</p>
                <p className="text-sm text-muted-foreground">March - October 2022</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {["PriorAuth", "Formulary", "MedicalRequirements", "Step Therapy", "Reauthorization"].map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Context & Problem */}
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
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Healthcare Context</h3>
              <p className="text-lg leading-relaxed text-muted-foreground mb-6">Prescribers and non-prescribers spent hours manually checking payer formularies and drafting prior-authorization letters, leading to delayed patient care. The traditional prior-authorization process is fragmented across multiple systems and often requires navigating numerous portals.</p>
            </div>

            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-destructive mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-destructive mb-2">Problem Statement</h4>
                  <p className="text-muted-foreground mb-4">
                    Manual prior authorizations caused 40% of requests to be reworked, delaying therapy starts by an average of 5 days and driving physician abandonment rates above 40%.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This resulted in delayed patient treatments affecting health outcomes, while administrative burden increased costs and contributed to provider burnout.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Your Role & Team */}
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
                <p className="text-muted-foreground mb-2">Lead Product Designer</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• End-to-end UX/UI ownership</li>
                  <li>• User research & validation</li>
                  <li>• Prototyping & iteration</li>
                  <li>• Design system creation</li>
                </ul>
              </Card>

              <Card className="p-6">
                <Users className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-3">Team & Stakeholders</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 2 Clinical SMEs</li>
                  <li>• 3 Software Engineers</li>
                  <li>• 1 ML Engineer</li>
                  <li>• 1 Regulatory Advisor</li>
                  <li>• Product Manager</li>
                </ul>
              </Card>

              <Card className="p-6">
                <Target className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-3">Duration & Scope</h3>
                <p className="text-muted-foreground mb-2">6-month engagement</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 5 major payer integrations</li>
                  <li>• 3 specialty drug categories</li>
                  <li>• ML prediction model design</li>
                  <li>• Automated workflow creation</li>
                </ul>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. Design Process */}
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
            <h2 className="text-3xl font-bold mb-12 text-center">Design Process</h2>
            
            <div className="space-y-8">
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <Eye className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold mb-3">1. Research & Discovery</h3>
                    <ul className="text-muted-foreground space-y-2 mb-4">
                      <li>• User interviews with two dermtalology practices</li>
                      <li>• Shadowed prescribers and non prescribers through current PA workflows</li>
                      <li>• Competitive audit of existing PA tools</li>
                      <li>• Analysis of payer formulary documentation via MMIT API</li>
                    </ul>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm italic">"I spend more time fighting insurance than treating patients."</p>
                      <p className="text-xs text-muted-foreground mt-2">- Oncologist, Academic Medical Center</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <Lightbulb className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold mb-3">2. Ideation & Concepting</h3>
                    <ul className="text-muted-foreground space-y-2">
                      <li>• Sketches and wireframes for rule screening interfaces</li>
                      <li>• Workshop to prioritize features (rule parsing, template drafting)</li>
                      <li>• Information architecture for complex workflow states</li>
                      <li>• ML prediction display concepts and transparency design</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <Target className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold mb-3">3. Prototyping & Validation</h3>
                    <ul className="text-muted-foreground space-y-2">
                      <li>• High-fidelity mockups in Figma</li>
                      <li>• Interactive prototypes for letter drafting flow</li>
                      <li>• Usability tests (N=5) to refine workflows</li>
                      <li>• A/B testing for ML prediction presentations</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold mb-3">4. Iteration & Handoff</h3>
                    <ul className="text-muted-foreground space-y-2">
                      <li>• Design tokens and component library for dev handoff</li>
                      <li>• Documentation for complex interaction patterns</li>
                      <li>• QA support during development and testing</li>
                      <li>• User training materials and documentation</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. Solution & Key Features */}
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
            <h2 className="text-3xl font-bold mb-12 text-center">Solution & Key Features</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-6">
                <Shield className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">1. Formulary Rule Extraction</h3>
                <p className="text-muted-foreground">
                  Auto-scans payer lists to flag coverage rules and identifies step-therapy requirements in real-time.
                </p>
              </Card>

              <Card className="p-6">
                <CheckCircle className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">2. Medical Requirement Parser</h3>
                <p className="text-muted-foreground">
                  NLP-driven extraction of clinical criteria with intelligent form pre-population from EHR data.
                </p>
              </Card>

              <Card className="p-6">
                <Clock className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">3. Step-Therapy Checker</h3>
                <p className="text-muted-foreground">
                  Visual indicator of prior steps required with timeline tracking and automated renewal alerts.
                </p>
              </Card>

              <Card className="p-6">
                <TrendingUp className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">4. Reauthorization Scheduler</h3>
                <p className="text-muted-foreground">
                  Tracks expirations and prompts renewals with automated calendar integration.
                </p>
              </Card>

              <Card className="p-6">
                <Eye className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">5. Automated Letter Drafting</h3>
                <p className="text-muted-foreground">
                  Pre-populates PA forms with patient and clinical data using intelligent templates.
                </p>
              </Card>

              <Card className="p-6">
                <Target className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">6. E-Submission Workflow</h3>
                <p className="text-muted-foreground">
                  One-click send to insurer portal with real-time status tracking and follow-up automation.
                </p>
              </Card>
            </div>

            {/* Taltz Prior Authorization Interface */}
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6,
            delay: 0.3
          }} className="mt-12">
              <div className="relative rounded-2xl overflow-hidden shadow-lg border border-border/50">
                <img src="/lovable-uploads/7d2433d2-f435-44d6-8d11-045721be886e.png" alt="Taltz prior authorization interface showing drug information, dosing, and approval workflow" className="w-full h-auto object-contain" />
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4 italic">
                Taltz prior authorization interface demonstrating automated form population and workflow guidance
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 6. Outcome & Impact */}
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
            <h2 className="text-3xl font-bold mb-12 text-center">Outcome & Impact</h2>
            

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">User Feedback</h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-lg italic mb-2">"This tool let me clear 3× more cases per day and actually focus on patient care instead of paperwork."</p>
                <p className="text-sm text-muted-foreground">- Clinical Decision Support Specialist, Regional Health System</p>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* 7. Reflection & Learnings */}
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
                  <li>• Strong SME partnership accelerated rule mapping and validation</li>
                  <li>• Early prototyping revealed critical workflow gaps before development</li>
                  <li>• ML transparency design built user trust and adoption</li>
                  <li>• Iterative testing with real users prevented major usability issues</li>
                </ul>
              </Card>

              <Card className="p-6">
                <AlertCircle className="h-8 w-8 text-orange-500 mb-4" />
                <h3 className="text-xl font-semibold mb-4">Challenges & Solutions</h3>
                <ul className="text-muted-foreground space-y-2">
                  <li>• Handling edge case requirements across multiple payers required flexible template system</li>
                  <li>• Integration complexity solved through phased rollout approach</li>
                  <li>• Regulatory compliance ensured through continuous legal review</li>
                  <li>• Change management addressed via comprehensive training program</li>
                </ul>
              </Card>
            </div>

            <Card className="p-6 mt-8">
              <Lightbulb className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-4">Next Steps & Evolution</h3>
              <ul className="text-muted-foreground space-y-2">
                <li>• Integrate real time payer API connections for dynamic rule updates</li>
                <li>
              </li>
                <li>• Develop predictive analytics for approval likelihood scoring</li>
                <li>• Create mobile interface for on-the-go PA status monitoring</li>
              </ul>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* 8. Visuals & Artifacts */}
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
            
            <div className="grid md:grid-cols-2 gap-8">
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

            <div className="mt-8 text-center">
              <p className="text-muted-foreground mb-6">
                A balanced mix of process documentation (60%) and visual artifacts (40%) demonstrates both strategic thinking and execution excellence.
              </p>
              <Button size="lg">
                <a href="#contact">Request Full Case Study Details</a>
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
export default PrescriberPointCase;