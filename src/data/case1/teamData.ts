import { TeamMember } from "@/types/caseStudy";

export const teamData = {
  teamMembers: [
    {
      icon: "Users",
      title: "My Role",
      description: "Senior Product Designer",
      items: [
        "Owned information architecture, visual design, and usability testing.",
        "Defined the \"explainable AI\" layer for every recommendation."
      ]
    },
    {
      icon: "Users", 
      title: "Team & Stakeholders",
      description: "",
      items: [
        "Clinical SMEs (nurses, coders)",
        "Data science (model development and feature importance)",
        "Product (RCM strategy)",
        "Engineering (EHR integration)"
      ]
    },
    {
      icon: "Target",
      title: "Duration & Scope", 
      description: "6 months",
      items: [
        "2 hospital pilot programs",
        "Real time ML model integration",
        "Clinical validation studies"
      ]
    }
  ] as TeamMember[],
};