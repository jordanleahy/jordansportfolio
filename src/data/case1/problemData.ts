import { Challenge } from "@/types/caseStudy";

export const problemData = {
  problemTitle: "The Challenge",
  problemDescription: "The original MVP design presented raw Elastic search data dumps that forced clinicians to manually piece together fragmented vitals, labs, and notes causing cognitive overload and inconsistent Sepsis diagnostic decisions.",
  challenges: [
    {
      type: 'problem',
      title: 'Clinical Impact',
      items: [
        "One of the most commonly denied inpatient diagnoses",
        "Often lacks clear alignment with Sepsis-3 or SIRS criteria",
        "High financial and quality impact when denied or downcoded"
      ]
    },
    {
      type: 'need',
      title: 'Design Challenges',
      items: [
        "Fragmented documentation across vitals, labs, and notes",
        "Cognitive overload validating clinical criteria under time pressure",
        "Inconsistent provider terminology and unclear diagnostic intent"
      ]
    }
  ] as Challenge[],
};