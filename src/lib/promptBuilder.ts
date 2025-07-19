
export const generateVendorPrompt = (companyUrl: string): string => {
  return `🛠 AGENT TOOLS REQUIRED

This task requires the following tools:
• web-browsing: To extract factual company information from the open web
• code-interpreter: To validate and correct JSON structure against the schema
• custom-validator (optional): For enhanced JSON QA using schema linting

⸻

📍 TASK PLAN

The agent should follow these steps exactly:

Step 1: PLAN RESEARCH SOURCES
• Identify high-signal web pages such as:
  - Homepage
  - About page
  - Product pages
  - Pricing (if available)
  - Leadership or Team pages
  - Press releases
  - Investor/funding announcements
  - Careers (for company size)
  - Case studies or testimonials

Step 2: EXTRACT STRUCTURED INFORMATION
• Parse and extract only factual, verifiable details from public sources
• Cross-reference at least two sources when possible
• Ignore fluff and vague marketing copy

Step 3: CONSTRUCT JSON OBJECT
• Use the schema below to format data
• Fill as many fields as can be confidently verified
• For unknowns:
  - Use null for single values
  - Use [] for list fields

Step 4: VALIDATE OUTPUT
• Ensure compliance with the JSON schema using the code interpreter:
  - founding_year must be a number
  - No markdown formatting or smart quotes
  - All keys must exist, even if null or empty
  - Ensure it passes a strict jsonlint.com style validation

Step 5: RETURN OUTPUT
• Return only valid RAW JSON
• Do not include any markdown, commentary, logs, or wrappers

⸻

📋 REQUIRED JSON SCHEMA

{
  "company_name": null,
  "headquarters": null,
  "founding_year": null,
  "company_type": null,
  "description": null,
  "core_services": [],
  "specialties": [],
  "customers": [],
  "key_features": [],
  "key_benefits": [],
  "website_url": "${companyUrl}",
  "source_url": "${companyUrl}",
  "funding_stage": null,
  "total_funding": null,
  "key_investors": [],
  "competitive_advantages": [],
  "performance_metrics": null,
  "notable_customers": [],
  "research_data": null,
  "company_data": null,
  "status": "draft"
}

⸻

🧾 FIELD DETAILS (Condensed for Agent Readability)

| Field | Type | Notes |
|-------|------|-------|
| company_name | string | Official legal or public name |
| headquarters | string | City, State, Country format |
| founding_year | number | Year only (e.g., 2017) |
| company_type | string | Choose or infer from: "Healthcare Technology Vendor", "SaaS Platform", "Private Equity Backed", "Public Company", etc. |
| description | string | 150–300 word factual summary |
| core_services | array | Primary service offerings (3-8 items) |
| specialties | array | Specific expertise areas or niche focuses (3-6 items) |
| customers | array | Customer segments or types served (2-5 items) |
| key_features | array | Product/service features that differentiate the vendor (4-8 items) |
| key_benefits | array | Measurable business outcomes customers achieve (4-8 items) |
| funding_stage | string | Current funding status: "Bootstrap/Self-Funded", "Series A/B/C", "Private Equity Backed", "Public Company", etc. |
| total_funding | string | Total funding raised (format: "$XXM" or "$XXB") |
| key_investors | array | Major investors, VCs, or parent companies |
| competitive_advantages | array | What sets them apart from competitors (3-6 items) |
| performance_metrics | object | If public: employee count, customer count, revenue, retention, etc. |
| notable_customers | array | Named logos only if publicly disclosed |
| research_data | object | Research metadata - see structure below |
| company_data | object | Additional structured data - see structure below |
| status | string | Always set to "draft" |

⸻

📊 RESEARCH_DATA STRUCTURE

{
  "research_date": "YYYY-MM-DD",
  "data_sources": ["website", "press_releases", "third_party"],
  "research_quality": "high/medium/low",
  "confidence_level": "high/medium/low",
  "last_updated": "most recent info date found",
  "verification_status": "verified/unverified"
}

⸻

🏢 COMPANY_DATA STRUCTURE

{
  "business_model": "SaaS/Professional Services/Hybrid/Other",
  "target_market": "Enterprise/Mid-Market/Small Business/All",
  "geographic_presence": "US Only/North America/Global",
  "industry_focus": "Healthcare/Financial/Technology/Multi-Industry",
  "technology_stack": ["known technologies used"],
  "certifications": ["relevant certifications"],
  "partnerships": ["key technology partners"]
}

⸻

❗CRITICAL OUTPUT REQUIREMENTS

1. Return **ONLY** raw JSON (no markdown, no explanation)
2. Use straight quotes (") not curly quotes (" ")
3. founding_year must be a number, not a string
4. Do not fabricate — prefer null or [] over guesses
5. Validate before return using code interpreter
6. All required fields must be present, even if null or empty
7. Ensure JSON passes strict validation (jsonlint.com style)

⸻

🔄 FALLBACK PROTOCOLS

If information is missing:
• Derive company_name from domain if no name found
• Use incorporation or press data for headquarters
• Leave unverifiable values as null or []
• Log all attempted paths in research_data
• Be conservative - prefer null/empty over guessing

⸻

✅ AGENT QA CHECKLIST

Before final output:
□ Is JSON schema valid?
□ Are required types (number vs string) correct?
□ No missing keys, smart quotes, or formatting issues?
□ Is the output fully parsable without error?
□ All arrays properly formatted?
□ No trailing commas?
□ Research reflects current/recent company information?
□ Information is factual and verifiable?

⸻

## BEGIN AGENT RESEARCH
Target: ${companyUrl}

Return a fully structured vendor profile in valid RAW JSON suitable for competitive intelligence and procurement workflows.`;
};
