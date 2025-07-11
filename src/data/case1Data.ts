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
  timelineDetails: "March - September 2023",
  tags: ["Sepsis Detection", "Clinical AI", "Patient Safety", "Healthcare Dashboard"],
  
  // Problem Section
  problemTitle: "The Challenge",
  problemDescription: "Sepsis kills 1 in 5 hospital patients globally, yet early detection remains challenging due to complex criteria and time-sensitive decision making. Healthcare teams needed a system that could predict sepsis risk while seamlessly integrating into existing clinical workflows.",
  challenges: [
    {
      type: 'problem',
      title: 'Clinical Impact',
      items: [
        "1 in 5 hospital deaths caused by sepsis",
        "6-hour window for optimal treatment",
        "Complex multi-criteria diagnosis process"
      ]
    },
    {
      type: 'need',
      title: 'Design Challenges',
      items: [
        "Real-time data visualization complexity",
        "Alert fatigue from false positives",
        "Integration with existing EMR systems"
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
        "3 Critical Care Physicians",
        "2 Data Scientists",
        "4 Frontend Engineers", 
        "1 Clinical Informaticist",
        "Product Manager"
      ]
    },
    {
      icon: "Target",
      title: "Duration & Scope", 
      description: "6-month engagement",
      items: [
        "3 hospital pilot programs",
        "Real-time ML model integration",
        "EMR system compatibility",
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
      description: "Deep dive into sepsis detection workflows and pain points",
      items: [
        "Shadowed ICU teams during sepsis cases",
        "Analyzed 500+ patient records for patterns", 
        "Interviewed 12 critical care specialists",
        "Mapped current diagnostic decision trees"
      ],
      quote: {
        text: "Every minute matters with sepsis. We need systems that think as fast as we do.",
        author: "Dr. Sarah Chen, ICU Director"
      }
    },
    {
      icon: "Lightbulb",
      title: "2. Dashboard Ideation & Wireframing",
      description: "Collaborative design sessions with clinical teams",
      items: [
        "Real-time data visualization concepts",
        "Alert hierarchy and notification design",
        "Integration with existing EMR workflows", 
        "Mobile and desktop responsive layouts"
      ]
    },
    {
      icon: "Target",
      title: "3. Prototype & Clinical Testing",
      description: "Iterative testing with medical professionals", 
      items: [
        "High-fidelity interactive prototypes",
        "Usability testing in simulated ICU environment",
        "A/B testing of alert mechanisms",
        "Clinical accuracy validation sessions"
      ]
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
      ]
    }
  ],

  // Solution Section
  solutionTitle: "Solution & Key Features",
  features: [
    {
      icon: "Brain",
      title: "AI-Powered Risk Assessment", 
      description: "Real-time sepsis probability scoring using machine learning algorithms trained on thousands of patient cases."
    },
    {
      icon: "Activity",
      title: "SIRS Criteria Monitoring",
      description: "Automated tracking of Systemic Inflammatory Response Syndrome indicators with visual trend analysis."
    },
    {
      icon: "TrendingUp",
      title: "Predictive Analytics Dashboard",
      description: "Interactive data visualization showing patient risk trajectory and key clinical markers over time."
    },
    {
      icon: "Clock", 
      title: "Smart Alert System",
      description: "Intelligent notifications that minimize alert fatigue while ensuring critical cases are never missed."
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
        "Balancing sensitivity vs. specificity in alert design",
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
        "Integrate with wearable device monitoring",
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