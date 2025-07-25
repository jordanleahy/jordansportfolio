export const defaultVideoContent = {
  videoUrl: "https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/general//667F0B04-8D3D-429C-992C-1D8FB2883E9E%20(1)%20(1)%202.mov",
  posterUrl: "/lovable-uploads/6ad28481-a75a-4096-a9f1-74822cefe882.png",
  topVideoUrl: "",
  topPosterUrl: ""
} as const;

export const defaultCoverLetterTemplate = {
  opening: (companyName: string) => 
    `I'm writing to express my strong interest in joining ${companyName}. With over 10 years of experience in healthcare technology and AI applications, I'm excited about the opportunity to contribute to your team's mission.`,
  
  body: (companyName: string) => 
    `My background in clinical documentation integrity, revenue cycle management, and healthcare data analytics aligns perfectly with your needs. I've successfully implemented technology solutions that improve patient outcomes and operational efficiency across multiple healthcare organizations.`,
  
  closing: (companyName: string) => 
    `I would love to discuss how my experience can contribute to ${companyName}'s continued success and growth. Thank you for considering my application.`
} as const;
