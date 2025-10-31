export const solutionData = {
  solutionTitle: "Solution & Key Features",
  features: [
    {
      icon: "TrendingUp" as const,
      title: "Customizable Data Filters",
      description: "Introduced over 500+ customizable filters with toggle-based interactions for faster metric selection.",
      images: [
        {
          src: "/lovable-uploads/filter-customization.png", // TODO: Upload actual image
          alt: "UI showing hospital metrics with customizable filters toggled on and off",
          caption: "Filter customization workflow for power users."
        }
      ]
    },
    {
      icon: "BarChart3" as const,
      title: "Usage-Driven Prioritization",
      description: "Prioritized the Summary Tab and high-traffic areas identified from Pendo analytics for enhanced data clarity.",
      images: [
        {
          src: "/lovable-uploads/usage-chart.png", // TODO: Upload actual image
          alt: "Donut chart visualization showing top used tabs in hospital profiles",
          caption: "Quantitative insight showing top used areas of the application."
        }
      ]
    }
  ]
};
