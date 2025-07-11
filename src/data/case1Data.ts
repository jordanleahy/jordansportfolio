import { CaseStudyData } from "@/types/caseStudy";

export const case1Data: CaseStudyData = {
  // Hero Section
  title: "Sepsis Prediction System",
  description: "AI-powered early detection dashboard that improved patient outcomes through real-time SIRS monitoring and clinical decision support.",
  heroImage: "/lovable-uploads/4be80a48-e90b-4b76-af9c-259fe703976d.png",
  heroImageAlt: "Sepsis diagnosis interface showing patient data, SIRS criteria, infection markers, and clinical decision support",
  role: "Senior Product Designer", 
  roleDetails: "End-to-end UX/UI ownership",
  timeline: "6 months",
  timelineDetails: "March - May 2024",
  tags: ["Sepsis Detection", "Clinical AI", "Patient Safety", "Healthcare Dashboard"],
  
  // Problem Section
  problemTitle: "The Challenge",
  problemDescription: "Sepsis remains one of the most frequently denied diagnoses in inpatient coding reviews. Despite its clinical complexity, documentation often fails to meet payer expectations or align with coding guidelines. CDI teams struggle to validate sepsis due to inconsistent clinical indicators, lack of provider clarity, and fragmented evidence across the chart. A system is needed to support real-time review of sepsis triggers, align with clinical and coding criteria, and integrate smoothly into existing workflows.",
  challenges: [
    {
      type: 'problem',
      title: 'Clinical Impact',
      items: [
        "One of the most commonly denied inpatient diagnoses",
        "Often lacks clear alignment with Sepsis-3 or SIRS criteria",
        "High financial and quality impact when denied or downcoded"
      ]
    },
    {
      type: 'need',
      title: 'Design Challenges',
      items: [
        "Fragmented documentation across vitals, labs, and notes",
        "Cognitive overload validating clinical criteria under time pressure",
        "Inconsistent provider terminology and unclear diagnostic intent"
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
        "Clinical workflow research & analysis",
        "Predictive dashboard design", 
        "User testing with medical staff",
        "Design system implementation"
      ]
    },
    {
      icon: "Users", 
      title: "Team & Stakeholders",
      description: "",
      items: [
        "2 CDI Specialist",
        "2 Data Scientists",
        "4 Engineers", 
        "1 Clinical Informaticist",
        "Product Manager"
      ]
    },
    {
      icon: "Target",
      title: "Duration & Scope", 
      description: "3-month scope",
      items: [
        "2 hospital pilot programs",
        "Real-time ML model integration",
        "Clinical validation studies"
      ]
    }
  ],

  // Process Section
  processTitle: "Design Process",
  processSteps: [
    {
      icon: "Eye",
      title: "1. Clinical Research & Discovery",
      description: "Deep dive into CDI workflows for sepsis validation and documentation challenges",
      items: [
        "Shadowed internal CDI members during real-time reviews",
        "Audited multiple sepsis patient charts", 
        "Interviewed Clinical Documentation Specialists and Physician Advisors",
        "Mapped common criteria used in real-world sepsis queries and validations"
      ],
      quote: {
        text: "Every minute matters for CDI teams during inpatient stays. We need tools that help us validate diagnoses with confidence and speed.",
        author: "Internal CDS, Inpatient Documentation Team"
      },
      image: "/lovable-uploads/8babb6cd-acf6-42ee-83c8-f2bad75762bc.png"
    },
    {
      icon: "Lightbulb",
      title: "2. Dashboard Ideation & Wireframing",
      description: "Collaborative design sessions with clinical teams",
      items: [
        "Real-time data visualization concepts",
        "Alert hierarchy and notification design",
        "Hosted sepsis workshop"
      ],
      image: "/lovable-uploads/1301a9f1-c906-4800-a572-38f921f717bf.png"
    },
    {
      icon: "Target",
      title: "3. Prototype & Clinical Testing",
      description: "Iterative testing with CDI staff", 
      items: [
        "High-fidelity interactive prototypes",
        "A/B testing of alert mechanisms",
        "Clinical accuracy validation sessions"
      ],
      image: "/lovable-uploads/e9e1093f-623d-4331-a500-749e8c9108c3.png"
    },
    {
      icon: "CheckCircle", 
      title: "4. Implementation & Validation",
      description: "Deployment and real-world performance monitoring",
      items: [
        "Pixel-perfect development handoff",
        "Clinical workflow integration testing",
        "Performance monitoring and optimization",
        "Post-deployment user feedback integration"
      ],
      image: "/lovable-uploads/865c082a-34b7-47d5-b45a-2385c872ed49.png"
    }
  ],

  // Solution Section
  solutionTitle: "Solution & Key Features",
  features: [
    {
      icon: "Brain",
      title: "Sepsis Only Data Validation Dashboard", 
      description: "Each ICD-10 primary diagnosis recommendation must have its own ui, not a generic view"
    },
    {
      icon: "Activity",
      title: "SIRS Criteria Monitoring",
      description: "Instant data analysis if SIRS was present in first 48 hours"
    },
    {
      icon: "TrendingUp",
      title: "Data dense visualization",
      description: "Interactive data visualization showing key clinical diagnostic markers over time"
    },
    {
      icon: "Shield",
      title: "Clinical Decision Support",
      description: "Evidence-based treatment recommendations integrated directly into the physician workflow."
    },
    {
      icon: "Users",
      title: "Team Collaboration Tools", 
      description: "Real-time patient status sharing and handoff communication between care team members."
    }
  ],

  // Outcomes Section
  outcomesTitle: "Outcomes",
  userFeedback: {
    quote: "This system helped us identify sepsis 2 hours earlier on average. That's life-changing for our patients.",
    author: "Dr. Michael Rodriguez, Emergency Medicine"
  },

  // Reflection Section  
  reflectionTitle: "Reflection & Learnings",
  reflections: [
    {
      type: 'success',
      title: 'What Went Well',
      items: [
        "Early clinical stakeholder involvement led to accurate requirements",
        "Iterative design process prevented major usability issues", 
        "Real-world testing validated design decisions",
        "Cross-functional collaboration improved solution quality"
      ]
    },
    {
      type: 'challenge',
      title: 'Challenges', 
      items: [
        "EMR integration complexity required creative solutions",
        "Managing clinical validation timelines and requirements",
        "Addressing varying workflows across different hospital units"
      ]
    },
    {
      type: 'learning',
      title: 'Next Steps',
      items: [
        "Expand to additional infection prediction models",
        "Develop pediatric sepsis detection capabilities", 
        "Add predictive antibiotic resistance modeling"
      ]
    }
  ],

  // Visuals & Artifacts
  visualsAndArtifacts: {
    designArtifacts: [
      "Interactive Figma prototypes with clinical workflows",
      "Design system components library",
      "Clinical user journey maps and workflows"
    ],
    processDocumentation: [
      "Hospital stakeholder interview reports",
      "Usability testing session recordings",
      "Clinical validation study results"
    ]
  },

  // CTA
  ctaTitle: "Ready to improve patient outcomes with intelligent healthcare design?"
};