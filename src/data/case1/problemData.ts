import { Challenge } from "@/types/caseStudy";

export const problemData = {
  problemTitle: "The Challenge",
  problemDescription: "This was a project at SmarterDx where I was designing for internal Clinical Document Specialists to review Sepsis opportunities. The business goal was to improve Sepsis client agree rates from 23% to avg 50% +/- and reduce internal case review time.",
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