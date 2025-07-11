import { Reflection } from "@/types/caseStudy";

export const reflectionData = {
  reflectionTitle: "Reflection & Learnings",
  reflections: [
    {
      type: 'success',
      title: 'What Went Well',
      items: [
        "Early clinical stakeholder involvement led to accurate requirements",
        "Iterative design process prevented major usability issues", 
        "Real-world testing validated design decisions",
        "Cross-functional collaboration improved solution quality"
      ]
    },
    {
      type: 'challenge',
      title: 'Challenges', 
      items: [
        "EMR integration complexity required creative solutions",
        "Managing clinical validation timelines and requirements",
        "Addressing varying workflows across different hospital units"
      ]
    },
    {
      type: 'learning',
      title: 'Next Steps',
      items: [
        "Expand to additional infection prediction models",
        "Develop pediatric sepsis detection capabilities", 
        "Add predictive antibiotic resistance modeling"
      ]
    }
  ] as Reflection[],
};