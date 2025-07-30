import { TeamMember } from "@/types/caseStudy";

export const teamData = {
  teamMembers: [
    {
      icon: "Users",
      title: "My Role",
      description: "Senior Product Designer",
      items: [
        "Clinical workflow research & analysis",
        "End to end product design", 
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
        "Director of Product",
        "MD Cofounder Head of Product"
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