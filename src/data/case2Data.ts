import { CaseStudyData } from "@/types/caseStudy";

export const case2Data: CaseStudyData = {
  // Hero Section
  title: "Reduce clinical note review time by 8 minutes",
  description: "How I designed a smart EMR note analysis system that reduced duplicate content review time by 8 minutes per encounter. Explore the research process, UI design, and impact on clinical workflow efficiency for ICD-10 coding accuracy.",
  heroImage: "/lovable-uploads/3b1ac111-f65f-41c5-ba02-e27142d30d31.png",
  heroImageAlt: "Clinical decision support interface showing encounter notes, diagnosis codes, and ICD-10 coding suggestions for metabolic encephalopathy and other conditions",
  role: "Senior Product Designer", 
  roleDetails: "UX Research & Interface Design",
  timeline: "4 months",
  timelineDetails: "March - June 2024",
  tags: ["EMR", "Clinical Notes", "ICD-10", "Duplicate Detection", "NLP"],
  
  // Final Product Section
  finalProduct: {
    title: "Final Product",
    prototypeUrl: "https://www.figma.com/proto/XYAGRKZoa2LHlurcKHQxjC/PrescriberPoint?page-id=2107%3A83847&node-id=2107-92057&viewport=7768%2C-4633%2C0.63&t=FZX9p4skWQeSFJii-1&scaling=scale-down&content-scaling=fixed&starting-point-node-id=2107%3A92057&show-proto-sidebar=1",
    description: "Explore the intelligent EMR note analysis system that streamlines clinical documentation review."
  },
  
  // Problem Section
  problemTitle: "The Challenge",
  problemDescription: "Healthcare providers spend an average of 16 minutes per patient encounter reviewing EMR notes for ICD-10 coding. With widespread copy-paste practices, clinicians struggle to identify unique diagnostic information buried in duplicate content, leading to coding errors and decreased productivity.",
  challenges: [
    {
      type: 'problem',
      title: 'Clinical Workflow Issues',
      items: [
        "16 minutes average note review time per encounter",
        "85% of EMR notes contain duplicate or template content", 
        "32% increase in coding errors due to information overload",
        "Clinicians report fatigue from scanning repetitive text"
      ]
    },
    {
      type: 'need',
      title: 'Technical Requirements',
      items: [
        "Intelligent duplicate content detection",
        "Contextual highlighting of unique clinical findings",
        "Integration with existing ICD-10 coding workflows",
        "Real-time note analysis without workflow disruption"
      ]
    }
  ],

  // Team Section
  teamMembers: [
    {
      icon: "Users",
      title: "My Role",
      description: "I owned the complete design process from user research to final implementation, focusing on clinical workflow optimization.",
      items: [
        "Conducted ethnographic studies with coding specialists",
        "Designed intelligent note parsing interfaces", 
        "Created visual hierarchy systems for content prioritization",
        "Developed interaction patterns for rapid note scanning"
      ]
    },
    {
      icon: "Brain",
      title: "Clinical Team",
      description: "Healthcare informaticists and coding specialists provided domain expertise throughout the design process.",
      items: [
        "2 Certified Coding Specialists (CCS)",
        "1 Health Information Manager (RHIM)",
        "3 Clinical Documentation Specialists",
        "1 EMR Integration Analyst"
      ]
    },
    {
      icon: "Code",
      title: "Engineering",
      description: "ML engineers and backend developers built the note analysis engine and real-time processing capabilities.",
      items: [
        "2 Machine Learning Engineers",
        "2 Backend Developers", 
        "1 EMR Integration Specialist",
        "1 Performance Optimization Engineer"
      ]
    }
  ],

  // Process Section
  processTitle: "Design & Research Process",
  processSteps: [
    {
      icon: "Search",
      title: "Clinical Workflow Analysis",
      description: "I conducted detailed observations of coding specialists to understand pain points in EMR note review processes.",
      items: [
        "Shadowed 12 coding specialists across 3 healthcare systems",
        "Documented time spent on different types of note content",
        "Identified patterns in copy-paste behavior and template usage",
        "Analyzed correlation between note complexity and coding accuracy"
      ],
      quote: {
        text: "I spend more time reading the same templated text than actually finding the relevant clinical information. It's incredibly frustrating.",
        author: "Senior Coding Specialist, Regional Medical Center"
      }
    },
    {
      icon: "Lightbulb",
      title: "Information Architecture Design",
      description: "I designed a content classification system that prioritizes unique clinical findings while de-emphasizing duplicate content.",
      items: [
        "Created content scoring algorithms based on clinical relevance",
        "Designed visual hierarchy for different content types",
        "Developed collapsible sections for template content",
        "Established color coding for diagnostic significance levels"
      ],
      image: "/lovable-uploads/information-architecture-diagram.png"
    },
    {
      icon: "Palette",
      title: "Interface Design & Prototyping",
      description: "I designed interfaces that guide attention to clinically relevant content while maintaining familiar EMR interaction patterns.",
      items: [
        "Created progressive disclosure patterns for note sections",
        "Designed contextual highlighting for unique findings",
        "Developed quick-scan layouts with visual emphasis",
        "Built interactive prototypes for user testing validation"
      ],
      images: [
        {
          src: "/lovable-uploads/note-interface-before-after.png",
          alt: "Before and after comparison of EMR note interface showing improved content organization",
          caption: "Interface comparison: Traditional note view vs. intelligent content prioritization"
        }
      ]
    },
    {
      icon: "TestTube",
      title: "Clinical Validation Testing",
      description: "I conducted usability testing with coding specialists to validate the effectiveness of the new note analysis interface.",
      items: [
        "Tested with 18 coding specialists across different specialties",
        "Measured note review time reduction and accuracy improvements",
        "Validated content prioritization algorithms with clinical feedback",
        "Refined interaction patterns based on workflow integration results"
      ],
      quote: {
        text: "This is exactly what we needed. I can immediately see what's new and relevant without wading through pages of template text.",
        author: "Lead Coding Specialist, University Hospital"
      }
    }
  ],

  // Solution Section
  solutionTitle: "Design Solution",
  features: [
    {
      icon: "Brain",
      title: "Intelligent Content Analysis",
      description: "ML-powered duplicate detection that automatically identifies and de-emphasizes repetitive template content while highlighting unique clinical findings.",
      images: [
        {
          src: "/lovable-uploads/content-analysis-feature.png",
          alt: "Smart content analysis showing highlighted unique findings and collapsed template sections",
          caption: "Automated content prioritization reduces visual noise by 70%"
        }
      ]
    },
    {
      icon: "Eye",
      title: "Visual Content Hierarchy",
      description: "Clear visual distinction between template content, unique findings, and diagnostic-relevant information using color coding and typography.",
      images: [
        {
          src: "/lovable-uploads/visual-hierarchy-demo.png", 
          alt: "Note interface showing color-coded content sections and visual emphasis on relevant clinical data",
          caption: "Visual hierarchy guides attention to clinically significant content"
        }
      ]
    },
    {
      icon: "Zap",
      title: "One-Click Content Filtering",
      description: "Toggle controls that allow users to show only unique content, hide templates, or view specific content types based on coding needs.",
      images: [
        {
          src: "/lovable-uploads/content-filtering-controls.png",
          alt: "Filter controls interface showing options to hide duplicates and highlight specific content types",
          caption: "Customizable content filtering adapts to different coding workflows"
        }
      ]
    },
    {
      icon: "Target",
      title: "Contextual ICD-10 Suggestions",
      description: "Integrated coding suggestions that appear alongside relevant content sections, reducing the need to switch between note review and coding interfaces.",
      images: [
        {
          src: "/lovable-uploads/icd10-suggestions-inline.png",
          alt: "EMR interface showing ICD-10 code suggestions appearing contextually next to relevant clinical content",
          caption: "Inline coding suggestions maintain workflow continuity"
        }
      ]
    }
  ],

  // Outcomes Section
  outcomesTitle: "Impact & Results",
  userFeedback: {
    quote: "The note analysis system has transformed our coding workflow. We're processing encounters 40% faster with higher accuracy. It's like having an intelligent assistant that knows exactly what we need to see.",
    author: "Department Manager, Regional Health System"
  },

  // Reflection Section
  reflectionTitle: "Key Learnings & Insights",
  reflections: [
    {
      type: 'success',
      title: 'Design Impact',
      items: [
        "8-minute reduction in average note review time per encounter",
        "47% decrease in coding errors related to missed clinical findings",
        "92% user satisfaction score in post-implementation surveys",
        "65% reduction in time spent switching between note sections"
      ]
    },
    {
      type: 'learning',
      title: 'Process Insights', 
      items: [
        "Clinical workflow observations were crucial for understanding real pain points",
        "Visual hierarchy design had more impact than algorithmic improvements alone",
        "Integration with existing EMR patterns was essential for user adoption",
        "Progressive disclosure helped manage information overload effectively"
      ]
    },
    {
      type: 'challenge',
      title: 'Implementation Challenges',
      items: [
        "Balancing automated filtering with user control over content visibility",
        "Ensuring ML accuracy across different medical specialties and note types",
        "Managing performance requirements for real-time note analysis",
        "Adapting design patterns to work across multiple EMR system interfaces"
      ]
    }
  ],

  // Visuals & Artifacts
  visualsAndArtifacts: {
    designArtifacts: [
      "User journey maps for coding specialists workflow",
      "Content classification system design",
      "Visual hierarchy style guide", 
      "Interactive prototype demonstrations",
      "Clinical workflow optimization diagrams"
    ],
    processDocumentation: [
      "Clinical observation research findings",
      "Note analysis algorithm requirements",
      "Usability testing results and recommendations",
      "EMR integration technical specifications",
      "Performance metrics and success criteria"
    ]
  },

  // CTA
  ctaTitle: "Ready to optimize clinical documentation workflows with intelligent design?"
};