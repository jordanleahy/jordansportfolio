import { SEOHead } from "./SEOHead";
import { CaseStudyPage } from "./CaseStudyPage";
import { CaseStudyHero } from "./CaseStudyHero";
import { CaseStudyNavigation } from "./CaseStudyNavigation";
import { ProblemSection } from "./ProblemSection";
import { TeamSection } from "./TeamSection";
import { ProcessSection } from "./ProcessSection";
import { SolutionSection } from "./SolutionSection";
import { OutcomesSection } from "./OutcomesSection";
import { ReflectionSection } from "./ReflectionSection";
import { VisualsSection } from "./VisualsSection";
import { CTASection } from "./CTASection";
import { CaseStudyData } from "@/types/caseStudy";

interface CaseStudyLayoutProps {
  data: CaseStudyData;
  path: string;
}

export const CaseStudyLayout = ({ data, path }: CaseStudyLayoutProps) => {
  return (
    <CaseStudyPage>
      <SEOHead 
        title={data.title}
        description={data.description}
        image={data.heroImage}
        path={path}
      />
      
      <CaseStudyNavigation
        problemTitle={data.problemTitle}
        teamTitle="Team"
        processTitle={data.processTitle}
        solutionTitle={data.solutionTitle}
        outcomesTitle={data.outcomesTitle}
        reflectionTitle={data.reflectionTitle}
      />
      
      <div id="context">
        <CaseStudyHero 
          title={data.title}
          description={data.description}
          heroImage={data.heroImage}
          heroImageAlt={data.heroImageAlt}
          role={data.role}
          roleDetails={data.roleDetails}
          timeline={data.timeline}
          timelineDetails={data.timelineDetails}
          tags={data.tags}
        />
      </div>
      
      <div id="problem">
        <ProblemSection
          title={data.problemTitle}
          description={data.problemDescription}
          challenges={data.challenges}
          iframeUrl={data.problemIframeUrl}
          iframeTitle={data.problemIframeTitle}
        />
      </div>
      
      <div id="team">
        <TeamSection teamMembers={data.teamMembers} />
      </div>
      
      <div id="process">
        <ProcessSection 
          title={data.processTitle}
          steps={data.processSteps}
        />
      </div>
      
      <div id="solution">
        <SolutionSection 
          title={data.solutionTitle}
          features={data.features}
        />
      </div>
      
      <div id="impact">
        <OutcomesSection 
          title={data.outcomesTitle}
          userFeedback={data.userFeedback}
        />
      </div>
      
      <div id="reflection">
        <ReflectionSection 
          title={data.reflectionTitle}
          reflections={data.reflections}
        />
      </div>
      
      <VisualsSection data={data.visualsAndArtifacts} />
      
      <CTASection title={data.ctaTitle} />
    </CaseStudyPage>
  );
};