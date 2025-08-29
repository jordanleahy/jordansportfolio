import { ProcessStep } from "@/types/caseStudy";

export const processData = {
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
      image: "/lovable-uploads/f0eb35b0-326e-472c-badf-7dfa5af63d41.png",
      images: [
        {
          src: "/lovable-uploads/501c3cff-f1e5-4d47-8fa5-671c09117479.png",
          alt: "Medical chart data and sepsis indicators",
          caption: "Real patient chart data showing sepsis indicators and clinical measurements",
          title: "User Interviews"
        },
        {
          src: "/lovable-uploads/91deabc2-53c5-49b2-b4a0-c44a0d9b11fb.png",
          alt: "Interview notes and insights",
          caption: "Key insights from CDI specialist interviews",
          title: "Sailboat Workshop"
        },
        {
          src: "/lovable-uploads/d4638b48-af10-4652-8131-380efea63079.png",
          alt: "Sepsis diagnosis denial statistics",
          caption: "Industry data showing sepsis as top denied diagnosis affecting CDI workflows",
          title: "Industry Problem"
        },
        {
          src: "/lovable-uploads/4ec5e14a-89d2-4442-8d3b-4c6af58ade2b.png",
          alt: "Sepsis triggers configuration interface",
          caption: "Configuration interface showing sepsis trigger rules and logic parameters",
          title: "Triggers & Logic"
        },
        {
          src: "/lovable-uploads/8c08e2a1-d493-459e-b384-868e5ccdfd67.png",
          alt: "Current SmarterDx sepsis review interface",
          caption: "The existing SmarterDx interface showing sepsis diagnosis review workflow with clinical indicators",
          title: "Legacy UX"
        }
      ]
    },
    {
      icon: "Lightbulb",
      title: "2. Dashboard Ideation & Wireframing",
      description: "Collaborative design sessions with clinical teams",
      items: [
        "Real-time data visualization concepts",
        "Alert hierarchy and notification design",
        "Hosted sepsis workshop"
      ]
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
  ] as ProcessStep[],
};
