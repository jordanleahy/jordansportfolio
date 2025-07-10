export const bcgxCaseData = {
  title: "Denial and Appeal Management",
  subtitle: "AI-powered prescription denial dashboard with evidence cards and appeal composer.",
  heroImage: "/lovable-uploads/97bfc2ee-31a6-418b-823b-c7835deb9a48.png",
  heroImageAlt: "Prescription Denials Dashboard – listing rejected claims, extracted clinical evidence, and appeal letter editor",
  summary: "Denial and Appeal Management automates identification and resolution of prescription claim denials by aggregating clinical evidence and generating editable appeal letters—accelerating reimbursement for small healthcare practices.",
  role: "Lead Product Designer",
  timeline: "April 2024 – July 2025",
  tags: ["#Denials", "#Appeals", "#Templates", "#Payers"],
  
  context: {
    challenge: "Small healthcare practices struggle with prescription claim denials, spending countless hours manually gathering clinical evidence and crafting appeal letters. This administrative burden delays patient care and impacts practice revenue, with denial rates reaching 15-20% for certain medications.",
    businessImpact: "Healthcare practices lose an average of $125,000 annually due to unresolved prescription denials and delayed reimbursements.",
    researchChallenge: "Healthcare staff spend 60% of their administrative time on denial resolution instead of patient care activities."
  },

  roleAndTeam: {
    myRole: {
      title: "My Role",
      details: [
        "Led UX design for the Prescription Denial Management feature",
        "Defined workflows for denial intake, evidence capture, and appeal generation", 
        "Produced hi-fi prototypes and facilitated usability tests",
        "Coordinated with AI engineers to specify data-extraction prompts"
      ]
    },
    team: {
      title: "Team & Stakeholders",
      details: [
        "Product Manager (1)",
        "Frontend Engineers (2)", 
        "Backend & AI Engineers (2)",
        "Clinical Documentation SME (1)",
        "QA Lead (1)"
      ]
    },
    duration: {
      title: "Duration & Scope", 
      details: [
        "6-month engagement",
        "5 major payer integrations",
        "3 specialty drug categories",
        "ML prediction model design",
        "Automated workflow creation"
      ]
    }
  },

  process: [
    {
      title: "Research & Discovery",
      icon: "Eye",
      activities: [
        "Shadowed denial intake sessions with billing and admin staff",
        "Conducted interviews with 6 office managers and 4 CDS specialists",
        "Key insight: \"Sorting through faxed letters and portal PDFs wastes hours each week.\""
      ]
    },
    {
      title: "Denial Pattern Analysis", 
      icon: "BarChart3",
      description: "Analyzed 2,000+ denial cases to identify common rejection reasons, evidence requirements, and successful appeal strategies."
    },
    {
      title: "Automated Evidence Platform",
      icon: "Zap",
      description: "Designed an intelligent system that automatically extracts relevant clinical evidence from patient records and generates customizable appeal templates."
    }
  ],

  solutionFeatures: [
    {
      title: "Unified Denial Intake",
      description: "Consolidates denials from email, portal, fax, and mail into one queue.",
      icon: "Shield"
    },
    {
      title: "Formulary & Policy Checker",
      description: "Real-time lookup of payer rules and prior-auth requirements.",
      icon: "CheckCircle"
    },
    {
      title: "Evidence Card Aggregator",
      description: "Auto-extracts clinical data points (labs, notes, forms) via AI into editable cards.",
      icon: "Clock"
    },
    {
      title: "AI-Assisted Appeal Composer",
      description: "Pre-populates appeal letters with clinical rationale; fully editable rich text.",
      icon: "TrendingUp"
    },
    {
      title: "Workflow & Follow-Up Tracker",
      description: "Tracks submission dates, sends reminders, and monitors response status.",
      icon: "Eye"
    }
  ],

  outcomes: [
    {
      metric: "85%",
      description: "Reduction in time spent on denial resolution",
      icon: "TrendingUp"
    },
    {
      metric: "92%", 
      description: "First-time appeal success rate",
      icon: "Activity"
    },
    {
      metric: "40%",
      description: "Increase in practice revenue recovery",
      icon: "Users"
    }
  ],

  reflection: {
    whatWentWell: [
      "Early SME involvement ensured accuracy across intake channels",
      "Modular \"evidence cards\" scaled to various document types", 
      "AI prompt tuning delivered >85% extraction precision"
    ],
    challengesAndSolutions: [
      "Handling edge case requirements across multiple payers required flexible template system",
      "Integration complexity solved through phased rollout approach",
      "Regulatory compliance ensured through continuous legal review",
      "Change management addressed via comprehensive training program"
    ],
    nextSteps: [
      "Extend support to specialty medication denials and pre-bill workflows",
      "Integrate with native mobile app for on-the-go triage",
      "Add payer-specific appeal templates and automated follow-up reminders"
    ]
  },

  artifacts: [
    {
      title: "User Journey Maps",
      description: "Comprehensive mapping of denial resolution workflows across different practice types"
    },
    {
      title: "Evidence Extraction Algorithms", 
      description: "Documentation of AI models for identifying relevant clinical evidence from patient records"
    },
    {
      title: "Appeal Template Library",
      description: "Curated collection of successful appeal letter templates for various denial reasons"
    },
    {
      title: "Regulatory Compliance Guide",
      description: "Documentation ensuring platform meets HIPAA and state healthcare regulations"
    }
  ]
};