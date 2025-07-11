import { Feature } from "@/types/caseStudy";

export const solutionData = {
  solutionTitle: "Solution & Key Features",
  features: [
    {
      icon: "Brain",
      title: "Sepsis Only Data Validation Dashboard", 
      description: "Each ICD-10 primary diagnosis recommendation must have its own ui, not a generic view"
    },
    {
      icon: "Activity",
      title: "SIRS Criteria Monitoring",
      description: "Instant data analysis if SIRS was present in first 48 hours"
    },
    {
      icon: "TrendingUp",
      title: "Data dense visualization",
      description: "Interactive data visualization showing key clinical diagnostic markers over time"
    },
    {
      icon: "Shield",
      title: "Clinical Decision Support",
      description: "Evidence-based treatment recommendations integrated directly into the physician workflow."
    },
    {
      icon: "Users",
      title: "Team Collaboration Tools", 
      description: "Real-time patient status sharing and handoff communication between care team members."
    }
  ] as Feature[],
};