import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Activity, Users, TrendingUp, Zap, User, UserCheck, Target, Eye, BarChart3, Shield, CheckCircle, Clock, AlertCircle, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import { bcgxCaseData } from "@/data/bcgxCaseData";

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

      {/* My Role & Team */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-12 text-center">My Role & Team</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* My Role */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-6 h-full">
                  <User className="h-8 w-8 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-4">{bcgxCaseData.roleAndTeam.myRole.title}</h3>
                  <h4 className="font-semibold text-foreground mb-3">Lead Product Designer</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {bcgxCaseData.roleAndTeam.myRole.details.map((detail, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>

              {/* Team & Stakeholders */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-6 h-full">
                  <UserCheck className="h-8 w-8 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-4">{bcgxCaseData.roleAndTeam.team.title}</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {bcgxCaseData.roleAndTeam.team.details.map((member, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        {member}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>

              {/* Duration & Scope */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-6 h-full">
                  <Target className="h-8 w-8 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-4">{bcgxCaseData.roleAndTeam.duration.title}</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {bcgxCaseData.roleAndTeam.duration.details.map((scope, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        {scope}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Design Process</h2>
          
          <div className="space-y-12">
            {bcgxCaseData.process.map((step, index) => {
              const IconComponent = step.icon === "Eye" ? Eye : step.icon === "BarChart3" ? BarChart3 : Zap;
              const animationDirection = index % 2 === 0 ? -30 : 30;
              
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: animationDirection }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <IconComponent className="h-6 w-6 text-primary" />
                      <h3 className="text-xl font-bold">{index + 1}. {step.title}</h3>
                    </div>
                    
                    {step.activities ? (
                      <ul className="space-y-2 text-muted-foreground">
                        {step.activities.map((activity, activityIndex) => (
                          <li key={activityIndex} className="flex items-start">
                            <span className="text-primary mr-2">•</span>
                            {activity}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">{step.description}</p>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Solution & Key Features */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Solution & Key Features</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {bcgxCaseData.solutionFeatures.map((feature, index) => {
              const IconComponent = 
                feature.icon === "Shield" ? Shield :
                feature.icon === "CheckCircle" ? CheckCircle :
                feature.icon === "Clock" ? Clock :
                feature.icon === "TrendingUp" ? TrendingUp :
                Eye;
              
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 h-full">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-2">{index + 1}. {feature.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Outcome & Impact</h2>
          {/* User Feedback */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="p-8">
              <h3 className="text-xl font-bold mb-6">User Feedback</h3>
              <blockquote className="text-lg italic text-muted-foreground mb-4 leading-relaxed">
                "Having all denials in one place and evidence surfaced automatically saved us hours each week."
              </blockquote>
              <p className="text-sm text-muted-foreground">
                — Maria Lopez, Office Manager, Sunshine Family Clinic
              </p>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Reflection & Learnings */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Reflection & Learnings</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* What Went Well */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-500/10 p-2 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold">What Went Well</h3>
                </div>
                <ul className="space-y-3">
                  {bcgxCaseData.reflection.whatWentWell.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-primary mr-2 mt-1">•</span>
                      <span className="text-muted-foreground text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>

            {/* Challenges & Solutions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-orange-500/10 p-2 rounded-full">
                    <AlertCircle className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold">Challenges & Solutions</h3>
                </div>
                <div className="space-y-3">
                  {bcgxCaseData.reflection.challengesAndSolutions.map((item, index) => (
                    <div key={index} className="flex items-start">
                      <span className="text-primary mr-2 mt-1">•</span>
                      <span className="text-muted-foreground text-sm leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Next Steps & Evolution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-500/10 p-2 rounded-full">
                  <Lightbulb className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">Next Steps & Evolution</h3>
              </div>
              <ul className="space-y-3">
                {bcgxCaseData.reflection.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary mr-2 mt-1">•</span>
                    <span className="text-muted-foreground text-sm leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Visuals & Artifacts */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Visuals & Artifacts</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Design Artifacts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <Eye className="h-6 w-6 text-gray-700" />
                  </div>
                  <h3 className="text-xl font-bold">Design Artifacts</h3>
                </div>
                <ul className="space-y-3">
                  {bcgxCaseData.visualsAndArtifacts.designArtifacts.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-primary mr-2 mt-1">•</span>
                      <span className="text-muted-foreground text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>

            {/* Process Documentation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <Target className="h-6 w-6 text-gray-700" />
                  </div>
                  <h3 className="text-xl font-bold">Process Documentation</h3>
                </div>
                <ul className="space-y-3">
                  {bcgxCaseData.visualsAndArtifacts.processDocumentation.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-primary mr-2 mt-1">•</span>
                      <span className="text-muted-foreground text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          </div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl mx-auto">
              A balanced mix of process documentation (60%) and visual artifacts (40%) demonstrates both strategic thinking and execution excellence.
            </p>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <Button className="bg-foreground text-background hover:bg-foreground/90 px-8 py-3">
              Request Full Case Study Details
            </Button>
          </motion.div>
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