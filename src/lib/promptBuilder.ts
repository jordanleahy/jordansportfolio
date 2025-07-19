export const generateVendorPrompt = (companyUrl: string): string => {
  return `Please research the company at ${companyUrl} and provide comprehensive information about them. Return your response as a valid JSON object with the following structure:

{
  "company_name": "string - The official company name",
  "headquarters": "string - Location of headquarters (City, State/Country)",
  "company_type": "string - Type of company (e.g., 'SaaS Platform', 'Healthcare Technology', 'Consulting Firm')",
  "description": "string - 2-3 sentence description of what the company does and their value proposition",
  "core_services": ["array of strings - Main services/products offered"],
  "specialties": ["array of strings - Key areas of specialization or expertise"],
  "customers": ["array of strings - Types of customers they serve (e.g., 'Healthcare Providers', 'Enterprise Companies')"],
  "founding_year": number - Year the company was founded (if available),
  "funding_stage": "string - Current funding stage (e.g., 'Series A', 'Private', 'Public') or null",
  "total_funding": "string - Total funding raised (e.g., '$50M') or null",
  "key_investors": ["array of strings - Notable investors/VCs"],
  "competitive_advantages": ["array of strings - What makes them unique or better than competitors"],
  "key_features": ["array of strings - Important product/service features"],
  "key_benefits": ["array of strings - Main benefits clients get from using their services"],
  "performance_metrics": {
    "optional object with any available metrics like customer_count, revenue_growth, etc."
  },
  "notable_customers": ["array of strings - Well-known clients or customer names if publicly available"],
  "website_url": "string - The main website URL"
}

Research Guidelines:
- Visit their website, about page, careers page, and any available press releases
- Look for case studies, customer testimonials, or success stories
- Check for recent funding announcements or growth metrics
- Identify their target market and competitive positioning
- Find information about their team size, locations, or notable employees
- Look for any awards, certifications, or industry recognition

Data Quality Requirements:
- Ensure all string fields are properly formatted and professional
- Use consistent formatting for locations (City, State format for US, City, Country for international)
- Keep array items concise but descriptive (2-8 words each typically)
- For funding amounts, use standard formats like "$10M", "$1.2B"
- If information is not available, use null or empty arrays rather than making assumptions
- Ensure the description is compelling and clearly explains their value proposition

Return ONLY the JSON object, no additional text or explanations.`;
};