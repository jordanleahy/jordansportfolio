import { Challenge } from "@/types/caseStudy";

export const problemData = {
  problemTitle: "The Challenge",
  problemDescription: "Hospitals generate hundreds of data points per patient  vitals, labs, orders, notes, consults. Before billing, each record must be validated and coded correctly to create an accurate \"receipt\" for care.",
  challenges: [
    {
      type: 'problem',
      title: 'Clinical Impact',
      items: [
        "Incomplete or inconsistent documentation across the chart",
        "Slow review cycles that delay billing and increase denials"
      ]
    },
    {
      type: 'need',
      title: 'Design Challenges',
      items: [
        "Consolidates all relevant data into a single, trusted view",
        "Shows the why behind every AI suggestion",
        "Speeds up decision making without reducing accuracy",
        "Fits seamlessly into existing EHR workflows"
      ]
    }
  ] as Challenge[],
};