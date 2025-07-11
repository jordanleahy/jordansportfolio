export interface ProcessStep {
  icon: string;
  title: string;
  description: string;
  items?: string[];
  quote?: {
    text: string;
    author: string;
  };
}

export interface Challenge {
  type: 'problem' | 'need';
  title: string;
  items: string[];
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface TeamMember {
  icon: string;
  title: string;
  description: string;
  items: string[];
}

export interface Reflection {
  type: 'success' | 'challenge' | 'learning';
  title: string;
  items: string[];
}

export interface VisualsArtifacts {
  designArtifacts: string[];
  processDocumentation: string[];
}

export interface CaseStudyData {
  // Hero Section
  title: string;
  description: string;
  heroImage: string;
  heroImageAlt: string;
  role: string;
  roleDetails?: string;
  timeline: string;
  timelineDetails?: string;
  tags: string[];
  
  // Problem Section
  problemTitle: string;
  problemDescription: string;
  challenges: Challenge[];
  
  // Team Section
  teamMembers: TeamMember[];
  
  // Process Section
  processTitle: string;
  processSteps: ProcessStep[];
  
  // Solution Section
  solutionTitle: string;
  features: Feature[];
  
  // Outcomes Section
  outcomesTitle: string;
  userFeedback?: {
    quote: string;
    author: string;
  };
  
  // Reflection Section
  reflectionTitle: string;
  reflections: Reflection[];
  
  // Visuals & Artifacts
  visualsAndArtifacts: VisualsArtifacts;
  
  // CTA
  ctaTitle: string;
}