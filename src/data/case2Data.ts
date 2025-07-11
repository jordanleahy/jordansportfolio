import { CaseStudyData } from "@/types/caseStudy";

export const case2Data: CaseStudyData = {
  // Hero Section
  title: "Healthcare Platform Redesign",
  description: "Complete redesign of a healthcare intelligence platform that unified 15+ disconnected products into a cohesive design system, improving user engagement and reducing customer churn.",
  heroImage: "/lovable-uploads/8c1110c1-02c2-4041-987c-a9d030ffef3b.png",
  heroImageAlt: "UI Design System and reporting dashboard interface",
  role: "Lead Product Designer", 
  roleDetails: "Design system architect & UX lead",
  timeline: "12 months",
  timelineDetails: "January 2023 - January 2024",
  tags: ["Design System", "Platform Redesign", "Healthcare Intelligence", "User Experience"],
  
  // Problem Section
  problemTitle: "The Challenge",
  problemDescription: "The healthcare organization had 15+ disconnected products with inconsistent user experiences. Healthcare executives were struggling to find insights across different data platforms, leading to low user engagement and high churn rates.",
  challenges: [
    {
      type: 'problem',
      title: 'Design Debt',
      items: [
        "15 different UI patterns for similar functions",
        "6 months to design new features",
        "40% customer confusion rate"
      ]
    },
    {
      type: 'need',
      title: 'User Experience Issues',
      items: [
        "Healthcare executives couldn't find key insights",
        "Inconsistent navigation across products",
        "Poor data visualization standards"
      ]
    }
  ],

  // Team Section
  teamMembers: [
    {
      icon: "Users",
      title: "My Role",
      description: "Lead Product Designer",
      items: [
        "Design system architecture & governance",
        "Cross-product UX standardization", 
        "Stakeholder alignment & strategy",
        "Team mentoring & design operations"
      ]
    },
    {
      icon: "Users", 
      title: "Team & Stakeholders",
      description: "",
      items: [
        "5 Product Designers",
        "8 Frontend Engineers",
        "3 Product Managers", 
        "12 Healthcare Domain Experts",
        "Executive Leadership Team"
      ]
    },
    {
      icon: "Target",
      title: "Duration & Scope", 
      description: "12-month transformation",
      items: [
        "15+ product consolidation",
        "Unified design system creation",
        "Cross-platform implementation",
        "User experience standardization"
      ]
    }
  ],

  // Process Section
  processTitle: "Design Process",
  processSteps: [
    {
      icon: "Eye",
      title: "1. Audit & Discovery",
      description: "Comprehensive analysis of existing products and user pain points",
      items: [
        "UI audit across 15+ products and platforms",
        "User interviews with 30+ healthcare executives", 
        "Analytics review of user behavior patterns",
        "Competitive analysis of healthcare platforms"
      ],
      quote: {
        text: "We spend more time figuring out how to use the tools than actually analyzing the data.",
        author: "Healthcare Executive, Regional Health System"
      }
    },
    {
      icon: "Lightbulb",
      title: "2. Design System Strategy",
      description: "Creating unified design principles and component architecture",
      items: [
        "Design token standardization across platforms",
        "Component library planning and prioritization",
        "Information architecture restructuring", 
        "Accessibility and usability standards definition"
      ]
    },
    {
      icon: "Target",
      title: "3. Prototyping & Validation",
      description: "Iterative design and testing with real users", 
      items: [
        "High-fidelity prototypes for key user journeys",
        "Usability testing with healthcare professionals",
        "Design system documentation and guidelines",
        "Cross-team collaboration and feedback integration"
      ]
    },
    {
      icon: "CheckCircle", 
      title: "4. Implementation & Scale",
      description: "Systematic rollout across all products and teams",
      items: [
        "Component library development and distribution",
        "Designer and developer training programs",
        "Product migration planning and execution",
        "Success metrics tracking and optimization"
      ]
    }
  ],

  // Solution Section
  solutionTitle: "Solution & Key Features",
  features: [
    {
      icon: "Lightbulb",
      title: "Unified Design System", 
      description: "Comprehensive component library and design tokens that ensured consistency across all 15+ products."
    },
    {
      icon: "Users",
      title: "Streamlined Navigation",
      description: "Intuitive information architecture that made finding insights effortless for healthcare executives."
    },
    {
      icon: "TrendingUp",
      title: "Enhanced Data Visualization",
      description: "Standardized chart libraries and visualization patterns for better data comprehension."
    },
    {
      icon: "Target", 
      title: "Responsive Design Framework",
      description: "Mobile-first approach ensuring seamless experience across all devices and screen sizes."
    },
    {
      icon: "CheckCircle",
      title: "Accessibility Standards",
      description: "WCAG 2.1 AA compliance ensuring the platform is usable by all healthcare professionals."
    },
    {
      icon: "Lightbulb",
      title: "Design Operations", 
      description: "Scalable design processes and documentation that enabled rapid feature development."
    }
  ],

  // Outcomes Section
  outcomesTitle: "Outcomes",
  userFeedback: {
    quote: "The new design system reduced our feature development time by 60% while dramatically improving user satisfaction.",
    author: "Sarah Johnson, VP of Product"
  },

  // Reflection Section  
  reflectionTitle: "Reflection & Learnings",
  reflections: [
    {
      type: 'success',
      title: 'What Went Well',
      items: [
        "Cross-functional collaboration led to rapid adoption",
        "Systematic approach prevented design inconsistencies", 
        "Early stakeholder buy-in ensured project success",
        "Comprehensive documentation enabled team scalability"
      ]
    },
    {
      type: 'challenge',
      title: 'Challenges', 
      items: [
        "Legacy product constraints required creative solutions",
        "Coordinating 15+ product teams was complex",
        "Balancing innovation with user familiarity",
        "Managing technical debt while building new features"
      ]
    },
    {
      type: 'learning',
      title: 'Next Steps',
      items: [
        "Expand design system to mobile applications",
        "Implement advanced analytics and AI features",
        "Develop white-label customization capabilities", 
        "Create predictive user experience personalization"
      ]
    }
  ],

  // Visuals & Artifacts
  visualsAndArtifacts: {
    designArtifacts: [
      "Complete design system documentation (Figma)",
      "Component library with usage guidelines",
      "Brand guidelines and visual identity standards"
    ],
    processDocumentation: [
      "Cross-product UI audit findings",
      "User research insights and journey maps",
      "Implementation roadmap and success metrics"
    ]
  },

  // CTA
  ctaTitle: "Ready to transform your product experience with systematic design?"
};