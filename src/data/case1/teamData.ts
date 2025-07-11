import { TeamMember } from "@/types/caseStudy";

export const teamData = {
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
        "2 CDI Specialist",
        "2 Data Scientists",
        "4 Engineers", 
        "1 Clinical Informaticist",
        "Product Manager"
      ]
    },
    {
      icon: "Target",
      title: "Duration & Scope", 
      description: "3-month scope",
      items: [
        "2 hospital pilot programs",
        "Real-time ML model integration",
        "Clinical validation studies"
      ]
    }
  ] as TeamMember[],
};