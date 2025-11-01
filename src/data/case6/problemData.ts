export const problemData = {
  problemTitle: "Challenge",
  problemDescription: "Rushed development without proper UX planning created an unstructured data experience filled with duplicate information and navigation chaos.",
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
