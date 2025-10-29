import { CaseStudyData } from "@/types/caseStudy";

export const case5Data: CaseStudyData = {
  // Hero Section
  title: "Redesigning the Resolution Workflow to Reduce Denial Follow-Up Time by 30%",
  description: "Led the redesign of R1 RCM's Resolution product to improve efficiency for payer follow-up teams handling claim denials. The new interface unified call, portal, and appeal workflows into one screen, reducing context switching and cognitive load for appeal members.",
  heroImage: "/lovable-uploads/placeholder-r1-hero.png",
  heroImageAlt: "A screenshot of the redesigned R1 Resolution dashboard showing payer call tasks, portal updates, and appeal statuses in one view.",
  role: "Lead Product Designer",
  roleDetails: "Led end-to-end design, from discovery through prototype validation and engineering handoff.",
  timeline: "6 months",
  timelineDetails: "March 2024 – September 2024",
  tags: ["Healthcare RCM", "Workflow Design", "Efficiency"],
  
  // Final Product Section
  finalProduct: {
    title: "Final Product",
    prototypeUrl: "",
    description: "A no-scroll, task-based interface enabling resolution specialists to triage, call, and update claim statuses directly from a unified screen."
  },
  
  // Figma Presentation (optional)
  figmaPresentation: {
    enabled: true,
    password: "",
    presentationUrl: "https://www.figma.com/file/example-r1-resolution-presentation",
    title: "R1 Resolution Product Redesign Deck",
    description: "Internal stakeholder deck used to present design decisions, user feedback, and impact metrics."
  },
  
  // Problem Section
  problemTitle: "The Challenge",
  problemDescription: "R1's existing Resolution product required multiple tabs and manual copy-paste across systems when working payer denials. Appeal members lost time context-switching between call scripts, portal logins, and internal documentation. This slowed down follow-ups and increased average resolution time, impacting the company's ability to meet SLAs and client satisfaction targets.",
  challenges: [
    {
      type: "problem",
      title: "Workflow Inefficiencies",
      items: [
        "Appeal members manually tracked payer interactions across multiple systems.",
        "Key claim details were buried within nested screens.",
        "Lack of visibility into pending or escalated tasks."
      ]
    },
    {
      type: "need",
      title: "Design Requirements",
      items: [
        "Enable appeal members to complete all resolution tasks from one screen.",
        "Provide clear visibility into task status and payer response deadlines.",
        "Integrate contextual data (notes, payer details, documentation) inline."
      ]
    }
  ],
  
  // Team Section
  teamMembers: [
    {
      icon: "Users",
      title: "My Role",
      description: "Owned UX strategy, user research, and visual design across all resolution workflows.",
      items: [
        "Conducted user interviews with appeal writers and resolution appeal members.",
        "Mapped end-to-end workflows across payer call, portal, and appeal tasks.",
        "Created prototypes for triage and follow-up flows.",
        "Collaborated with product and engineering to define implementation scope."
      ]
    },
    {
      icon: "Users",
      title: "Team & Stakeholders",
      description: "",
      items: [
        "Product Manager – Payer Workflows",
        "Engineering Lead – Task Automation",
        "Clinical SMEs – Appeal Writing and Denial Codes"
      ]
    },
    {
      icon: "Target",
      title: "Duration & Scope",
      description: "Six-month redesign project focused on improving the core resolution workflow.",
      items: [
        "Phase 1: Discovery and task mapping",
        "Phase 2: Prototype testing and iteration",
        "Phase 3: Design handoff and QA validation"
      ]
    }
  ],
  
  // Process Section
  processTitle: "Design Process",
  processSteps: [
    {
      icon: "Eye",
      title: "1. Research & Discovery",
      description: "Mapped current-state workflows to identify pain points in daily resolution work.",
      items: [
        "Conducted 8 contextual interviews with appeal members.",
        "Performed heuristic analysis of the legacy tool.",
        "Synthesized recurring issues with navigation and visibility.",
        "Defined key moments of friction and delay."
      ],
      quote: {
        text: "I spend half my day clicking through three systems just to update one claim.",
        author: "Resolution Specialist, R1 RCM"
      },
      image: "/lovable-uploads/placeholder-r1-research.png",
      images: [
        {
          src: "/lovable-uploads/placeholder-r1-research-map.png",
          alt: "Workflow diagram showing fragmented payer resolution process",
          caption: "Initial workflow mapping from user interviews",
          title: "Workflow Analysis"
        }
      ]
    },
    {
      icon: "Lightbulb",
      title: "2. Ideation & Concepting",
      description: "Prototyped unified layouts for payer calls, portals, and appeals.",
      items: [
        "Created low-fidelity sketches exploring single-screen workflows.",
        "Ran design reviews with cross-functional teams.",
        "Defined atomic layout patterns for task grouping.",
        "Aligned prototype data states with backend readiness."
      ],
      quote: {
        text: "This design makes it easier for new appeal members to understand the full context without jumping screens.",
        author: "Product Manager, Payer Workflows"
      },
      image: "/lovable-uploads/placeholder-r1-ideation.png",
      images: [
        {
          src: "/lovable-uploads/placeholder-r1-layout-exploration.png",
          alt: "Side-by-side mockups of single-screen resolution concepts",
          caption: "Exploring single-view task management concepts",
          title: "Unified Resolution Layouts"
        }
      ]
    },
    {
      icon: "Target",
      title: "3. Prototyping & Validation",
      description: "Validated usability and comprehension with experienced appeal members.",
      items: [
        "Conducted remote usability sessions with 6 appeal members.",
        "Measured task completion time and satisfaction.",
        "Iterated on column density and data grouping.",
        "Refined hierarchy for call vs. portal task types."
      ],
      quote: {
        text: "This layout feels faster. I can see everything I need without scrolling.",
        author: "Senior Resolution Agent"
      },
      image: "/lovable-uploads/placeholder-r1-validation.png",
      images: [
        {
          src: "/lovable-uploads/placeholder-r1-usability-test.png",
          alt: "Resolution agent using the redesigned prototype in usability testing session",
          caption: "Usability testing session recording",
          title: "Prototype Validation"
        }
      ]
    },
    {
      icon: "CheckCircle",
      title: "4. Iteration & Handoff",
      description: "Polished visual hierarchy and supported engineering QA.",
      items: [
        "Finalized condensed atomic components for production.",
        "Created interaction specs and design tokens.",
        "Supported frontend QA testing.",
        "Reviewed performance and accessibility metrics post-launch."
      ],
      quote: {
        text: "The design system updates made integration seamless across all modules.",
        author: "Engineering Lead"
      },
      image: "/lovable-uploads/placeholder-r1-handoff.png",
      images: [
        {
          src: "/lovable-uploads/placeholder-r1-design-system.png",
          alt: "Updated atomic design components used across resolution UI",
          caption: "Design system updates for production readiness",
          title: "Component Handoff"
        }
      ]
    }
  ],
  
  // Solution Section
  solutionTitle: "Solution & Key Features",
  features: [
    {
      icon: "Brain",
      title: "Unified Task Workspace",
      description: "Consolidated call, portal, and appeal tasks into one responsive, no-scroll interface."
    },
    {
      icon: "Layers",
      title: "Task Grouping by Contact Method",
      description: "Grouped payer interactions logically by call, portal, or appeal type to reduce confusion."
    },
    {
      icon: "Search",
      title: "Inline Contextual Data",
      description: "Displayed claim details, payer info, and documents directly in task cards."
    },
    {
      icon: "Zap",
      title: "Quick Action Shortcuts",
      description: "Enabled one-click updates for task status, notes, and escalations."
    },
    {
      icon: "BarChart3",
      title: "Productivity Metrics",
      description: "Added real-time metrics to help leads monitor task throughput and resolution rates."
    }
  ],
  
  // Outcomes Section
  outcomesTitle: "Outcomes",
  userFeedback: {
    quote: "Appeal members completed 30% more tasks per hour and reduced average resolution time from 9 to 6 minutes per claim.",
    author: "Operations Director, R1 RCM"
  },
  
  // Reflection Section
  reflectionTitle: "Reflection & Learnings",
  reflections: [
    {
      type: "success",
      title: "What Went Well",
      items: [
        "Single-view workflow increased efficiency and reduced clicks.",
        "User testing validated design decisions early.",
        "Collaboration between product and engineering remained strong.",
        "Data-driven prioritization guided iteration."
      ]
    },
    {
      type: "challenge",
      title: "Challenges",
      items: [
        "Balancing data density with visual clarity.",
        "Coordinating across multiple backend services.",
        "Maintaining alignment on design token updates.",
        "Gathering post-launch feedback from distributed teams."
      ]
    },
    {
      type: "learning",
      title: "Next Steps",
      items: [
        "Introduce AI-based task recommendations.",
        "Integrate automatic payer portal data capture.",
        "Enhance audit logging for compliance review.",
        "Scale the same workflow model to other RCM products."
      ]
    }
  ],
  
  // Visuals & Artifacts
  visualsAndArtifacts: {
    designArtifacts: [
      "Workflow journey maps",
      "Annotated Figma prototypes",
      "Usability testing recordings"
    ],
    processDocumentation: [
      "Design system token updates",
      "QA visual specs",
      "Launch feedback summary"
    ]
  },
  
  // CTA
  ctaTitle: "How might your team handle payer resolution in one screen?"
};
