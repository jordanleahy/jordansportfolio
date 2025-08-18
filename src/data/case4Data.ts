import { CaseStudyData } from "@/types/caseStudy";

export const case4Data: CaseStudyData = {
  // Hero Section
  title: "Drug Prior Authorization",
  description: "How I designed an ML & LLM powered prior authorization system that reduced response time from 3 days to 5 minutes, improving patient access to medications.",
  heroImage: "/lovable-uploads/4c976661-d94f-48e5-ab44-e69c629f2f91.png",
  heroImageAlt: "Drug Formulary Rules interface showing prior authorization workflow with extraction, parsing, scheduling, drafting, and e-submission steps",
  role: "Senior UX Designer", 
  roleDetails: "Workflow design & user research lead",
  timeline: "6 months",
  timelineDetails: "May 2022 - Nov 2022",
  tags: ["Prior Authorization", "Healthcare Workflow", "AI Automation", "Insurance Integration"],
  
  // Problem Section
  problemTitle: "The Challenge",
  problemDescription: "Drug prior authorization processes create significant delays in patient care, with healthcare providers spending countless hours navigating complex insurance requirements and formulary rules for prescription medications.",
  challenges: [
    {
      type: 'problem',
      title: 'Process Inefficiency',
      items: [
        "2 - 3 days average response time",
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
        "Mapped prescriber & non prescriber user journeys", 
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
      image: "https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/images//4%20Prior%20Auth%20Flow.png"
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
      image: "/lovable-uploads/9cd522b8-f130-45f8-8ddb-4e1e6d592f3a.png"
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
      image: "/lovable-uploads/9ab2951c-a9db-42c3-8615-dc9f27c9603f.png"
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
      title: "Medical Requirements",
      description: "Identification of all medical requirements for drug authorization."
    },
    {
      icon: "CheckCircle",
      title: "Step Therapy Requirements",
      description: "Drugs the patient must try and fail first before insurance will pay for the prescribed drug."
    },

    {
      icon: "Target",
      title: "Reauthorization Dates",
      description: "Reauthorization notification dates to prior authorization renewal."
    },
    {
      icon: "TrendingUp",
      title: "Download and Send to Payer", 
      description: "Download prior authorization documents to send via mail, fax, or portal."
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
