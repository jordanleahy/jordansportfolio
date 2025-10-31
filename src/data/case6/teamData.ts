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
        "1 Customer Service User",
        "2 Appeal Writer",
        "3 Software Engineers",
        "Product Manager"
      ],
      teamMembers: [
        {
          name: "Josh Geleris",
          photo: "/lovable-uploads/josh-headshot.png",
          linkedInUrl: "https://www.linkedin.com/in/josh-geleris/",
          initials: "JG"
        },
        {
          name: "Ruth Nacey",
          photo: "/lovable-uploads/ruth-headshot.png",
          linkedInUrl: "https://www.linkedin.com/in/ruth-nacey-2130749/",
          initials: "RN"
        },
        {
          name: "Scott Fleming",
          photo: "/lovable-uploads/scott-headshot.png",
          linkedInUrl: "https://www.linkedin.com/in/thescottfleming/",
          initials: "SF"
        },
        {
          name: "Parimal Patel",
          photo: "/lovable-uploads/parimal-headshot.png",
          linkedInUrl: "https://www.linkedin.com/in/parimal-patel/",
          initials: "PP"
        },
        {
          name: "Dijs van de Walle",
          photo: "/lovable-uploads/dijs-headshot.png",
          linkedInUrl: "https://www.linkedin.com/in/dijs/",
          initials: "DJ"
        }
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
