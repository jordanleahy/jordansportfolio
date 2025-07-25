import { type SectionConfig } from '@/components/vendors/EditableSection';

export const COMPANY_TYPE_OPTIONS = [
  { value: 'Public', label: 'Public' },
  { value: 'Private', label: 'Private' },
  { value: 'Startup', label: 'Startup' },
  { value: 'Subsidiary', label: 'Subsidiary' },
  { value: 'Non-profit', label: 'Non-profit' },
];

export const FUNDING_STAGE_OPTIONS = [
  { value: 'Bootstrap', label: 'Bootstrap' },
  { value: 'Pre-seed', label: 'Pre-seed' },
  { value: 'Seed', label: 'Seed' },
  { value: 'Series A', label: 'Series A' },
  { value: 'Series B', label: 'Series B' },
  { value: 'Series C+', label: 'Series C+' },
  { value: 'Private Equity', label: 'Private Equity' },
  { value: 'Public', label: 'Public' },
  { value: 'Acquired', label: 'Acquired' },
];

export const companyOverviewConfig: SectionConfig = {
  title: 'Company Overview',
  description: 'Basic company information and description',
  fields: [
    {
      key: 'description',
      type: 'multiline',
      label: 'Description',
      placeholder: 'Enter company description...',
      maxLength: 1000,
    },
    {
      key: 'headquarters',
      type: 'text',
      label: 'Headquarters',
      placeholder: 'City, State, Country',
    },
    {
      key: 'founding_year',
      type: 'number',
      label: 'Founded',
      placeholder: 'Year founded',
    },
    {
      key: 'company_type',
      type: 'select',
      label: 'Company Type',
      placeholder: 'Select company type',
      options: COMPANY_TYPE_OPTIONS,
    },
  ],
};

export const servicesConfig: SectionConfig = {
  title: 'Core Services',
  description: 'Primary services and offerings',
  fields: [
    {
      key: 'core_services',
      type: 'array',
      placeholder: 'Add a service',
      maxItems: 8,
    },
  ],
};

export const specializationsConfig: SectionConfig = {
  title: 'Specializations',
  description: 'Areas of expertise and technical specialties',
  fields: [
    {
      key: 'specialties',
      type: 'array',
      placeholder: 'Add a specialty',
      maxItems: 6,
    },
  ],
};

export const customersConfig: SectionConfig = {
  title: 'Target Customers',
  description: 'Primary customer segments and industries served',
  fields: [
    {
      key: 'customers',
      type: 'array',
      placeholder: 'Add customer type',
      maxItems: 6,
    },
  ],
};

export const featuresConfig: SectionConfig = {
  title: 'Key Features',
  description: 'Main product features and capabilities',
  fields: [
    {
      key: 'key_features',
      type: 'array',
      placeholder: 'Add a feature',
      maxItems: 8,
    },
  ],
};

export const benefitsConfig: SectionConfig = {
  title: 'Key Benefits',
  description: 'Business benefits and value propositions',
  fields: [
    {
      key: 'key_benefits',
      type: 'array',
      placeholder: 'Add a benefit',
      maxItems: 8,
    },
  ],
};

export const competitiveConfig: SectionConfig = {
  title: 'Competitive Advantages',
  description: 'Unique differentiators and competitive strengths',
  fields: [
    {
      key: 'competitive_advantages',
      type: 'array',
      placeholder: 'Add competitive advantage',
      maxItems: 5,
    },
  ],
};

export const competitorsConfig: SectionConfig = {
  title: 'Competitors',
  description: 'Main competitors in the market',
  fields: [
    {
      key: 'competitors',
      type: 'array',
      placeholder: 'Add competitor',
      maxItems: 6,
    },
  ],
};

export const notableCustomersConfig: SectionConfig = {
  title: 'Notable Customers',
  description: 'Well-known clients and case studies',
  fields: [
    {
      key: 'notable_customers',
      type: 'array',
      placeholder: 'Add customer name',
      maxItems: 10,
    },
  ],
};

