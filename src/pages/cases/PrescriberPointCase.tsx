import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

const PrescriberPointCase = () => {
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
              <div className="p-4 rounded-xl bg-green-500/10">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">ML Drug Prior Auth Tool</h1>
                <p className="text-xl text-muted-foreground">PrescriberPoint</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">My Role</h3>
                <p>Senior UX Designer</p>
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">Timeline</h3>
                <p>March 2022 - October 2022</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {["#PriorAuth", "#ML", "#Workflow", "#Pharmacy"].map((tag) => (
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
              Prior authorization for specialty medications was taking 3-7 days on average, delaying critical patient treatments. Physicians were abandoning 40% of prior auth requests due to complex, manual processes.
            </p>
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-destructive mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-destructive mb-2">Critical Impact</h4>
                  <p className="text-muted-foreground">
                    Delayed treatments were affecting patient outcomes, while administrative burden was driving physician burnout and increasing healthcare costs.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Design Process</h2>
          
          <div className="space-y-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">1. Healthcare Provider Research</h3>
                <p className="text-muted-foreground mb-4">
                  Shadowed 8 physicians and pharmacy staff through their current prior auth workflows, documenting pain points and identifying automation opportunities.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm italic">"I spend more time fighting insurance than treating patients."</p>
                  <p className="text-xs text-muted-foreground mt-2">- Oncologist, Academic Medical Center</p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">2. ML Algorithm Integration Design</h3>
                <p className="text-muted-foreground">
                  Designed interfaces that make machine learning predictions transparent and actionable, helping physicians understand approval likelihood and required documentation before submission.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">3. Clinical Workflow Optimization</h3>
                <p className="text-muted-foreground">
                  Created smart forms that auto-populate from EHR data and guide users through optimal submission paths based on payer-specific requirements and historical approval patterns.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Key Design Solutions</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 h-full">
                <CheckCircle className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-3">Smart Approval Prediction</h3>
                <p className="text-muted-foreground">
                  Real-time ML predictions show approval likelihood before submission, with specific recommendations to improve approval chances.
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
                <Shield className="h-8 w-8 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-3">Payer-Specific Workflows</h3>
                <p className="text-muted-foreground">
                  Customized interfaces for each insurance provider, automatically presenting the right forms and requirements based on patient coverage.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Impact & Results</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="text-center p-6">
                <Clock className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-green-600 mb-2">18 hrs</h3>
                <p className="text-muted-foreground">Average approval time (down from 5+ days)</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="text-center p-6">
                <CheckCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-blue-600 mb-2">87%</h3>
                <p className="text-muted-foreground">First-submission approval rate</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Card className="text-center p-6">
                <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-purple-600 mb-2">73%</h3>
                <p className="text-muted-foreground">Reduction in abandonment rate</p>
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
            <h2 className="text-3xl font-bold mb-6">Interested in healthcare workflow optimization?</h2>
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

export default PrescriberPointCase;