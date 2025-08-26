import { CaseStudyData } from "@/types/caseStudy";

export const case5Data: CaseStudyData = {
  // Hero Section
  title: "Health system key data customization for system",
  description: "I redesigned healthy system and hospital financial and clinical intelligence interface to be mobile responsive and customizable for healthcare organizations to better track key performance indicators.",
  heroImage: "/lovable-uploads/0371b967-606a-4e28-9988-0e597407f50d.png",
  heroImageAlt: "Healthcare dashboard showing financial and clinical metrics with customizable interface",
  role: "Senior Product Designer", 
  roleDetails: "UX/UI Design & Research",
  timeline: "4 months",
  timelineDetails: "September - December 2024",
  tags: ["Healthcare Data", "Dashboard Design", "Mobile Responsive", "Healthcare Analytics"],
  
  // Final Product Section
  finalProduct: {
    title: "Responsive Healthcare Intelligence Dashboard",
    prototypeUrl: "https://www.figma.com/proto/sample-healthcare-dashboard",
    description: "Experience the redesigned healthcare dashboard that adapts to any device and provides customizable views for financial and clinical intelligence."
  },
  
  // Problem Section
  problemTitle: "The Challenge",
  problemDescription: "Healthcare systems needed a unified dashboard to track both financial and clinical metrics, but existing interfaces were not mobile-friendly and lacked customization options for different user roles and departments.",
  challenges: [
    {
      type: 'problem',
      title: 'User Experience Issues',
      items: [
        "Desktop-only interface limiting mobile access",
        "Fixed layouts not adaptable to different roles", 
        "Complex navigation hindering quick data access"
      ]
    },
    {
      type: 'need',
      title: 'Technical Requirements',
      items: [
        "Mobile-responsive design for on-the-go access",
        "Customizable dashboard widgets and layouts",
        "Unified view of financial and clinical data"
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
        "User research with healthcare administrators",
        "Responsive design system creation", 
        "Dashboard customization workflows",
        "Mobile-first design approach"
      ]
    },
    {
      icon: "Users", 
      title: "Team & Stakeholders",
      description: "",
      items: [
        "2 Frontend Engineers",
        "1 Backend Developer",
        "Product Manager",
        "Healthcare Data Analyst"
      ]
    },
    {
      icon: "Target",
      title: "Duration & Scope", 
      description: "4 month timeline",
      items: [
        "Responsive dashboard redesign",
        "Customization framework",
        "Mobile navigation patterns",
        "Data visualization improvements"
      ]
    }
  ],

  // Process Section
  processTitle: "Design Process",
  processSteps: [
    {
      icon: "Eye",
      title: "1. User Research & Analysis",
      description: "Understanding healthcare admin workflows and mobile usage patterns",
      items: [
        "Interviewed 15+ healthcare administrators",
        "Analyzed existing dashboard usage patterns", 
        "Identified key mobile use cases",
        "Competitive analysis of healthcare dashboards"
      ],
      quote: {
        text: "We need to check our metrics on the go, but the current system just doesn't work on mobile.",
        author: "Hospital Administrator, Healthcare Data"
      }
    },
    {
      icon: "Lightbulb",
      title: "2. Information Architecture",
      description: "Restructuring dashboard layout for responsive and customizable design",
      items: [
        "Card-based layout system design",
        "Progressive disclosure patterns",
        "Customization hierarchy mapping", 
        "Mobile navigation strategy"
      ]
    },
    {
      icon: "Target",
      title: "3. Responsive Prototyping",
      description: "Creating adaptive layouts that work across all devices",
      items: [
        "Mobile-first wireframes",
        "Responsive breakpoint testing",
        "Interactive dashboard prototypes",
        "Customization flow validation"
      ]
    },
    {
      icon: "CheckCircle", 
      title: "4. Testing & Iteration",
      description: "Validating design decisions with real healthcare data",
      items: [
        "Usability testing on multiple devices",
        "A/B testing for dashboard layouts",
        "Performance optimization",
        "Accessibility compliance validation"
      ]
    }
  ],

  // Solution Section
  solutionTitle: "Solution & Key Features",
  features: [
    {
      icon: "Smartphone",
      title: "Mobile-First Design", 
      description: "Fully responsive interface that provides optimal experience across all devices and screen sizes."
    },
    {
      icon: "Layout",
      title: "Customizable Dashboards",
      description: "Drag-and-drop widget customization allowing users to personalize their dashboard views."
    },
    {
      icon: "BarChart",
      title: "Unified Analytics",
      description: "Single interface combining financial strength, clinical quality, and network metrics."
    },
    {
      icon: "Settings", 
      title: "Role-Based Views",
      description: "Customizable layouts and permissions based on user roles and department needs."
    },
    {
      icon: "Zap",
      title: "Real-Time Updates",
      description: "Live data synchronization ensuring users always have the most current information."
    },
    {
      icon: "Eye",
      title: "Improved Readability", 
      description: "Enhanced typography and color coding for better data comprehension and accessibility."
    }
  ],

  // Outcomes Section
  outcomesTitle: "Impact & Results",
  userFeedback: {
    quote: "The new mobile interface has completely transformed how we monitor our hospital's performance. I can now check critical metrics during rounds.",
    author: "Chief Medical Officer, Healthcare Data"
  },

  // Reflection Section  
  reflectionTitle: "Reflection & Learnings",
  reflections: [
    {
      type: 'success',
      title: 'What Went Well',
      items: [
        "Mobile-first approach resulted in better overall user experience",
        "User feedback sessions led to intuitive customization patterns", 
        "Performance optimization improved dashboard load times",
        "Accessibility improvements benefited all users"
      ]
    },
    {
      type: 'challenge',
      title: 'Challenges', 
      items: [
        "Balancing data density with mobile readability",
        "Complex permission systems for role-based customization",
        "Legacy data integration constraints"
      ]
    },
    {
      type: 'learning',
      title: 'Key Takeaways',
      items: [
        "Healthcare users value consistency across devices",
        "Customization features must be intuitive to be adopted",
        "Mobile access is crucial for healthcare decision-making"
      ]
    }
  ],

  // Visuals & Artifacts
  visualsAndArtifacts: {
    designArtifacts: [
      "Responsive wireframe systems (Figma)",
      "Component library with breakpoints",
      "Customization flow documentation"
    ],
    processDocumentation: [
      "User research synthesis",
      "Mobile usage pattern analysis",
      "Accessibility audit results"
    ]
  },

  // CTA
  ctaTitle: "Ready to transform healthcare data visualization with responsive design?"
};