export const fundingConfig: SectionConfig = {
  title: 'Funding Information',
  description: 'Investment details and financial backing',
  fields: [
    {
      key: 'total_funding',
      type: 'text',
      label: 'Total Funding',
      placeholder: '$10M, $500M, etc.',
    },
    {
      key: 'funding_stage',
      type: 'select',
      label: 'Funding Stage',
      placeholder: 'Select funding stage',
      options: FUNDING_STAGE_OPTIONS,
    },
    {
      key: 'key_investors',
      type: 'array',
      label: 'Key Investors',
      placeholder: 'Add investor',
      maxItems: 8,
    },
  ],
};

export const businessConfig: SectionConfig = {
  title: 'Business Details',
  description: 'Business model and operational information',
  fields: [
    {
      key: 'business_model',
      type: 'text',
      label: 'Business Model',
      placeholder: 'SaaS, Professional Services, etc.',
    },
    {
      key: 'employee_count_range',
      type: 'text',
      label: 'Employee Count',
      placeholder: '50-100, 500-1000, etc.',
    },
    {
      key: 'geographic_presence',
      type: 'text',
      label: 'Geographic Presence',
      placeholder: 'Global, North America, etc.',
    },
  ],
};

export const contactConfig: SectionConfig = {
  title: 'Contact Information',
  description: 'Contact details and locations',
  fields: [
    {
      key: 'contact_email',
      type: 'text',
      label: 'Email',
      placeholder: 'contact@company.com',
    },
    {
      key: 'contact_phone',
      type: 'text',
      label: 'Phone',
      placeholder: '+1 (555) 123-4567',
    },
    {
      key: 'contact_address',
      type: 'multiline',
      label: 'Address',
      placeholder: 'Full mailing address',
    },
    {
      key: 'office_locations',
      type: 'array',
      label: 'Office Locations',
      placeholder: 'Add location',
      maxItems: 10,
    },
  ],
};

export const socialConfig: SectionConfig = {
  title: 'Social Media & Links',
  description: 'Online presence and social media profiles',
  fields: [
    {
      key: 'linkedin_url',
      type: 'text',
      label: 'LinkedIn',
      placeholder: 'https://linkedin.com/company/...',
    },
    {
      key: 'twitter_url',
      type: 'text',
      label: 'Twitter/X',
      placeholder: 'https://twitter.com/...',
    },
  ],
};

export const recognitionConfig: SectionConfig = {
  title: 'Recognition & Certifications',
  description: 'Awards, certifications, and industry recognition',
  fields: [
    {
      key: 'certifications',
      type: 'array',
      label: 'Certifications',
      placeholder: 'Add certification',
      maxItems: 8,
    },
    {
      key: 'awards_recognition',
      type: 'array',
      label: 'Awards & Recognition',
      placeholder: 'Add award or recognition',
      maxItems: 8,
    },
  ],
};

export const technologyConfig: SectionConfig = {
  title: 'Technology & Partnerships',
  description: 'Technology stack and strategic partnerships',
  fields: [
    {
      key: 'tech_stack',
      type: 'array',
      label: 'Technology Stack',
      placeholder: 'Add technology',
      maxItems: 10,
    },
    {
      key: 'partnerships',
      type: 'array',
      label: 'Partnerships',
      placeholder: 'Add partner',
      maxItems: 10,
    },
  ],
};

export const ogMetadataConfig: SectionConfig = {
  title: 'Open Graph Metadata',
  description: 'Control how this vendor appears when shared on social media',
  fields: [
    {
      key: 'og_title',
      type: 'text',
      label: 'OG Title',
      placeholder: 'Custom title for social media sharing',
      maxLength: 100,
    },
    {
      key: 'og_description',
      type: 'multiline',
      label: 'OG Description',
      placeholder: 'Custom description for social media sharing',
      maxLength: 300,
    },
    {
      key: 'og_image_url',
      type: 'text',
      label: 'OG Image URL',
      placeholder: 'https://example.com/image.jpg',
    },
  ],
};