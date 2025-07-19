
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
  user_id: string;
  created_at: string;
  updated_at: string;
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
  }
} as const;

export type VendorCategory = keyof typeof VENDOR_CATEGORIES;
