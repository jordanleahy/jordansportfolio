
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
  competitors: string[];
  performance_metrics?: any;
  notable_customers: string[];
  research_data?: any;
  company_data?: any;
  source_url?: string;
  status?: string;
  slug: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  // New extracted fields from company_data
  business_model?: string;
  employee_count_range?: string;
  geographic_presence?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  linkedin_url?: string;
  twitter_url?: string;
  certifications?: string[];
  awards_recognition?: string[];
  office_locations?: string[];
  partnerships?: string[];
  tech_stack?: string[];
  vendor_images?: any; // JSONB field for image metadata
}

export interface VendorFiltersState {
  companyType?: string[];
  fundingRange?: string[];
  specialties?: string[];
  services?: string[];
  customers?: string[];
  searchQuery?: string;
}

// Category mappings for the UI
export const VENDOR_CATEGORIES = {
  rcm: {
    title: 'Revenue Cycle Management (RCM) Companies',
    description: 'Comprehensive analysis of RCM vendors, their capabilities, funding, and market positioning for competitive intelligence research.'
  },
  healthcare: {
    title: 'Healthcare Technology Companies',
    description: 'Healthcare technology vendors providing innovative solutions for hospitals, clinics, and healthcare organizations.'
  },
  fintech: {
    title: 'Financial Technology Companies',
    description: 'Financial technology vendors offering payment processing, banking solutions, and financial services platforms.'
  },
  saas: {
    title: 'Software as a Service Companies',
    description: 'SaaS vendors providing cloud-based software solutions across various industries and business functions.'
  },
  ai: {
    title: 'Artificial Intelligence Companies',
    description: 'AI and machine learning companies developing intelligent solutions and automation platforms.'
  },
  cybersecurity: {
    title: 'Cybersecurity Companies',
    description: 'Cybersecurity vendors providing protection, monitoring, and security solutions for organizations.'
  },
  edtech: {
    title: 'Education Technology Companies', 
    description: 'EdTech vendors creating innovative learning platforms and educational technology solutions.'
  },
  hrtech: {
    title: 'Human Resources Technology Companies',
    description: 'HR technology vendors offering talent management, payroll, and workforce solutions.'
  }
} as const;

export type VendorCategory = keyof typeof VENDOR_CATEGORIES;
