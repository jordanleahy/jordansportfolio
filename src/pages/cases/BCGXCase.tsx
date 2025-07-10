import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Activity, Users, TrendingUp, Zap, Clock, Target, Lightbulb, Brain, TestTube, Package, Image, MessageSquareQuote, CheckCircle, AlertTriangle, MapPin, BookOpen, FileText, Workflow, Inbox, Search, FileCheck, PenTool, Bell } from "lucide-react";
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
            <h1 className="text-5xl font-bold mb-4">Denial and Appeal Management</h1>
            <p className="text-xl text-muted-foreground mb-8">AI-powered prescription denial dashboard with evidence cards and appeal composer</p>
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
              alt="Denial and Appeal Management Dashboard - Prescription denials listing with clinical evidence extraction and appeal composer"
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
                Denial and Appeal Management automates identification and resolution of prescription claim denials by aggregating clinical evidence and generating editable appeal letters—accelerating reimbursement for small healthcare practices.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-muted-foreground">👤 My Role</h3>
                </div>
                <p>Lead Product Designer</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-muted-foreground">🕒 Timeline</h3>
                </div>
                <p>April 2024 – July 2025</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-muted-foreground">📐 Scope</h3>
                </div>
                <p>End-to-end denial management feature</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-muted-foreground mb-3">🏷️ Tags/Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {["#CDI", "#RCM", "#AI", "#UX", "#RX"].map((tag) => (
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
                Small healthcare practices routinely receive claim denials through a mix of channels—email notifications, payer portals, faxed letters, and postal mail—without a unified intake system. Staff must manually gather each denial notice, decipher different formats, assemble the correct supporting documents (e.g., clinical notes, lab results, prior-auth forms), and then track submission and follow-up status across disparate tools.
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">🔺 Problem Statement</h4>
                  <p className="text-red-800 dark:text-red-200">
                    This fragmented, manual process leads to missed denials and appeals—up to 15% of cases fall through the cracks—causing average reimbursement delays of 10–15 days and undue administrative burden on small practice teams.
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
                <p className="font-semibold mb-3">Lead Product Designer</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Led UX design for the Prescription Denial Management feature</li>
                  <li>• Defined workflows for denial intake, evidence capture, and appeal generation</li>
                  <li>• Produced hi-fi prototypes and facilitated usability tests</li>
                  <li>• Coordinated with AI engineers to specify data-extraction prompts</li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-bold">🤝 Team & Stakeholders</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">Core Team (7 members)</p>
                    <p className="text-sm text-muted-foreground">Product Manager (1), Frontend Engineers (2), Backend & AI Engineers (2), Clinical Documentation SME (1), QA Lead (1)</p>
                  </div>
                  <div>
                    <p className="font-semibold">Key Stakeholders</p>
                    <p className="text-sm text-muted-foreground">Office Managers, Billing Specialists, CDS Specialists, Practice Administrators</p>
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
                    <p className="font-semibold">15-month engagement</p>
                    <p className="text-sm text-muted-foreground">April 2024 through July 2025</p>
                  </div>
                  <div>
                    <p className="font-semibold">Feature Coverage</p>
                    <p className="text-sm text-muted-foreground">End-to-end UX from discovery through launch</p>
                  </div>
                  <div>
                    <p className="font-semibold">Complexity: High</p>
                    <p className="text-sm text-muted-foreground">Multi-channel intake, AI-driven data extraction</p>
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
                        Shadowed denial intake sessions with billing and admin staff. Conducted interviews with 6 office managers and 4 CDS specialists to understand the fragmented intake process across multiple channels.
                      </p>
                      <div className="bg-muted/50 p-4 rounded-lg mb-4">
                        <h4 className="font-semibold mb-2">Key Research Methods:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Denial intake session shadowing with billing staff</li>
                          <li>• Interviews with office managers and CDS specialists</li>
                          <li>• Multi-channel workflow analysis and documentation audit</li>
                        </ul>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p className="text-sm italic">"Sorting through faxed letters and portal PDFs wastes hours each week."</p>
                        <p className="text-xs text-muted-foreground mt-2">- Office Manager, interviewed during discovery</p>
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
                        Mapped "denial → evidence → appeal" flow for small-practice workflows. Prioritized unified intake and automated document grouping. Designed "evidence card" concept to surface lab values, notes, and prior-auth forms.
                      </p>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Deliverables:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Denial-to-appeal workflow maps for small practices</li>
                          <li>• Evidence card interaction design and information architecture</li>
                          <li>• Feature prioritization matrix based on administrative impact</li>
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
                        Built interactive Figma prototypes for intake queue, evidence cards, and appeal composer. Ran 7 moderated usability tests, iterating on missing-document alerts. Validated AI-extracted summaries against manual curation in A/B tests.
                      </p>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Validation Methods:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Moderated usability sessions with 7 office managers</li>
                          <li>• A/B testing of AI-extracted summaries vs manual curation</li>
                          <li>• Performance benchmarking against existing manual processes</li>
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
                      <Inbox className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3">🟦 Unified Denial Intake</h3>
                      <p className="text-muted-foreground">
                        Consolidates denials from email, portal, fax, and mail into one queue with automated categorization and priority sorting.
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
                      <Search className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3">🟦 Formulary & Policy Checker</h3>
                      <p className="text-muted-foreground">
                        Real-time lookup of payer rules and prior-auth requirements with automated compliance verification.
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
                      <FileCheck className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3">🟦 Evidence Card Aggregator</h3>
                      <p className="text-muted-foreground">
                        Auto-extracts clinical data points (labs, notes, forms) via AI into editable cards for easy evidence review.
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
                      <PenTool className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3">🟦 AI-Assisted Appeal Composer</h3>
                      <p className="text-muted-foreground">
                        Pre-populates appeal letters with clinical rationale; fully editable rich text with regulatory compliance checking.
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
                      <Bell className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3">🟦 Workflow & Follow-Up Tracker</h3>
                      <p className="text-muted-foreground">
                        Tracks submission dates, sends automated reminders, and monitors response status across all appeals.
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
                    alt="Denial and Appeal Management Dashboard showing unified denial intake, evidence cards, and appeal composer interface"
                    className="w-full h-auto rounded-lg"
                  />
                  <p className="text-sm text-muted-foreground mt-3">
                    Unified denial intake dashboard with evidence card aggregation and AI-assisted appeal composition workflow
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
                      "Having all denials in one place and evidence surfaced automatically saved us hours each week."
                    </blockquote>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      - Maria Lopez, Office Manager, Sunshine Family Clinic
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
                  <h3 className="text-3xl font-bold text-green-600 mb-2">40%</h3>
                  <p className="text-muted-foreground font-medium">Reduction in denial processing time</p>
                  <p className="text-sm text-muted-foreground mt-2">For small healthcare practices using the new workflow</p>
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
                  <h3 className="text-3xl font-bold text-purple-600 mb-2">30%</h3>
                  <p className="text-muted-foreground font-medium">Increase in first-pass appeal approval rate</p>
                  <p className="text-sm text-muted-foreground mt-2">Measured against baseline manual appeal process</p>
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
                  <h3 className="text-3xl font-bold text-blue-600 mb-2">$500K</h3>
                  <p className="text-muted-foreground font-medium">Annual revenue recovery</p>
                  <p className="text-sm text-muted-foreground mt-2">15% decrease in missed appeals, recovering lost revenue</p>
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
                    <p className="text-sm"><strong>Early SME involvement:</strong> Engaging clinical documentation specialists from the start ensured accuracy across all intake channels and evidence extraction processes.</p>
                  </Card>
                  <Card className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-sm"><strong>Modular evidence cards:</strong> The scalable evidence card design adapted seamlessly to various document types and clinical data formats.</p>
                  </Card>
                  <Card className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-sm"><strong>AI prompt tuning:</strong> Iterative prompt engineering achieved &gt;85% extraction precision, significantly reducing manual review requirements.</p>
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