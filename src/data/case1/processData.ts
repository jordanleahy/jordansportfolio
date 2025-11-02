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
      images: [
        {
          src: "/src/assets/sepsis-definition.png",
          alt: "Sepsis and SIRS criteria definition showing diagnostic parameters",
          caption: "Medical definition of Sepsis and SIRS (Systemic Inflammatory Response Syndrome) with diagnostic criteria",
          title: "What is Sepsis"
        },
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
      ],
      image: "/lovable-uploads/758c2b99-8f51-4485-9be8-3e516cf888b1.png",
      images: [
        {
          src: "/lovable-uploads/0c9250c3-95a5-4d46-84cb-59d7e8c90c2a.png",
          alt: "User research and ideation board with sticky notes",
          caption: "User research synthesis and ideation process using sticky notes to identify pain points and opportunities",
          title: "Research & Ideation"
        },
        {
          src: "/lovable-uploads/a1ab13c5-1a23-4cb2-a0dd-6c25e1a44ea0.png",
          alt: "Sepsis dashboard interface with patient data and charts",
          caption: "Dashboard design showing sepsis detection interface with patient vitals, diagnosis codes, and clinical indicators",
          title: "Sepsis Dashboard Design"
        },
        {
          src: "/lovable-uploads/9dc96ab2-47c4-4265-8e74-253566aa0261.png",
          alt: "Healthcare interface with multiple workflow panels",
          caption: "Multi-panel healthcare interface design showing workflow integration and data visualization",
          title: "Multi-Panel Interface"
        },
        {
          src: "/lovable-uploads/c62b1fa0-8c37-4f44-974d-0b52e932fb45.png",
          alt: "Dashboard wireframe layout with defined sections",
          caption: "Low-fidelity wireframe showing dashboard layout with header, patient info, diagnosis finding, and action buttons",
          title: "Dashboard Wireframes"
        },
        {
          src: "/lovable-uploads/54c111e9-6781-4e0b-84a5-b53f035593ce.png",
          alt: "Patient encounter interface with diagnostic information",
          caption: "Patient encounter dashboard design with metabolic encephalopathy case and diagnostic workflow",
          title: "Encounter Dashboard"
        },
        {
          src: "/lovable-uploads/c8b0452e-d6f9-4a9e-a47d-ad5b77f9f7fa.png",
          alt: "Sepsis criteria dashboard with vital signs and treatment data",
          caption: "Detailed sepsis criteria dashboard showing SIRS criteria, vital signs charts, and treatment protocols",
          title: "Clinical Criteria Interface"
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
      image: "/lovable-uploads/88432ef6-b400-42a0-8cf0-492602c62862.png",
      images: [
        {
          src: "/lovable-uploads/18e65336-e421-4a4a-85c2-3405d7aa0871.png",
          alt: "Scenario 3 testing results showing EMR data impact assessment",
          caption: "Clinical testing scenario showing user feedback on EMR data impact, with 43% reporting moderate impact and EMR interface testing results",
          title: "EMR Data Impact Testing"
        }
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
        "HEX Data Monitoring"
      ],
      image: "/lovable-uploads/26c1c64e-1bdb-441a-87ff-338d3961cad3.png",
      images: [
        {
          src: "/lovable-uploads/26c1c64e-1bdb-441a-87ff-338d3961cad3.png",
          alt: "Sepsis client agreement rates dashboard",
          caption: "Improved sepsis client agreement rates showing significant performance improvements at UHS",
          title: "Success Metrics Dashboard"
        }
      ]
    }
  ] as ProcessStep[],
};
