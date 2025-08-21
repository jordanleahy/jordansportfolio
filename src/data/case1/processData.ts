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
      image: "/lovable-uploads/8babb6cd-acf6-42ee-83c8-f2bad75762bc.png",
      images: [
        {
          src: "/lovable-uploads/501c3cff-f1e5-4d47-8fa5-671c09117479.png",
          alt: "Medical chart data and sepsis indicators",
          caption: "Real patient chart data showing sepsis indicators and clinical measurements",
          title: "Patient Chart Analysis"
        },
        {
          src: "/lovable-uploads/1301a9f1-c906-4800-a572-38f921f717bf.png",
          alt: "Interview notes and insights",
          caption: "Key insights from CDI specialist interviews",
          title: "CDI Interview Insights"
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
      ],
      image: "/lovable-uploads/1301a9f1-c906-4800-a572-38f921f717bf.png",
      images: [
        {
          src: "/lovable-uploads/1301a9f1-c906-4800-a572-38f921f717bf.png",
          alt: "Dashboard wireframes",
          caption: "Initial dashboard concepts and wireframes",
          title: "Dashboard Concepts"
        },
        {
          src: "/lovable-uploads/e9e1093f-623d-4331-a500-749e8c9108c3.png",
          alt: "Workshop documentation",
          caption: "Sepsis workshop findings and ideation results",
          title: "Workshop Findings"
        }
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