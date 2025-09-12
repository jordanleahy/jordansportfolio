import { SEOHead } from "./SEOHead";
import { CaseStudyPage } from "./CaseStudyPage";
import { CaseStudyHero } from "./CaseStudyHero";
import { FinalProductSection } from "./FinalProductSection";
import { FigmaPresentationViewer } from "./FigmaPresentationViewer";
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
      
      {data.figmaPresentation?.enabled && (
        <FigmaPresentationViewer
          title={data.figmaPresentation.title}
          presentationUrl={data.figmaPresentation.presentationUrl}
        />
      )}
      
      {data.finalProduct?.prototypeUrl && (
        <FinalProductSection data={data.finalProduct} />
      )}
      
      <ProblemSection
        title={data.problemTitle}
        description={data.problemDescription}
        challenges={data.challenges}
        iframeUrl={data.problemIframeUrl}
        iframeTitle={data.problemIframeTitle}
      />
      
      <TeamSection teamMembers={data.teamMembers} />
      
      <ProcessSection 
        title={data.processTitle}
        steps={data.processSteps}
      />
      
      <SolutionSection 
        title={data.solutionTitle}
        features={data.features}
      />
      
      <OutcomesSection 
        title={data.outcomesTitle}
        userFeedback={data.userFeedback}
      />
      
      <ReflectionSection 
        title={data.reflectionTitle}
        reflections={data.reflections}
      />
      
      <VisualsSection data={data.visualsAndArtifacts} />
      
      <CTASection title={data.ctaTitle} />
    </CaseStudyPage>
  );
};