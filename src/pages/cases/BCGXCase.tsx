import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Activity, Users, TrendingUp, Zap, Clock, Target, Lightbulb, Brain, TestTube, Package, Image, MessageSquareQuote, CheckCircle, AlertTriangle, MapPin, BookOpen, FileText, Workflow } from "lucide-react";
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
            <a href="mailto:contact@jordanporter.me?subject=Jordan Intro">Contact Jordan</a>
          </Button>
        </div>
      </motion.header>

      {/* 1. Title & One-Line Visual Description */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-bold mb-4">BCGX Digital Therapeutics Platform</h1>
            <p className="text-xl text-muted-foreground mb-8">Streamlined drug discovery workflows connecting global research teams through intelligent collaboration tools</p>
          </motion.div>
        </div>
      </section>

      {/* 2. Hero Image Section */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative mb-12 rounded-2xl overflow-hidden shadow-lg border border-border/50"
          >
            <img 
              src="/lovable-uploads/8c1110c1-02c2-4041-987c-a9d030ffef3b.png"
              alt="BCGX Digital Therapeutics Platform - Unified research workflow interface"
              className="w-full h-auto object-cover aspect-video"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent"></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">📝 Project Summary</h3>
              <p className="text-muted-foreground mb-8">
                Designed an integrated digital platform for BCGX that unified disparate research systems, enabling real-time collaboration across global pharmaceutical teams and reducing drug development timelines by 25%.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-muted-foreground">👤 My Role</h3>
                </div>
                <p>Lead Product Designer & UX Strategist</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-muted-foreground">🕒 Timeline</h3>
                </div>
                <p>August 2021 – March 2022</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-muted-foreground">📐 Scope</h3>
                </div>
                <p>End-to-end platform redesign</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-muted-foreground mb-3">🏷️ Tags/Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {["#DigitalTherapeutics", "#DrugDiscovery", "#CollaborationPlatform", "#ResearchWorkflows", "#PharmaTech"].map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Context & Problem */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-8">Context & Problem</h2>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Healthcare Context</h3>
              <p className="text-lg leading-relaxed text-muted-foreground mb-6">
                BCGX, a leading pharmaceutical research organization, operates across 15 countries with over 2,000 researchers working on breakthrough digital therapeutics. The fragmented nature of their research infrastructure was creating significant bottlenecks in the drug discovery process, where time-to-market directly impacts patient access to life-saving treatments.
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">🔺 Problem Statement</h4>
                  <p className="text-red-800 dark:text-red-200">
                    Research teams were experiencing 30% longer development cycles due to disconnected systems, resulting in $50M+ monthly opportunity costs and reduced collaboration efficiency across global teams.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. My Role & Team */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-8">My Role & Team</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-bold">👤 My Role</h3>
                </div>
                <p className="font-semibold mb-3">Lead Product Designer & UX Strategist</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• End-to-end UX strategy and design leadership</li>
                  <li>• Cross-functional stakeholder management</li>
                  <li>• User research and behavioral analysis</li>
                  <li>• Design system architecture</li>
                  <li>• Usability testing and validation</li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-bold">🤝 Team & Stakeholders</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">Core Team (8 members)</p>
                    <p className="text-sm text-muted-foreground">Product Manager, 2 UX Researchers, 4 Engineers, Clinical Advisor</p>
                  </div>
                  <div>
                    <p className="font-semibold">Key Stakeholders</p>
                    <p className="text-sm text-muted-foreground">Research Directors, IT Leadership, Regulatory Affairs, Global Site Coordinators</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-bold">📐 Duration & Scope</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">8-month engagement</p>
                    <p className="text-sm text-muted-foreground">Discovery through post-launch optimization</p>
                  </div>
                  <div>
                    <p className="font-semibold">Platform Coverage</p>
                    <p className="text-sm text-muted-foreground">Complete workflow redesign spanning 5 core research modules</p>
                  </div>
                  <div>
                    <p className="font-semibold">Complexity: High</p>
                    <p className="text-sm text-muted-foreground">Enterprise-grade integration with legacy systems</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. Design Process */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-12 text-center">Design Process</h2>
            
            <div className="space-y-12">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <Lightbulb className="h-8 w-8 text-yellow-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold mb-4">💡 1. Research & Discovery</h3>
                      <p className="text-muted-foreground mb-4">
                        Conducted comprehensive ethnographic research across 5 countries, observing 40+ researchers in their natural work environments. Utilized contextual inquiry, stakeholder interviews, and workflow analysis to understand collaboration patterns and system inefficiencies.
                      </p>
                      <div className="bg-muted/50 p-4 rounded-lg mb-4">
                        <h4 className="font-semibold mb-2">Key Research Methods:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Global site visits and shadowing sessions</li>
                          <li>• Stakeholder journey mapping workshops</li>
                          <li>• System audit and technical architecture review</li>
                        </ul>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p className="text-sm italic">"I have the same conversation 6 times with different teams because our systems don't talk to each other."</p>
                        <p className="text-xs text-muted-foreground mt-2">- Senior Research Scientist, Oncology Division</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <Brain className="h-8 w-8 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold mb-4">🧠 2. Ideation & Concepting</h3>
                      <p className="text-muted-foreground mb-4">
                        Mapped the complete drug discovery journey from target identification to clinical trials, identifying 23 critical handoff points where information was lost or duplicated. Created comprehensive information architecture and feature prioritization framework.
                      </p>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Deliverables:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Cross-functional journey maps and service blueprints</li>
                          <li>• Information architecture and navigation strategy</li>
                          <li>• Feature prioritization matrix based on user impact</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <TestTube className="h-8 w-8 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold mb-4">🧪 3. Prototyping & Validation</h3>
                      <p className="text-muted-foreground mb-4">
                        Developed interactive prototypes for key workflow scenarios and conducted iterative usability testing with global research teams. Validated design decisions through A/B testing and performance metrics analysis.
                      </p>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Validation Methods:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Moderated usability sessions with 25+ researchers</li>
                          <li>• A/B testing of collaboration features</li>
                          <li>• Performance benchmarking against existing workflows</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <Package className="h-8 w-8 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold mb-4">📦 4. Iteration & Handoff</h3>
                      <p className="text-muted-foreground mb-4">
                        Created comprehensive design system documentation and engineering specifications. Established QA processes and collaborated closely with development teams throughout implementation to ensure design fidelity.
                      </p>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Implementation Support:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Design system and component library development</li>
                          <li>• Engineering collaboration and QA oversight</li>
                          <li>• Post-launch optimization and user feedback integration</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 6. Solution & Key Features */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-12 text-center">Solution & Key Features</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 h-full border-l-4 border-l-blue-500">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3">🟦 Smart Collaboration Hub</h3>
                      <p className="text-muted-foreground">
                        AI-powered recommendation engine that surfaces relevant experts, similar research, and potential collaboration opportunities based on project context and research domains.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-6 h-full border-l-4 border-l-yellow-500">
                  <div className="flex items-start gap-3">
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-lg">
                      <Zap className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3">🟦 Automated Documentation</h3>
                      <p className="text-muted-foreground">
                        Intelligent capture of lab results, meeting notes, and research insights that automatically generates regulatory-compliant documentation and version control.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-6 h-full border-l-4 border-l-green-500">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                      <Workflow className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3">🟦 Unified Workflow Engine</h3>
                      <p className="text-muted-foreground">
                        Streamlined research pipeline that connects lab data, collaboration tools, and regulatory documentation, reducing context switching by 60%.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-6 h-full border-l-4 border-l-purple-500">
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                      <Target className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3">🟦 Real-time Progress Tracking</h3>
                      <p className="text-muted-foreground">
                        Dynamic dashboards providing visibility into research milestones, resource allocation, and cross-team dependencies across global operations.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <Card className="p-6 h-full border-l-4 border-l-red-500">
                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">
                      <Brain className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3">🟦 Intelligent Knowledge Base</h3>
                      <p className="text-muted-foreground">
                        Machine learning-powered research repository that automatically categorizes findings and surfaces relevant historical data and precedents.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                <Card className="p-6 h-full border-l-4 border-l-indigo-500">
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                      <Activity className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3">🟦 Regulatory Compliance Assistant</h3>
                      <p className="text-muted-foreground">
                        Automated compliance checking and documentation generation that ensures all research activities meet FDA and international regulatory standards.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 7. Visual Examples */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-12 text-center">Visual Examples</h2>
            <div className="space-y-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Image className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold">🖼️ Primary Interface Screenshots</h3>
                </div>
                <Card className="p-4">
                  <img 
                    src="/lovable-uploads/8c1110c1-02c2-4041-987c-a9d030ffef3b.png"
                    alt="BCGX Digital Therapeutics Platform main dashboard showing unified research workflow interface"
                    className="w-full h-auto rounded-lg"
                  />
                  <p className="text-sm text-muted-foreground mt-3">
                    Main dashboard interface showing the unified research workflow with collaboration hub, progress tracking, and intelligent recommendations
                  </p>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 8. Outcome & Impact */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-12 text-center">Outcome & Impact</h2>
            
            <div className="mb-12">
              <div className="flex items-start gap-3 mb-6">
                <MessageSquareQuote className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-4">🗣️ User Feedback</h3>
                  <Card className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <blockquote className="text-lg italic text-green-900 dark:text-green-100 mb-3">
                      "The new platform has transformed how our global teams collaborate. What used to take weeks of coordination now happens seamlessly in real-time. We're finally able to focus on the science instead of fighting with systems."
                    </blockquote>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      - Dr. Sarah Chen, Director of Digital Therapeutics Research, BCGX Global
                    </p>
                  </Card>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <Card className="text-center p-6 border-t-4 border-t-green-500">
                  <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-green-600 mb-2">25%</h3>
                  <p className="text-muted-foreground font-medium">Faster time-to-market for new compounds</p>
                  <p className="text-sm text-muted-foreground mt-2">Reduced development cycles from 18 to 13.5 months average</p>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <Card className="text-center p-6 border-t-4 border-t-purple-500">
                  <Activity className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-purple-600 mb-2">65%</h3>
                  <p className="text-muted-foreground font-medium">Increase in cross-team collaboration</p>
                  <p className="text-sm text-muted-foreground mt-2">Measured by inter-departmental project participation</p>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <Card className="text-center p-6 border-t-4 border-t-blue-500">
                  <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-blue-600 mb-2">90%</h3>
                  <p className="text-muted-foreground font-medium">Research team satisfaction score</p>
                  <p className="text-sm text-muted-foreground mt-2">Post-implementation survey results</p>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 9. Reflection & Learnings */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-12 text-center">Reflection & Learnings</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-start gap-3 mb-6">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <h3 className="text-xl font-bold text-green-700 dark:text-green-400">✅ What Went Well</h3>
                </div>
                <div className="space-y-4">
                  <Card className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-sm"><strong>Global stakeholder alignment:</strong> Successfully navigated complex organizational politics across 15 countries through structured workshops and continuous communication.</p>
                  </Card>
                  <Card className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-sm"><strong>User-centered approach:</strong> Ethnographic research provided deep insights that directly informed design decisions and prevented costly feature misalignment.</p>
                  </Card>
                  <Card className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-sm"><strong>Iterative validation:</strong> Continuous testing with real researchers throughout the design process ensured high adoption rates and user satisfaction.</p>
                  </Card>
                  <Card className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-sm"><strong>Technical integration success:</strong> Close collaboration with engineering teams resulted in seamless integration with legacy systems without data loss.</p>
                  </Card>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-3 mb-6">
                  <AlertTriangle className="h-6 w-6 text-amber-600 mt-1 flex-shrink-0" />
                  <h3 className="text-xl font-bold text-amber-700 dark:text-amber-400">⚠️ Challenges & Solutions</h3>
                </div>
                <div className="space-y-4">
                  <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-sm"><strong>Legacy system constraints:</strong> Overcame technical limitations by designing modular interfaces that could be implemented incrementally while maintaining system stability.</p>
                  </Card>
                  <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-sm"><strong>Regulatory compliance complexity:</strong> Partnered closely with compliance teams to ensure all features met FDA requirements without compromising user experience.</p>
                  </Card>
                  <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-sm"><strong>Cultural workflow differences:</strong> Designed flexible configuration options to accommodate varying research practices across global teams while maintaining consistency.</p>
                  </Card>
                  <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-sm"><strong>Change management resistance:</strong> Implemented comprehensive training programs and gradual feature rollouts to ease the transition and build user confidence.</p>
                  </Card>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 10. Next Steps & Evolution */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-8 text-center">Next Steps & Evolution</h2>
            
            <div className="flex items-start gap-3 mb-6">
              <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <h3 className="text-xl font-bold">🔮 Platform Roadmap & Future Enhancements</h3>
            </div>
            
            <div className="space-y-6">
              <Card className="p-6">
                <h4 className="font-semibold mb-3">Advanced AI Integration (Q2 2024)</h4>
                <p className="text-muted-foreground mb-3">
                  Implementation of predictive analytics for research outcome forecasting and automated hypothesis generation based on historical research patterns.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Machine learning models for compound success prediction</li>
                  <li>• Natural language processing for research literature analysis</li>
                  <li>• Automated research recommendation engine</li>
                </ul>
              </Card>

              <Card className="p-6">
                <h4 className="font-semibold mb-3">Global Expansion & Localization</h4>
                <p className="text-muted-foreground mb-3">
                  Extension to additional research facilities in Asia-Pacific region with localized compliance frameworks and cultural workflow adaptations.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Regional regulatory compliance modules</li>
                  <li>• Multi-language interface and documentation</li>
                  <li>• Cultural workflow customization options</li>
                </ul>
              </Card>

              <Card className="p-6">
                <h4 className="font-semibold mb-3">Patient Data Integration</h4>
                <p className="text-muted-foreground mb-3">
                  Integration with clinical trial platforms to provide real-time patient outcome data and adverse event monitoring directly within the research workflow.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Real-time clinical trial data dashboards</li>
                  <li>• Patient-reported outcome integration</li>
                  <li>• Automated safety signal detection</li>
                </ul>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 11. Visuals & Artifacts */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-12 text-center">Visuals & Artifacts</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-start gap-3 mb-6">
                  <FileText className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <h3 className="text-xl font-bold">🧾 Design Artifacts</h3>
                </div>
                <div className="space-y-4">
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Annotated Wireframes</h4>
                    <p className="text-sm text-muted-foreground">
                      Comprehensive wireframe documentation with interaction specifications and user flow annotations for development handoff.
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Interactive Figma Prototypes</h4>
                    <p className="text-sm text-muted-foreground">
                      High-fidelity prototypes demonstrating key user journeys and interaction patterns for stakeholder review and usability testing.
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Design System Documentation</h4>
                    <p className="text-sm text-muted-foreground">
                      Complete component library with usage guidelines, accessibility standards, and implementation specifications.
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">User Research Findings</h4>
                    <p className="text-sm text-muted-foreground">
                      Detailed ethnographic study results, persona development, and journey mapping documentation with actionable insights.
                    </p>
                  </Card>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-3 mb-6">
                  <BookOpen className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <h3 className="text-xl font-bold">📚 Process Documentation</h3>
                </div>
                <div className="space-y-4">
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Research Workflow Maps</h4>
                    <p className="text-sm text-muted-foreground">
                      Current and future state workflow documentation showing optimization opportunities and system integration points.
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Stakeholder Journey Maps</h4>
                    <p className="text-sm text-muted-foreground">
                      Cross-functional journey mapping showing touchpoints, pain points, and collaboration opportunities across global teams.
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Technical Integration Guides</h4>
                    <p className="text-sm text-muted-foreground">
                      Detailed documentation for engineering teams covering API specifications, data migration, and system architecture requirements.
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Change Management Plans</h4>
                    <p className="text-sm text-muted-foreground">
                      Comprehensive rollout strategy including training materials, communication plans, and success metrics for global deployment.
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-6">Ready to transform your enterprise workflows?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Let's discuss how strategic UX design can streamline your complex business processes and drive measurable results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                <a href="mailto:contact@jordanporter.me?subject=Jordan Intro">Get in Touch</a>
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