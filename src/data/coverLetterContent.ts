
export interface CoverLetterContent {
  recipient: string;
  paragraphs: string[];
  signature: {
    name: string;
    website: string;
  };
}

export interface ProjectData {
  title: string;
  description: string;
  tags: string[];
  link: string;
  iconColor: string;
  iconBg: string;
}

export const ascertainCoverLetterContent: CoverLetterContent = {
  recipient: "Dear Hoshi & Eli,",
  paragraphs: [
    "I understand the challenge you're solving intimately: case managers spending 60% of their time on manual administrative tasks instead of high-impact patient care. As someone who has dedicated my career to designing AI-powered healthcare solutions that reduce administrative burden, I'm excited about the opportunity to help Ascertain reach the moon—and beyond.",
    "My experience directly aligns with your mission. I designed and implemented an AI sepsis detection system that reduced mortality rates by 23% by creating a data dense custom Sepsis CDS dashboard. This project taught me how AI can transform healthcare workflows when thoughtfully integrated into existing systems—exactly what Ascertain is doing with case management.",
    "More specifically relevant to your work, I built a comprehensive prior authorization workflow system that reduced response times from 3 days to 5 minutes through intelligent automation. This system processed thousands of authorizations while maintaining compliance—the same type of administrative workflow automation that's core to Ascertain's value proposition for health systems like Northwell.",
    "Throughout my work in Healthcare RCM, I've seen firsthand how the right design can eliminate friction for overworked clinical staff. From CDI dashboards that streamline diagnosis coding to denial management platforms that cut appeal processing from 30 to 10 minutes, I've consistently focused on creating solutions that let healthcare professionals focus on what matters most: patient care.",
    "Your partnership with Deerfield Management and collaboration with the Aegis Digital Consortium demonstrates the thoughtful, strategic approach needed to scale AI in healthcare. I'm particularly excited about how Ascertain is reimagining workflows from the ground up rather than just making existing processes more efficient—this philosophical alignment resonates deeply with my design approach.",
    "I would love to discuss how my experience designing AI-powered healthcare tools can contribute to Ascertain's mission of enabling higher quality patient care, faster care journeys, and more cost-efficient delivery. Let's schedule a conversation about taking Ascertain to the moon together."
  ],
  signature: {
    name: "Jordan Leahy",
    website: "jordanwilliamleahy.com"
  }
};

export const healthcareProjectsData: ProjectData[] = [
  {
    title: "Inpatient Revenue Cycle Management",
    description: "Designed an AI-powered CDI dashboard to help CDS specialists review and validate pre-bill diagnoses.",
    tags: ["#RCM", "#LLM", "#ICD-10"],
    link: "/cases/case1",
    iconColor: "bg-blue-600",
    iconBg: "bg-blue-100"
  },
  {
    title: "Drug Prior Auth and Validation",
    description: "Designed an AI drug prior authorization workflow tool that identifies formulary rules, medical requirements, step therapy, reauthorization dates, drafts the letter, and sends to the appropriate insurance company.",
    tags: ["#PriorAuth", "#ML", "#Workflow"],
    link: "/cases/case4",
    iconColor: "bg-cyan-600",
    iconBg: "bg-cyan-100"
  },
  {
    title: "Denial and Appeal Resolution",
    description: "Designed a denial and appeal resolution application for managing denials, including the drafting of templates and sending to payer.",
    tags: ["#Appeals", "#Research", "#UX"],
    link: "/cases/case3",
    iconColor: "bg-slate-600",
    iconBg: "bg-slate-100"
  }
];
