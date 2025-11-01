import { Challenge } from "@/types/caseStudy";

export const problemData = {
  problemTitle: "The Challenge",
  problemDescription: "The original MVP design presented raw Elastic search data dumps that forced clinicians to manually piece together fragmented vitals, labs, and notes causing cognitive overload and inconsistent Sepsis diagnostic decisions.",
  challenges: [
    {
      type: 'problem',
      title: 'Clinical Impact',
      items: [
        "CDI teams spent hours manually validating each Sepsis case across disconnected systems",
        "Sepsis claims denied at 2-3x the rate of other diagnoses due to insufficient documentation",
        "$20-40K lost per denial when reviewers couldn't find criteria buried in fragmented data"
      ]
    },
    {
      type: 'need',
      title: 'Design Challenges',
      items: [
        "Reviewers toggled between 6+ data sources to manually confirm SIRS criteria",
        "Critical timestamps and vital trends were scattered—making validation error-prone",
        "Inconsistent clinical documentation led to missed criteria and preventable denials"
      ]
    }
  ] as Challenge[],
};