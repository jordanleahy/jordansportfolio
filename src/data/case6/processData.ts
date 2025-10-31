export const processData = {
  processTitle: "Design Process",
  processSteps: [
    {
      icon: "Search" as const,
      title: "Research & Data Analysis",
      description: "Combined qualitative interviews and quantitative analytics to identify user pain points and validate key workflows.",
      items: [
        "Analyzed 3.3 million hospital profile page views.",
        "Conducted customer interviews and journey mapping."
      ],
      quote: {
        text: "It's very complex and difficult to find what you need.",
        author: "Healthcare Customer Interview"
      },
      images: [
        {
          src: "/lovable-uploads/definitive-healthcare-screens.png",
          alt: "Definitive Healthcare platform showing hospital profile dashboard across multiple devices",
          caption: "Current platform state across desktop, tablet, and mobile."
        },
        {
          src: "/lovable-uploads/user-interview-notes.png",
          alt: "User interview notes from Danielle DeCosta, Nikita Macklin, and Vinny Romano highlighting key insights",
          caption: "User interview notes revealing navigation and information architecture challenges."
        },
        {
          src: "/lovable-uploads/page-analytics.png",
          alt: "Pendo analytics showing 3.3 million total page views across Hospital Profile tabs",
          caption: "Page view analytics showing Summary Tab dominated usage at 3.3M views."
        }
      ]
    },
    {
      icon: "Layers" as const,
      title: "Information Architecture & Wireframing",
      description: "Mapped and audited every screen to document structure and dependencies before consolidating layout and prioritizing high-value content.",
      items: [
        "Created complete sitemap for Hospital Profile.",
        "Used Figma to visualize relationships and navigation flow."
      ],
      quote: {
        text: "Manual UX audit revealed redundant data and underused tabs.",
        author: "UX Research Notes"
      },
      images: [
        {
          src: "/lovable-uploads/figma-sitemap-full.png",
          alt: "Comprehensive Figma sitemap showing all Hospital Profile screens, tabs, and navigation structure",
          caption: "Complete sitemap mapping all Hospital Profile tabs and information architecture."
        },
        {
          src: "/lovable-uploads/ia-wireframe-detail.png",
          alt: "Detailed Hospital Profile wireframe showing comprehensive data sections and navigation structure",
          caption: "Wireframe detail highlighting information architecture and data organization."
        }
      ]
    },
    {
      icon: "Zap" as const,
      title: "High-Fidelity Design & Iteration",
      description: "Developed scalable design system components and iterated rapidly with product stakeholders using auto-layout and variants.",
      items: [
        "Collaborated with PMs to refine which data points to keep or remove.",
        "Built scalable components for 500+ customizable metrics."
      ],
      quote: {
        text: "Iterate with product to identify what data to present.",
        author: "Design Notes"
      },
      images: [
        {
          src: "/lovable-uploads/hospital-profile-annotated.png",
          alt: "Annotated Hospital Profile design showing key sections including general information, payment metrics, and dashboard components",
          caption: "Final Hospital Profile design with annotations highlighting key improvements and prioritized data sections."
        }
      ]
    }
  ]
};
