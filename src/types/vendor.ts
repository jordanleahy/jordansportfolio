
export interface Vendor {
  id: string;
  company_name: string;
  headquarters: string;
  founding_year?: number;
  company_type: string;
  description: string;
  core_services: string[];
  specialties: string[];
  customers: string[];
  key_features: string[];
  key_benefits: string[];
  website_url?: string;
  funding_stage?: string;
  total_funding?: string;
  key_investors: string[];
  competitive_advantages: string[];
  performance_metrics?: any;
  notable_customers: string[];
  slug: string;
}

export interface VendorFiltersState {
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
    company_name: 'CureMD',
    headquarters: 'New York, NY (USA)',
    founding_year: 1997,
    company_type: 'Private',
    description: 'End-to-end RCM and billing platform with specialty-specific programs',
    core_services: ['Billing & Coding', 'Practice Management', 'EHR Integration', 'Analytics'],
    customers: ['Small Practices', 'Multi-specialty Groups', 'Medium Practices'],
    specialties: ['Cardiology', 'Dermatology', 'Oncology', '32+ Specialties'],
    key_features: ['Cloud-based', 'AI-driven Analytics', 'Real-time Claim Tracking', 'Specialty Templates'],
    key_benefits: ['96% First-pass Claims Rate', '60% Cost Savings', 'Reduced Denials'],
    total_funding: undefined,
    website_url: 'https://www.curemd.com',
    slug: 'curemd',
    key_investors: [],
    competitive_advantages: [],
    notable_customers: [],
    performance_metrics: null
  },
  {
    id: '2',
    company_name: 'CodaMetrix',
    headquarters: 'Boston, MA (USA)',
    founding_year: 2019,
    company_type: 'Startup',
    description: 'AI-powered automated coding for claims processing',
    core_services: ['Automated Coding', 'Claims Management', 'AI Analytics'],
    customers: ['Hospitals', 'Health Systems', 'Large Practices'],
    specialties: ['Multi-specialty', 'Hospital Medicine'],
    key_features: ['AI-powered Coding', 'Machine Learning', 'Integration APIs'],
    key_benefits: ['60% Reduction in Coding Costs', '70% Reduction in Claims Denials'],
    total_funding: '$95M',
    funding_stage: 'Series B – Mar 2024',
    key_investors: ['Transformation Capital', 'SignalFire', 'Frist Cressey Ventures'],
    notable_customers: ['Mass General Brigham', 'Yale Medicine'],
    performance_metrics: { coding_cost_reduction: '60%', denial_reduction: '70%' },
    website_url: 'https://www.codametrix.com',
    slug: 'codametrix',
    competitive_advantages: []
  },
  {
    id: '3',
    company_name: 'Collectly',
    headquarters: 'San Francisco, CA (USA)',
    founding_year: 2019,
    company_type: 'Startup',
    description: 'Patient billing and payment platform with digital engagement',
    core_services: ['Patient Billing', 'Payment Processing', 'Patient Engagement'],
    customers: ['Healthcare Providers', 'Clinics', 'Digital Health Startups'],
    specialties: ['Primary Care', 'Specialty Practices'],
    key_features: ['Digital Payment Portal', 'Automated Reminders', 'Mobile-first'],
    key_benefits: ['Improved Collections', 'Enhanced Patient Experience'],
    total_funding: '$34.1M',
    funding_stage: 'Series A – 2023',
    key_investors: ['Sapphire Ventures'],
    website_url: 'https://www.collectly.co',
    slug: 'collectly',
    notable_customers: [],
    competitive_advantages: [],
    performance_metrics: null
  },
  {
    id: '4',
    company_name: 'Candid Health',
    headquarters: 'San Francisco, CA (USA)',
    founding_year: 2020,
    company_type: 'Startup',
    description: 'Modern RCM platform with API-first approach',
    core_services: ['RCM Platform', 'Claims Processing', 'API Services'],
    customers: ['Digital Health Companies', 'Telehealth Providers'],
    specialties: ['Digital Health', 'Telehealth'],
    key_features: ['API-first Platform', 'Modern Tech Stack', 'Developer Tools'],
    key_benefits: ['Faster Integration', 'Improved Developer Experience'],
    total_funding: '$47M',
    funding_stage: 'Series B – 2023',
    website_url: 'https://www.candidhealth.com',
    slug: 'candid-health',
    key_investors: [],
    notable_customers: [],
    competitive_advantages: [],
    performance_metrics: null
  }
];
