import { TeamMember } from "@/types/caseStudy";

export const teamData = {
  teamMembers: [
    {
      icon: "Users",
      title: "My Role",
      description: "Senior Product Designer",
      items: [
        "User research & workflow analysis",
        "Information architecture & wireframing",
        "Prototype development & testing"
      ]
    },
    {
      icon: "Users",
      title: "Team & Stakeholders",
      description: "",
      items: [
        "2 Validation Analyst",
        "2 Appeal Writer",
        "3 Software Engineers",
        "Product Manager"
      ]
    },
    {
      icon: "Target",
      title: "Duration & Scope",
      description: "4 month timeline",
      items: [
        "Denial and appeal management UI",
        "Top denial templates",
        "ML prediction template design",
        "Automated workflow creation"
      ]
    }
  ] as TeamMember[],
};
