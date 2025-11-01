export const problemData = {
  problemTitle: "Challenge",
  problemDescription: "Rushed development without proper UX planning created an unstructured data experience filled with duplicate information and navigation chaos.",
  challenges: [
    {
      type: "problem" as const,
      title: "3 Million Views = 3 Million Struggles",
      items: [
        "High page views weren't engagement—they were users lost in navigation",
        "Comparing hospitals meant juggling multiple tabs with duplicate metrics"
      ]
    },
    {
      type: "need" as const,
      title: "Users Needed Answers, Not Explorations",
      items: [
        "Summary views that surface insights instead of forcing tab-by-tab discovery",
        "Clear prioritization of which metrics actually drive decisions"
      ]
    }
  ],
  problemIframeUrl: undefined,
  problemIframeTitle: undefined
};
