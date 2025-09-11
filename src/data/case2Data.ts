import { CaseStudyData } from "@/types/caseStudy";

export const case2Data: CaseStudyData = {
  // Hero Section
  title: "I reduced clinical note review time by 8 minutes",
  description: "Inpatient EMR notes are essential for assigning the correct ICD-10 codes but they are often \"duplicates\" or \"copy and pasted\" making it hard for systems and humans to assign the right codes.",
  heroImage: "/lovable-uploads/3b1ac111-f65f-41c5-ba02-e27142d30d31.png",
  heroImageAlt: "Clinical decision support interface showing encounter notes, diagnosis codes, and ICD-10 coding suggestions for metabolic encephalopathy and other conditions",
  role: "Senior Product Designer", 
  roleDetails: "End-to-end UX/UI ownership",
  timeline: "3 months",
  timelineDetails: "June - August 2024",
  tags: ["EMR", "Notes", "ICD-10", "Duplicates", "MetabolicEncephalopathy", "UnstructuredNotes"],
  
  // Final Product Section
  finalProduct: {
    title: "Final Product",
    prototypeUrl: "https://www.figma.com/proto/XYAGRKZoa2LHlurcKHQxjC/PrescriberPoint?page-id=2107%3A83847&node-id=2107-92057&viewport=7768%2C-4633%2C0.63&t=FZX9p4skWQeSFJii-1&scaling=scale-down&content-scaling=fixed&starting-point-node-id=2107%3A92057&show-proto-sidebar=1",
    description: "Experience the intelligent clinical note analysis system that transforms unstructured notes into actionable coding insights."
  },
  
  // Problem Section
  problemTitle: "The Challenge",
  problemDescription: "RCM systems struggle with duplicate and copy-pasted clinical notes that create coding challenges. Complex codes like Metabolic Encephalopathy require human-in-the-loop validation to confirm when altered mental status truly occurred by carefully reading through voluminous encounter notes.",
  challenges: [
    {
      type: 'problem',
      title: 'Clinical Documentation Issues',
      items: [
        "To many duplicate notes creating long scroll times", 
        "Complex ICD-10 codes like Metabolic Encephalopathy require human validation to identify precise timing of altered mental status",
        "Volume of encounter notes makes finding critical clinical events needle-in-haystack problem"
      ]
    },
    {
      type: 'need',
      title: 'System Requirements',
      items: [
        "Detect duplicate notes and consolidate",
        
        "Detect \"copy and pasted\" notes that with same intent",
        "Intelligent filtering to surface clinically unique content from voluminous notes"
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
        "NLP-assisted UI design for note processing", 
        "ICD-10 coding interface optimization",
        "Duplicate detection system UX design"
      ]
    },
    {
      icon: "Users", 
      title: "Team & Stakeholders",
      description: "",
      items: [
        "2 Clinical Documentation Specialists",
        "3 Software Engineers",
        "1 NLP/ML Engineer",
        "1 Medical Coding Expert",
        "Product Manager"
      ]
    },
    {
      icon: "Target",
      title: "Duration & Scope", 
      description: "3 month timeline",
      items: [
        "Clinical note analysis interface",
        "Duplicate detection algorithms UI",
        "ICD-10 suggestion system",
        "Workflow optimization for coding specialists"
      ]
    }
  ],

  // Process Section
  processTitle: "Design Process",
  processSteps: [
    {
      icon: "Eye",
      title: "1. Clinical Workflow Research",
      description: "Deep dive into medical coding workflows and note analysis pain points",
      items: [
        "Shadowed medical coders and CDI specialists",
        "Analyzed 100+ clinical notes for duplicate patterns", 
        "Mapped current note review and coding workflows",
        "Identified key clinical indicators for ICD-10 assignment"
      ],
      quote: {
        text: "Half my time is spent figuring out what's new versus what's copy-pasted from yesterday's note. We need better tools to focus on what actually matters for coding.",
        author: "Sarah Kim, Medical Coding Specialist"
      },
      image: "/lovable-uploads/3b1ac111-f65f-41c5-ba02-e27142d30d31.png"
    },
    {
      icon: "Lightbulb",
      title: "2. AI-Assisted Interface Design",
      description: "Designing intelligent note analysis with human oversight",
      items: [
        "NLP-powered duplicate detection interface design",
        "Clinical context highlighting and annotation tools",
        "ICD-10 suggestion workflow integration", 
        "Real-time note comparison visualization"
      ],
      image: "/lovable-uploads/3b1ac111-f65f-41c5-ba02-e27142d30d31.png"
    },
    {
      icon: "Target",
      title: "3. Prototyping & Clinical Validation",
      description: "Iterative testing with medical coding specialists and CDI teams",
      items: [
        "Interactive prototypes with real clinical note data",
        "Usability testing with medical coders",
        "CDI specialist feedback sessions on coding accuracy",
        "Workflow efficiency validation with timing studies"
      ],
      image: "/lovable-uploads/3b1ac111-f65f-41c5-ba02-e27142d30d31.png"
    },
    {
      icon: "CheckCircle", 
      title: "4. Implementation & Optimization",
      description: "Production deployment with continuous workflow improvement",
      items: [
        "Phased rollout across coding departments",
        "Real-time performance monitoring and user feedback",
        "Coding accuracy metrics and time-saving validation",
        "Ongoing UX optimization based on usage patterns"
      ],
      image: "/lovable-uploads/3b1ac111-f65f-41c5-ba02-e27142d30d31.png"
    }
  ],

  // Solution Section
  solutionTitle: "Solution & Key Features",
  features: [
    {
      icon: "Brain",
      title: "Duplicate Content Detection", 
      description: "AI-powered analysis automatically identifies and highlights duplicated text across multiple clinical notes, allowing coders to focus on unique clinical content."
    },
    {
      icon: "FileText",
      title: "Clinical Context Extraction",
      description: "Advanced NLP extracts clinically relevant information from unstructured notes, highlighting key symptoms, treatments, and diagnostic indicators."
    },
    {
      icon: "Target",
      title: "ICD-10 Coding Suggestions",
      description: "Real-time coding suggestions based on unique clinical content, with confidence scoring and supporting evidence from the notes."
    },
    {
      icon: "Clock", 
      title: "Streamlined Review Workflow",
      description: "Optimized interface reduces note review time by presenting only clinically unique content with clear visual indicators."
    },
    {
      icon: "TrendingUp",
      title: "Coding Accuracy Tracking",
      description: "Built-in analytics track coding accuracy improvements and time savings across the coding team."
    },
    {
      icon: "Shield",
      title: "Clinical Validation",
      description: "Human-in-the-loop validation ensures all AI suggestions are clinically appropriate and comply with coding guidelines."
    }
  ],

  // Outcomes Section
  outcomesTitle: "Outcomes",
  userFeedback: {
    quote: "This system cut our note review time from 15 minutes to 7 minutes per encounter. We can finally focus on the clinical content that actually matters for accurate coding.",
    author: "Michael Chen, Lead Medical Coder"
  },

  // Reflection Section  
  reflectionTitle: "Reflection & Learnings",
  reflections: [
    {
      type: 'success',
      title: 'What Went Well',
      items: [
        "Deep clinical workflow research led to targeted solutions",
        "AI integration enhanced rather than replaced human expertise", 
        "Strong collaboration with medical coding experts improved accuracy",
        "Iterative testing with real clinical data validated effectiveness"
      ]
    },
    {
      type: 'challenge',
      title: 'Challenges', 
      items: [
        "Complex clinical language required sophisticated NLP models",
        "Balancing automation with clinical decision-making oversight",
        "Ensuring HIPAA compliance while improving workflow efficiency",
        "Managing false positives in duplicate detection algorithms"
      ]
    },
    {
      type: 'learning',
      title: 'Next Steps',
      items: [
        "Expand to specialty-specific note analysis (cardiology, oncology)",
        "Integrate with existing EMR systems for seamless workflow",
        "Add predictive coding for common diagnosis patterns",
        "Develop specialty-specific duplicate detection rules"
      ]
    }
  ],

  // Visuals & Artifacts
  visualsAndArtifacts: {
    designArtifacts: [
      "Clinical note analysis wireframes and prototypes",
      "Duplicate detection algorithm flowcharts",
      "ICD-10 coding interface specifications"
    ],
    processDocumentation: [
      "Medical coding workflow research findings",
      "Clinical validation methodology and results",
      "NLP model integration documentation"
    ]
  },

  // CTA
  ctaTitle: "Ready to transform clinical documentation workflows with intelligent automation?"
};