import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { case3Data } from "@/data/case3Data";
import { iconMap } from "@/utils/iconMap";
import { useEffect } from "react";
import { Helmet } from 'react-helmet-async';

const Case3 = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Denial and Appeal Management - Case Study | Jordan's Portfolio</title>
        <meta name="description" content="AI-powered denial management platform case study. Automated claim review, appeal letter generation, and payer response tracking to reduce denial rates and accelerate revenue recovery." />
        <meta property="og:title" content="Denial and Appeal Management - Healthcare AI Case Study" />
        <meta property="og:description" content="AI-powered denial management platform that automates claim review and generates targeted appeal letters for healthcare practices." />
        <meta property="og:image" content="https://265639ae-98fe-47f5-888f-bed563c20e8d.lovableproject.com/lovable-uploads/b040919d-eb34-428f-ba71-3ee1aba6596b.png" />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Denial and Appeal Management - Healthcare AI Case Study" />
        <meta name="twitter:description" content="AI-powered denial management platform that automates claim review and generates targeted appeal letters for healthcare practices." />
        <meta name="twitter:image" content="https://265639ae-98fe-47f5-888f-bed563c20e8d.lovableproject.com/lovable-uploads/b040919d-eb34-428f-ba71-3ee1aba6596b.png" />
      </Helmet>
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
              <h1 className="text-4xl font-bold mb-2">{case3Data.title}</h1>
              <p className="text-lg text-muted-foreground mb-6">{case3Data.description}</p>
              
              {/* Hero Image */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative mb-6 rounded-2xl overflow-hidden shadow-lg border border-border/50"
              >
                <img 
                  src={case3Data.heroImage}
                  alt={case3Data.heroImageAlt}
                  className="w-full h-auto object-cover aspect-video"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent"></div>
              </motion.div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">My Role</h3>
                <p>{case3Data.role}</p>
                {case3Data.roleDetails && <p className="text-sm text-muted-foreground">{case3Data.roleDetails}</p>}
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">Timeline</h3>
                <p>{case3Data.timeline}</p>
                {case3Data.timelineDetails && <p className="text-sm text-muted-foreground">{case3Data.timelineDetails}</p>}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {case3Data.tags.map((tag) => (
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
            <h2 className="text-3xl font-bold mb-6">{case3Data.problemTitle}</h2>
            <p className="text-lg leading-relaxed text-muted-foreground mb-6">{case3Data.problemDescription}</p>
            <div className="grid md:grid-cols-2 gap-6">
              {case3Data.challenges.map((challenge, index) => (
                <Card key={index} className="p-6">
                  <h4 className="font-semibold mb-2">{challenge.title}</h4>
                  <ul className="space-y-2">
                    {challenge.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-muted-foreground text-sm flex items-start gap-2">
                        <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">My Role & Team</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {case3Data.teamMembers.map((member, index) => {
              const IconComponent = iconMap[member.icon as keyof typeof iconMap];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">{member.title}</h3>
                        {member.description && <p className="text-muted-foreground mb-4">{member.description}</p>}
                        <ul className="space-y-2">
                          {member.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Design Process Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{case3Data.processTitle}</h2>
          </motion.div>

          <div className="space-y-8">
            {case3Data.processSteps.map((step, index) => {
              const IconComponent = iconMap[step.icon as keyof typeof iconMap];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                        <IconComponent className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                        <p className="text-muted-foreground mb-4">{step.description}</p>
                        {step.items && (
                          <ul className="space-y-2 mb-4">
                            {step.items.map((item, itemIndex) => (
                              <li key={itemIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                        {step.quote && (
                          <blockquote className="border-l-4 border-primary/20 pl-4 italic text-muted-foreground">
                            "{step.quote.text}"
                            <footer className="text-sm mt-1">— {step.quote.author}</footer>
                          </blockquote>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Solution & Key Features */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{case3Data.solutionTitle}</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {case3Data.features.map((feature, index) => {
              const IconComponent = iconMap[feature.icon as keyof typeof iconMap];
              return (
                <motion.div
                  key={index}
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
                        <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
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
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{case3Data.outcomesTitle}</h2>
          </motion.div>
          
          {case3Data.userFeedback && (
            <Card className="p-8">
              <div className="max-w-3xl mx-auto text-center">
                <blockquote className="text-xl italic text-muted-foreground mb-4 leading-relaxed">
                  "{case3Data.userFeedback.quote}"
                </blockquote>
                <p className="text-sm text-muted-foreground">— {case3Data.userFeedback.author}</p>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* Reflection & Learnings */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{case3Data.reflectionTitle}</h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {case3Data.reflections.map((reflection, index) => {
              const isSuccess = reflection.type === 'success';
              const isChallenge = reflection.type === 'challenge';
              const isLearning = reflection.type === 'learning';
              
              const iconColor = isSuccess ? 'text-green-500' : isChallenge ? 'text-orange-500' : 'text-blue-500';
              const bgColor = isSuccess ? 'bg-green-500/10' : isChallenge ? 'bg-orange-500/10' : 'bg-blue-500/10';
              const IconComponent = isSuccess ? CheckCircle : isChallenge ? AlertTriangle : ArrowRight;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 ${bgColor} rounded-lg`}>
                        <IconComponent className={`h-5 w-5 ${iconColor}`} />
                      </div>
                      <h3 className="text-xl font-bold">{reflection.title}</h3>
                    </div>
                    <ul className="space-y-2">
                      {reflection.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                          <IconComponent className={`h-4 w-4 ${iconColor} mt-0.5 flex-shrink-0`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Visuals & Artifacts */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Visuals & Artifacts</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Design Artifacts</h3>
              <ul className="space-y-2">
                {case3Data.visualsAndArtifacts.designArtifacts.map((item, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Process Documentation</h3>
              <ul className="space-y-2">
                {case3Data.visualsAndArtifacts.processDocumentation.map((item, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8">{case3Data.ctaTitle}</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <a href="#contact">Start a Project</a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/">View More Work</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Case3;