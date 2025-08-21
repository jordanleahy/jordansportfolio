export interface ProcessStep {
  icon: string;
  title: string;
  description: string;
  items?: string[];
  quote?: {
    text: string;
    author: string;
  };
  image?: string;
  images?: Array<{
    src: string;
    alt: string;
    caption?: string;
    title?: string;
  }>;
  media?: Array<{
    type: 'image' | 'iframe';
    src: string;
    alt: string;
    caption?: string;
    title?: string;
    thumbnailSrc?: string;
  }>;
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
  images?: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
}

export interface TeamMember {
  icon: string;
  title: string;
  description: string;
  items: string[];
  images?: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
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

export interface FigmaPresentation {
  enabled: boolean;
  password: string;
  presentationUrl: string;
  title: string;
  description?: string;
}

export interface FinalProduct {
  title: string;
  prototypeUrl: string;
  description?: string;
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
  
  // Final Product Section
  finalProduct: FinalProduct;
  
  // Figma Presentation (optional)
  figmaPresentation?: FigmaPresentation;
  
  // Problem Section
  problemTitle: string;
  problemDescription: string;
  challenges: Challenge[];
  problemIframeUrl?: string;
  problemIframeTitle?: string;
  
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