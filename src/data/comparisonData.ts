
export interface CompanyInfo {
  name: string;
  founded: string;
  headquarters: string;
  companyType: string;
  funding: string;
  investors: string;
  employeeSize: string;
  deliveryModel: string;
  targetCustomers: string;
  primarySolutions: string;
  aiCore: string;
  ehrIntegration: string;
  keyBenefits: string[];
  uniqueStrengths: string[];
  clientBase: string;
  certifications: string;
  awards: string;
}

export interface FeatureComparison {
  feature: string;
  company1: boolean | string;
  company2: boolean | string;
}

export interface UseCase {
  useCase: string;
  bestFit: string;
}

export interface ComparisonData {
  title: string;
  metaTitle: string;
  metaDescription: string;
  company1: CompanyInfo;
  company2: CompanyInfo;
  features: FeatureComparison[];
  summaryInsights: {
    company1: string;
    company2: string;
  };
  useCases: UseCase[];
}

export const smarterdxVsIodineData: ComparisonData = {
  title: "Iodine vs SmarterDx",
  metaTitle: "SmarterDx vs Iodine",
  metaDescription: "Is SmarterDx better than Iodine?",
  company1: {
    name: "Iodine Software",
    founded: "2010",
    headquarters: "Austin, TX",
    companyType: "Private",
    funding: "Private Equity (Undisclosed)",
    investors: "Bain Capital, Silversmith, Advent",
    employeeSize: "201–500",
    deliveryModel: "SaaS + Outcome-Based Pricing",
    targetCustomers: "Large Health Systems, AMCs",
    primarySolutions: "AwareCDI, AwareUM, AwarePrebill",
    aiCore: "Proprietary CognitiveML Engine",
    ehrIntegration: "Seamless with HL7/FHIR, Mobile",
    keyBenefits: [
      "Real-time doc gap closure",
      "Query automation",
      "Revenue capture & compliance"
    ],
    uniqueStrengths: [
      "AI engine built over 10+ years",
      "Best in KLAS recognition",
      "Predictive planning tools"
    ],
    clientBase: "800+ hospitals (e.g. Johns Hopkins, AdventHealth)",
    certifications: "HITRUST, HIPAA, SOC 2",
    awards: "Best in KLAS"
  },
  company2: {
    name: "SmarterDx",
    founded: "2020",
    headquarters: "New York, NY",
    companyType: "Private",
    funding: "$71M (Series B)",
    investors: "Bessemer, New Mountain, Flare, Transformation",
    employeeSize: "50–100",
    deliveryModel: "100% Outcome-Based SaaS",
    targetCustomers: "Large Hospitals, Teaching Hospitals",
    primarySolutions: "SmarterPrebill, SmarterDenials",
    aiCore: "5,500+ MD-built rules, NLP, OCR, GenAI",
    ehrIntegration: "Seamless, No Workflow Changes",
    keyBenefits: [
      "100% chart review",
      "Auto appeals for denials",
      "5:1 ROI guaranteed"
    ],
    uniqueStrengths: [
      "Physician-founded",
      "Risk-free pricing model",
      "Rapid deployment"
    ],
    clientBase: "200+ sites (specific names not disclosed)",
    certifications: "HIPAA, SOC 2",
    awards: "Modern Healthcare, Forbes, TechCrunch"
  },
  features: [
    { feature: "Real-Time Documentation Gap Analysis", company1: true, company2: true },
    { feature: "Full-Chart AI Review", company1: false, company2: true },
    { feature: "Predictive Analytics (e.g. DRG Forecasting)", company1: true, company2: false },
    { feature: "Auto Appeals for Denials", company1: false, company2: true },
    { feature: "EHR Workflow Disruption", company1: "Low", company2: "None" },
    { feature: "Mobile Physician Queries", company1: true, company2: "Not mentioned" },
    { feature: "Shared Success Pricing", company1: true, company2: true },
    { feature: "Time to Deploy", company1: "Weeks to months", company2: "Few weeks" }
  ],
  summaryInsights: {
    company1: "Iodine Software excels in predictive planning, mature AI models, and traditional CDI enhancement, especially for large institutions with existing CDI teams and pre-bill workflows.",
    company2: "SmarterDx leads in automation for denial management and real-time clinical ROI, with a physician-led approach and zero-friction integration, making it ideal for faster-turnaround, leaner health systems."
  },
  useCases: [
    { useCase: "Boosting mature CDI teams with AI prioritization", bestFit: "Iodine Software" },
    { useCase: "Automating appeal letters and denial overturns", bestFit: "SmarterDx" },
    { useCase: "Deploying with minimal IT resources", bestFit: "SmarterDx" },
    { useCase: "Driving financial uplift via documentation gaps", bestFit: "Both" },
    { useCase: "Predictive planning (DRG, LOS, impact analytics)", bestFit: "Iodine Software" }
  ]
};

export const comparisonDataMap: Record<string, ComparisonData> = {
  'smarterdxvsiodine': smarterdxVsIodineData,
};
