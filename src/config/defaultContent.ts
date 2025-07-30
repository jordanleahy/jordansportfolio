export const defaultVideoContent = {
  videoUrl: "",
  posterUrl: "",
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
