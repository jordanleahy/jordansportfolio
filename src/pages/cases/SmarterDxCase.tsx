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
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl bg-red-500/10">
                  <Activity className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">Improving Sepsis Diagnosis Review for CDS Specialists</h1>
                  <p className="text-xl text-muted-foreground">Increasing sepsis diagnosis agree rate from 23% to 42%</p>
                </div>
              </div>
              
              {/* Project Snapshot */}
              <Card className="p-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-800">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-red-600" />
                  🖼️ Project Snapshot
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Goal:</strong> Increase the sepsis diagnosis agree rate from 23% to 42% by redesigning the CDS specialist workflow for reviewing AI-recommended sepsis triggers.</p>
                </div>
              </Card>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">My Role</h3>
                <p>Researcher, Product Designer, and Product Manager</p>
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">Timeline</h3>
                <p>[Add date or duration]</p>
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">Team</h3>
                <p>Clinical Documentation Specialists, AI engineering, clinical rules teams</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {["#Sepsis", "#CDS", "#Clinical AI", "#Healthcare", "#UX Research", "#Diagnostic Interface"].map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
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
            <h2 className="text-3xl font-bold mb-6">🔍 Problem</h2>
            <div className="space-y-4">
              <p className="text-lg leading-relaxed text-muted-foreground">
                <strong>Sepsis</strong> — defined as SIRS (Systemic Inflammatory Response Syndrome) plus suspected infection — is the #1 denied primary diagnosis across U.S. hospitals.
              </p>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Despite our AI system flagging sepsis opportunities, only <strong className="text-red-600">23% of recommendations were agreed upon by CDS specialists.</strong>
              </p>
              <div className="bg-muted/50 p-6 rounded-lg">
                <h4 className="font-semibold mb-3">Why?</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Generic interfaces lacked contextual clinical evidence</li>
                  <li>• CDSs had to mentally recall criteria or search across screens</li>
                  <li>• Key events like BiPAP placement, Op Note timestamps, or vitals weren't tied to trigger logic</li>
                  <li>• The current interface forced manual cross-checking, often with scrolling and external references</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Research & Discovery */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">🧪 Research & Discovery</h2>
          
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
              <p className="text-muted-foreground mb-6">
                I led user research with our internal CDS specialists, including:
              </p>
              <ul className="space-y-3 text-muted-foreground mb-6">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  Sample review exercises using current workflows
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  Mapping how they interpret SIRS, infection evidence, and timelines
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  Identifying friction points in the review, validation, and decision process
                </li>
              </ul>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Critical Insight:</h4>
                <p className="text-blue-800 dark:text-blue-200">
                  CDS specialists were relying on memory to validate sepsis — despite the complexity of criteria. They needed a visual diagnostic aid, not just raw data dumps.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">🧠 Solution: Diagnostic Criteria Argument Model</h2>
          
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }}>
            <Card className="p-6 mb-8">
              <p className="text-lg text-muted-foreground mb-6">
                I created a new diagnostic checklist model that visually walks the reviewer through why a sepsis recommendation might be valid — surfacing key SIRS signs, infection suspicion, and interventions in one scroll-free view.
              </p>
              
              <h4 className="text-xl font-bold mb-4">Key Design Decisions</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">📍</span>
                    </div>
                    <div>
                      <strong>Pin-to-compare feature</strong> to contrast data points (e.g. temperature vs. WBC spike)
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">🧬</span>
                    </div>
                    <div>
                      <strong>Timeline-based data placement:</strong> When was BiPAP added? When did vitals spike?
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">🧠</span>
                    </div>
                    <div>
                      <strong>Top-right Criteria Chips:</strong> Display SIRS + infection flags instantly
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">📦</span>
                    </div>
                    <div>
                      <strong>Collapsible op note panels</strong> to reduce cognitive load
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">🧪</span>
                    </div>
                    <div>
                      <strong>Diagnostic JSON Output:</strong> Structured for prompt engineering in future LLM integrations
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="text-xl font-bold mb-4">🧪 Iterative Process</h4>
              <p className="text-muted-foreground mb-4">Over 10 iterations, I tested and refined:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Data grouping strategies</li>
                  <li>• Compact, scroll-free layouts</li>
                </ul>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Evidence hierarchy (labs vs. notes vs. imaging)</li>
                  <li>• Interaction micro-patterns (pinning, filtering, hovering tooltips)</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground mt-4 italic">
                Each round involved feedback loops with CDSs and clinical AI reviewers.
              </p>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">✅ Outcome</h2>
          
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
              <Card className="p-6">
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    Final interface supported scroll-free evidence review
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    Reduced time-to-agreement on valid sepsis cases
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    Provided a clear audit trail for denials
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    Laid foundation for LLM prompt-driven summarization via JSON exports
                  </li>
                </ul>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                  <Target className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-green-600 mb-2">42%</h3>
                  <p className="text-muted-foreground">🎯 Target agree rate improvement</p>
                </Card>

                <Card className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
                  <Activity className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-blue-600 mb-2">🚀 Adopted internally</h3>
                  <p className="text-muted-foreground">New framework for complex diagnostic review</p>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tools & Stack */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">🧰 Tools & Stack</h2>
          
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
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <strong>Figma</strong>
                      <p className="text-sm text-muted-foreground">UI/UX design and prototyping</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Brain className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <strong>FigJam</strong>
                      <p className="text-sm text-muted-foreground">Workflow and criteria mapping</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <Microscope className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <strong>JSON Schema design</strong>
                      <p className="text-sm text-muted-foreground">Criteria export</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <strong>OpenAI Collaboration</strong>
                      <p className="text-sm text-muted-foreground">Prompt engineers for future LLM iteration</p>
                    </div>
                  </div>
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