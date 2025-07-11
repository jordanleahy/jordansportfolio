import { Challenge } from "@/types/caseStudy";

export const problemData = {
  problemTitle: "The Challenge",
  problemDescription: "Sepsis remains one of the most frequently denied diagnoses in inpatient coding reviews. Despite its clinical complexity, documentation often fails to meet payer expectations or align with coding guidelines. CDI teams struggle to validate sepsis due to inconsistent clinical indicators, lack of provider clarity, and fragmented evidence across the chart. A system is needed to support real-time review of sepsis triggers, align with clinical and coding criteria, and integrate smoothly into existing workflows.",
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