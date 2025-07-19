
export interface Vendor {
  id: string;
  companyName: string;
  headquarters: string;
  yearFounded: number;
  companyType: 'Public' | 'Private' | 'Startup' | 'Subsidiary';
  description: string;
  coreServices: string[];
  targetCustomers: string[];
  specialtyFocus: string[];
  keyFeatures: string[];
  keyBenefits: string[];
  fundingRaised?: number;
  latestFundingRound?: string;
  investors?: string[];
  notableCustomers?: string[];
  metrics?: string[];
  websiteUrl?: string;
  notes?: string;
  category: string;
  slug: string;
}

export interface VendorFilters {
  companyType?: string[];
  fundingRange?: string[];
  specialties?: string[];
  services?: string[];
  customers?: string[];
  searchQuery?: string;
}

export const RCM_SAMPLE_DATA: Vendor[] = [
  {
    id: '1',
    companyName: 'CureMD',
    headquarters: 'New York, NY (USA)',
    yearFounded: 1997,
    companyType: 'Private',
    description: 'End-to-end RCM and billing platform with specialty-specific programs',
    coreServices: ['Billing & Coding', 'Practice Management', 'EHR Integration', 'Analytics'],
    targetCustomers: ['Small Practices', 'Multi-specialty Groups', 'Medium Practices'],
    specialtyFocus: ['Cardiology', 'Dermatology', 'Oncology', '32+ Specialties'],
    keyFeatures: ['Cloud-based', 'AI-driven Analytics', 'Real-time Claim Tracking', 'Specialty Templates'],
    keyBenefits: ['96% First-pass Claims Rate', '60% Cost Savings', 'Reduced Denials'],
    fundingRaised: undefined,
    websiteUrl: 'https://www.curemd.com',
    category: 'rcm',
    slug: 'curemd',
    notes: 'Offers AI-driven RCM integrated with telehealth; strong analytics reporting'
  },
  {
    id: '2',
    companyName: 'CodaMetrix',
    headquarters: 'Boston, MA (USA)',
    yearFounded: 2019,
    companyType: 'Startup',
    description: 'AI-powered automated coding for claims processing',
    coreServices: ['Automated Coding', 'Claims Management', 'AI Analytics'],
    targetCustomers: ['Hospitals', 'Health Systems', 'Large Practices'],
    specialtyFocus: ['Multi-specialty', 'Hospital Medicine'],
    keyFeatures: ['AI-powered Coding', 'Machine Learning', 'Integration APIs'],
    keyBenefits: ['60% Reduction in Coding Costs', '70% Reduction in Claims Denials'],
    fundingRaised: 95000000,
    latestFundingRound: 'Series B – Mar 2024',
    investors: ['Transformation Capital', 'SignalFire', 'Frist Cressey Ventures'],
    notableCustomers: ['Mass General Brigham', 'Yale Medicine'],
    metrics: ['60% coding cost reduction', '70% denial reduction'],
    websiteUrl: 'https://www.codametrix.com',
    category: 'rcm',
    slug: 'codametrix'
  },
  {
    id: '3',
    companyName: 'Collectly',
    headquarters: 'San Francisco, CA (USA)',
    yearFounded: 2019,
    companyType: 'Startup',
    description: 'Patient billing and payment platform with digital engagement',
    coreServices: ['Patient Billing', 'Payment Processing', 'Patient Engagement'],
    targetCustomers: ['Healthcare Providers', 'Clinics', 'Digital Health Startups'],
    specialtyFocus: ['Primary Care', 'Specialty Practices'],
    keyFeatures: ['Digital Payment Portal', 'Automated Reminders', 'Mobile-first'],
    keyBenefits: ['Improved Collections', 'Enhanced Patient Experience'],
    fundingRaised: 34100000,
    latestFundingRound: 'Series A – 2023',
    investors: ['Sapphire Ventures'],
    websiteUrl: 'https://www.collectly.co',
    category: 'rcm',
    slug: 'collectly'
  },
  {
    id: '4',
    companyName: 'Candid Health',
    headquarters: 'San Francisco, CA (USA)',
    yearFounded: 2020,
    companyType: 'Startup',
    description: 'Modern RCM platform with API-first approach',
    coreServices: ['RCM Platform', 'Claims Processing', 'API Services'],
    targetCustomers: ['Digital Health Companies', 'Telehealth Providers'],
    specialtyFocus: ['Digital Health', 'Telehealth'],
    keyFeatures: ['API-first Platform', 'Modern Tech Stack', 'Developer Tools'],
    keyBenefits: ['Faster Integration', 'Improved Developer Experience'],
    fundingRaised: 47000000,
    latestFundingRound: 'Series B – 2023',
    websiteUrl: 'https://www.candidhealth.com',
    category: 'rcm',
    slug: 'candid-health'
  }
];
