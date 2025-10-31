export const problemData = {
  problemTitle: "The Challenge",
  problemDescription: "Users struggled to find and synthesize hospital insights across multiple data tabs, resulting in increased time on task and lower engagement. The goal was to redesign the Hospital Profile experience to make data discovery faster and more intuitive for diverse user groups.",
  challenges: [
    {
      type: "problem" as const,
      title: "Complex Data Structure and Low Usability",
      items: [
        "Users found navigation confusing and search unintuitive.",
        "High cognitive load when comparing hospitals and analyzing metrics."
      ]
    },
    {
      type: "need" as const,
      title: "Simplify Access to Insights",
      items: [
        "Users wanted summary views instead of multiple tab explorations.",
        "Stakeholders needed clarity on which metrics users valued most."
      ]
    }
  ],
  problemIframeUrl: undefined,
  problemIframeTitle: undefined
};
