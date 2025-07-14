import { CaseStudyData } from "@/types/caseStudy";

export const case3Data: CaseStudyData = {
  // Hero Section
  title: "Healthcare Denial Management Platform: UX Case Study - AI-Powered Revenue Recovery",
  description: "How I designed an AI-powered denial management platform that reduced claim appeal processing time by 10 minutes. Explore the UX research, design process, and impact on healthcare revenue cycle management, featuring automated claim analysis and intelligent appeal generation.",
  heroImage: "/lovable-uploads/ed730bb1-ba72-46ce-bfa8-1a7aa1f8e60d.png",
  heroImageAlt: "Denial and Appeal Management dashboard showing claim analysis and appeal workflow",
  role: "Senior Product Designer", 
  roleDetails: "End-to-end UX/UI ownership",
  timeline: "5 months",
  timelineDetails: "January - May 2025",
  tags: ["Denial Management", "Appeals", "Revenue Cycle", "Healthcare AI"],
  
  // Problem Section
  problemTitle: "The Challenge",
  problemDescription: "Healthcare practices face an average 15% claim denial rate, with manual appeal processes taking 45-60 days per case. Small practices often lack dedicated staff to handle complex appeals, resulting in $20B spent tyring to overturn denials.",
  challenges: [
    {
      type: 'problem',
      title: 'Business Impact',
      items: [
        "45-60 day average appeal resolution time",
        "15% average claim denial rate", 
        "$20B annual lost spent pursuing denials"
      ]
    },
    {
      type: 'need',
      title: 'Research Challenges',
      items: [
        "Complex payer specific denial patterns",
        "Manual evidence gathering from patient records",
        "Inconsistent appeal letter quality and success rates"
      ]
    }
  ],

  // Team Section
  teamMembers: [
    {
      icon: "Users",
      title: "My Role",
      description: "Senior Product Designer",
      items: [
        "User research & workflow analysis",
        "Information architecture & wireframing", 
        "Prototype development & testing",
        "Design system creation"
      ]
    },
    {
      icon: "Users", 
      title: "Team & Stakeholders",
      description: "",
      items: [
        "2 Revenue Cycle Specialists",
        "3 Software Engineers",
        "1 ML Engineer", 
        "1 Healthcare Compliance Expert",
        "Product Manager"
      ]
    },
    {
      icon: "Target",
      title: "Duration & Scope", 
      description: "4 month timeline",
      items: [
        "5 major payer integrations",
        "Top denial templates",
        "ML prediction tempalte design",
        "Automated workflow creation"
      ]
    }
  ],

  // Process Section
  processTitle: "Design Process",
  processSteps: [
    {
      icon: "Eye",
      title: "1. Research & Discovery",
      description: "Deep dive into revenue cycle workflows and denial management pain points",
      image: "/lovable-uploads/f8bdf34c-98f3-483b-9033-2c28bda929cd.png",
      items: [
        "Shadowed coding and appeal specialists internally.",
        "Analyzed 50+ denial cases across different payers", 
        "Mapped current appeal workflow inefficiencies",
        "Competitive analysis of existing RCM tools"
      ],
      quote: {
        text: "Every denied claim is a puzzle with different pieces. We need better tools to solve them faster.",
        author: "Revenue Cycle Manager, Internal Manager"
      }
    },
    {
      icon: "Lightbulb",
      title: "2. Ideation & Concepting",
      description: "Collaborative workshops to prioritize features and define user flows",
      image: "/lovable-uploads/3e1c498e-aaa3-49a7-a2ee-5c4b772223fb.png",
      items: [
        "User journey mapping for denial to resolution workflow",
        "Feature prioritization workshops with stakeholders",
        "Information architecture for complex appeal data", 
        "Wireframe iterations for dashboard and case views"
      ]
    },
    {
      icon: "Target",
      title: "3. Prototyping & Validation",
      description: "Rapid prototyping and user testing to validate design decisions",
      image: "/lovable-uploads/dfaaf33d-9dd1-4c76-8be2-bba0c4b46d98.png",
      items: [
        "Interactive Figma prototypes for core workflows",
        "Usability testing with billing staff",
        "A/B testing for appeal letter generation UI",
        "Validation sessions with revenue cycle experts"
      ]
    },
    {
      icon: "CheckCircle", 
      title: "4. Iteration & Handoff",
      description: "Design refinement and comprehensive documentation for development",
      image: "/lovable-uploads/8558410b-841e-412e-a8ce-ef6084e9a684.png",
      items: [
        "Component library and design tokens",
        "Detailed interaction specifications",
        "User acceptance criteria documentation",
        "QA support throughout development sprints"
      ]
    }
  ],

  // Solution Section
  solutionTitle: "Solution & Key Features",
  features: [
    {
      icon: "Brain",
      title: "AI Powered Claim Analysis", 
      description: "Automatically identifies denial reasons and extracts relevant patient data for targeted appeals."
    },
    {
      icon: "FileText",
      title: "Smart Appeal Generation",
      description: "Generates personalized appeal letters using payer-specific templates and clinical evidence."
    },
    {
      icon: "TrendingUp",
      title: "Grouped Assignment",
      description: "Tracks denial trends and payer behavior to improve future claim submission strategies."
    },
    {
      icon: "Clock", 
      title: "Automated Follow Up",
      description: "Intelligent scheduling and tracking of appeal deadlines with automatic status updates."
    },
    {
      icon: "Shield",
      title: "Compliance Monitoring",
      description: "Ensures all appeals meet regulatory requirements and payer specific guidelines."
    },
    {
      icon: "Users",
      title: "Team Collaboration", 
      description: "Workflow management tools that coordinate between billing, clinical, and administrative staff."
    }
  ],

  // Outcomes Section
  outcomesTitle: "Outcomes",
  userFeedback: {
    quote: "This platform cut our appeal processing time from 30 minutes to 10 minutes.",
    author: "Internal appeal writer"
  },

  // Reflection Section  
  reflectionTitle: "Reflection & Learnings",
  reflections: [
    {
      type: 'success',
      title: 'What Went Well',
      items: [
        "Strong stakeholder engagement led to accurate requirements gathering",
        "Iterative design process prevented major usability issues", 
        "Early prototype validation saved significant development time",
        "Cross functional collaboration improved solution quality"
      ]
    },
    {
      type: 'challenge',
      title: 'Challenges', 
      items: [
        "Complex regulatory requirements created design constraints",
        "Legacy API limitations required creative workflow solutions",
        "Balancing automation with user control in AI features",
        "Managing technical debt while adding new functionality"
      ]
    },
    {
      type: 'learning',
      title: 'Next Steps',
      items: [
        "Expand to additional payer integrations and denial categories",
        "Implement predictive analytics for proactive claim management",
        "Develop mobile interface for on the go case management", 
        "Add advanced reporting and ROI tracking capabilities"
      ]
    }
  ],

  // Visuals & Artifacts
  visualsAndArtifacts: {
    designArtifacts: [
      "Annotated wireframes (Figma) for each feature",
      "Component library exports (JSON)",
      "AI prompt engineering documentation"
    ],
    processDocumentation: [
      "Small-practice workflow maps",
      "Usability test reports",
      "Handoff and QA checklists"
    ]
  },

  // CTA
  ctaTitle: "Ready to transform healthcare operations with intelligent automation?"
};
