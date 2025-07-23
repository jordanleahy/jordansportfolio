export interface Investor {
  id: string;
  firm_name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  website?: string;
  sector_focus: string[];
  stage?: string;
  check_size_min?: number;
  check_size_max?: number;
  latest_fund_name?: string;
  latest_fund_year?: number;
  latest_fund_size?: number;
  total_aum?: number;
  lead_partner?: string;
  contact_email?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  status?: string;
  slug: string;
}

export interface InvestorFiltersState {
  stage?: string[];
  sectorFocus?: string[];
  checkSizeRange?: string[];
  searchQuery?: string;
}

// Category mappings for the UI
export const INVESTOR_CATEGORIES = {
  vc: {
    title: 'Venture Capital Firms',
    description: 'Venture capital firms investing in early-stage to growth-stage companies across various sectors.'
  },
  pe: {
    title: 'Private Equity Firms',
    description: 'Private equity firms focused on buyouts, growth capital, and restructuring investments.'
  },
  healthcare_vc: {
    title: 'Healthcare VCs',
    description: 'Specialized venture capital firms focused on healthcare, medtech, and biotech investments.'
  },
  fintech_vc: {
    title: 'Fintech VCs',
    description: 'Venture capital firms specializing in financial technology and payments investments.'
  },
  growth_equity: {
    title: 'Growth Equity Firms',
    description: 'Growth equity investors focused on scaling established companies with proven business models.'
  },
  angel_groups: {
    title: 'Angel Investor Groups',
    description: 'Angel investor networks and groups providing early-stage funding and mentorship.'
  }
} as const;

export type InvestorCategory = keyof typeof INVESTOR_CATEGORIES;