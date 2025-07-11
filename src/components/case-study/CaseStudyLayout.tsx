import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { CaseStudyData } from "@/types/caseStudy";
import { CaseStudyHero } from "./CaseStudyHero";
import { SectionContainer } from "./SectionContainer";
import { ProcessStep } from "./ProcessStep";
import { FeatureCard } from "./FeatureCard";
import { ChallengesList } from "./ChallengesList";
import { VisualsArtifacts } from "./VisualsArtifacts";
import { CTASection } from "./CTASection";

interface CaseStudyLayoutProps {
  data: CaseStudyData;
}

export const CaseStudyLayout = ({ data }: CaseStudyLayoutProps) => {
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
          <Button variant="outline" size="sm" asChild>
            <a href="mailto:?subject=Jordan%20Intro">Contact Jordan</a>
          </Button>
        </div>
      </motion.header>

      <CaseStudyHero data={data} />
      
      {/* Problem Statement */}
      <SectionContainer className="bg-muted/30">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">{data.problemTitle}</h2>
        <p className="text-lg leading-relaxed text-muted-foreground mb-8">{data.problemDescription}</p>
        <ChallengesList challenges={data.challenges} />
      </SectionContainer>

      {/* Team Section */}
      <SectionContainer>
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">My Role & Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {data.teamMembers.map((member, index) => (
            <FeatureCard key={index} feature={member} index={index} />
          ))}
        </div>
      </SectionContainer>

      {/* Process Section */}
      <SectionContainer className="bg-muted/30">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">{data.processTitle}</h2>
        <div className="space-y-8">
          {data.processSteps.map((step, index) => (
            <ProcessStep key={index} step={step} index={index} />
          ))}
        </div>
      </SectionContainer>

      {/* Solution Section */}
      <SectionContainer>
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">{data.solutionTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </SectionContainer>

      {/* Outcomes */}
      <SectionContainer className="bg-muted/30">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">{data.outcomesTitle}</h2>
        {data.userFeedback && (
          <div className="max-w-3xl mx-auto text-center">
            <blockquote className="text-xl italic text-muted-foreground mb-4 leading-relaxed">
              "{data.userFeedback.quote}"
            </blockquote>
            <p className="text-sm text-muted-foreground">— {data.userFeedback.author}</p>
          </div>
        )}
      </SectionContainer>

      {/* Reflection */}
      <SectionContainer>
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">{data.reflectionTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.reflections.map((reflection, index) => (
            <FeatureCard key={index} feature={reflection} index={index} />
          ))}
        </div>
      </SectionContainer>

      {/* Visuals & Artifacts */}
      <SectionContainer className="bg-muted/30">
        <VisualsArtifacts data={data.visualsAndArtifacts} />
      </SectionContainer>

      {/* CTA */}
      <SectionContainer>
        <CTASection title={data.ctaTitle} />
      </SectionContainer>
    </div>
  );
};