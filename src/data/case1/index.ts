import { CaseStudyData } from "@/types/caseStudy";
import { heroData } from "./heroData";
import { figmaData } from "./figmaData";
import { problemData } from "./problemData";
import { teamData } from "./teamData";
import { processData } from "./processData";
import { solutionData } from "./solutionData";
import { outcomesData } from "./outcomesData";
import { reflectionData } from "./reflectionData";
import { visualsData } from "./visualsData";

export const case1Data: CaseStudyData = {
  // Hero Section
  ...heroData,
  
  // Figma Presentation
  ...figmaData,
  
  // Problem Section
  ...problemData,
  
  // Team Section
  ...teamData,
  
  // Process Section
  ...processData,
  
  // Solution Section
  ...solutionData,
  
  // Outcomes Section
  ...outcomesData,
  
  // Reflection Section
  ...reflectionData,
  
  // Visuals & Artifacts
  ...visualsData,
  
  // CTA
  ctaTitle: "Ready to improve patient outcomes with intelligent healthcare design?"
};