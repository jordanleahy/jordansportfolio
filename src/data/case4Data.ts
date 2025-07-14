import { CaseStudyData } from "@/types/caseStudy";

export const case4Data: CaseStudyData = {
  // Hero Section
  title: "Prior Authorization Workflow System: UX Case Study - Healthcare AI Automation",
  description: "How I designed an ML & LLM powered prior authorization system that reduced approval time from 3 days to 5 minutes, improving patient access to medications. Discover the UX research methodology, workflow design process, and impact on healthcare efficiency through intelligent formulary rule automation and insurance integration.",
  heroImage: "/lovable-uploads/4c976661-d94f-48e5-ab44-e69c629f2f91.png",
  heroImageAlt: "Drug Formulary Rules interface showing prior authorization workflow with extraction, parsing, scheduling, drafting, and e-submission steps",
  role: "Senior UX Designer", 
  roleDetails: "Workflow design & user research lead",
  timeline: "6 months",
  timelineDetails: "May 2022 - Nov 2022",
  tags: ["Prior Authorization", "Healthcare Workflow", "AI Automation", "Insurance Integration"],
  
  // Problem Section
  problemTitle: "The Challenge",
  problemDescription: "Prior authorization processes create significant delays in patient care, with healthcare providers spending countless hours navigating complex insurance requirements and formulary rules for prescription medications.",
  challenges: [
    {
      type: 'problem',
      title: 'Process Inefficiency',
      items: [
        "2 - 3 days average approval time",
        "60% of prior authorizations require multiple submissions",
        "78% of providers report PA as major workflow burden"
      ]
    },
    {
      type: 'need',
      title: 'Design Challenges',
      items: [
        "Complex multi step approval workflows",
        "Integration with multiple payer, PBM, pharmacy systems",
        "Real time formulary rule interpretation"
      ]
    }
  ],

  // Team Section
  teamMembers: [
    {
      icon: "Users",
      title: "My Role",
      description: "Senior UX Designer",
      items: [
        "Prior authorization workflow research",
        "Multi-stakeholder user journey mapping", 
        "AI assisted interface design",
        "Insurance integration UX strategy"
      ]
    },
    {
      icon: "Users", 
      title: "Team & Stakeholders",
      description: "",
      items: [
        "2 Healthcare Workflow Specialists",
        "4 Backend Engineers",
        "1 ML Engineer", 
        "Product Manager"
      ]
    },
    {
      icon: "Target",
      title: "Duration & Scope", 
      description: "6 month timeline",
      items: [
        "8 major formulary integrations",
        "AI rule extraction system",
        "Automated letter generation workflow",
        "Approval tracking dashboard"
      ]
    }
  ],

  // Process Section
  processTitle: "Design Process",
  processSteps: [
    {
      icon: "Eye",
      title: "1. Workflow Analysis & Research",
      description: "Deep dive into prior authorization processes and stakeholder pain points",
      items: [
        "Shadowed NPs and MA workflows",
        "Analyzed 10 fomulary rule sets", 
        "Interviewed insurance reviewers and providers",
        "Mapped current manual approval processes"
      ],
      quote: {
        text: "Prior authorizations are where good medicine goes to die. We need systems that work as hard as we do for our patients.",
        author: "Dr. Lisa Park, NP"
      },
      image: "/lovable-uploads/50dcd2f1-ee08-4212-8913-c8fbe7df89af.png"
    },
    {
      icon: "Lightbulb",
      title: "2. AI Assisted Workflow Design",
      description: "Designing intelligent automation while maintaining human oversight",
      items: [
        "AI decision point identification and design",
        "Human in the loop validation workflows",
        "Exception handling and escalation paths"
      ],
      image: "/lovable-uploads/6178eef1-7329-431e-a756-8d62bd36e0e5.png"
    },
    {
      icon: "Target",
      title: "3. Prototyping & Validation",
      description: "Iterative testing with healthcare providers and insurance reviewers", 
      items: [
        "Interactive workflow prototypes with real data",
        "Usability testing with prescribers and non-prescribers staff",
        "MA reviewer feedback sessions",
        "Formulary accuracy validation testing"
      ],
      image: "/lovable-uploads/762c3624-2485-4556-b7c7-63709fc409aa.png"
    },
    {
      icon: "CheckCircle", 
      title: "4. Implementation & Optimization",
      description: "Production deployment and continuous improvement based on real usage",
      items: [
        "Phased rollout across small florida dermatology practices",
        "Performance monitoring and optimization",
        "User feedback integration and iteration"
      ],
      image: "/lovable-uploads/7c66c0d1-d5cb-4bd5-b500-d00e94c531ef.png"
    }
  ],

  // Solution Section
  solutionTitle: "Solution & Key Features",
  features: [
    {
      icon: "Shield",
      title: "Formulary Identification", 
      description: "AI powered analysis of insurance formulary documents to automatically identify prior authorization requirements."
    },
    {
      icon: "Clock",
      title: "Automated Letter Generation",
      description: "Intelligent drafting of prior authorization requests using patient data and medical justification templates."
    },
    {
      icon: "CheckCircle",
      title: "Step Therapy Requirements",
      description: "Monitoring of approval status with proactive notifications and next-step recommendations."
    },

    {
      icon: "Target",
      title: "Clinical Decision Support",
      description: "Evidence based alternative medication suggestions when prior authorization is denied or delayed."
    },
    {
      icon: "TrendingUp",
      title: "Analytics & Reporting", 
      description: "Comprehensive insights into approval rates, processing times, and optimization opportunities."
    }
  ],

  // Outcomes Section
  outcomesTitle: "Outcomes",
  userFeedback: {
    quote: "We went from 3 days to 5 minutes for specialty medication prior authorizations. Our patients get their medications faster, and our staff can focus on patient care instead of paperwork.",
    author: "Maria Gonzalez, Medical Practice Manager"
  },

  // Reflection Section  
  reflectionTitle: "Reflection & Learnings",
  reflections: [
    {
      type: 'success',
      title: 'What Went Well',
      items: [
        "Multi-stakeholder research provided comprehensive requirements",
        "AI integration enhanced rather than replaced human expertise", 
        "Iterative testing caught edge cases early in development",
        "Insurance provider partnerships facilitated smooth integration"
      ]
    },
    {
      type: 'challenge',
      title: 'Challenges', 
      items: [
        "Insurance API inconsistencies required creative workarounds",
        "Regulatory compliance validation was more complex than anticipated",
        "Balancing automation speed with accuracy requirements",
        "Managing varying state-specific prior authorization rules"
      ]
    },
    {
      type: 'learning',
      title: 'Next Steps',
      items: [
        "Expand to specialty medication prior authorizations",
        "Integrate with electronic health record systems",
        "Develop predictive approval probability modeling", 
        "Add patient communication and education features"
      ]
    }
  ],

  // Visuals & Artifacts
  visualsAndArtifacts: {
    designArtifacts: [
      "End-to-end workflow diagrams and prototypes",
      "AI decision point documentation and flowcharts",
      "Insurance integration interface specifications"
    ],
    processDocumentation: [
      "Prior authorization workflow research findings",
      "Multi-stakeholder user journey maps",
      "Regulatory compliance validation reports"
    ]
  },

  // CTA
  ctaTitle: "Ready to streamline healthcare workflows with intelligent automation?"
};
