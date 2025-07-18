import type { OfferingDetail } from "@/types/sec";

export interface SecOffering {
  id: string;
  company: string;
  cityState: string;
  signer: string;
  accession: string;
  securityType: string;
  raiseTarget: number;
  amountSold: number;
  minInvestment: number;
}

export function mapOfferingToSecOffering(offering: any): SecOffering {
  // Extract company name from various possible sources
  const company = offering.issuers?.[0]?.entityname || 
                 offering.company_name || 
                 offering.issuers?.[0]?.ENTITYNAME || 
                 'Unknown Company';

  // Extract location
  const city = offering.issuers?.[0]?.city || 
               offering.issuers?.[0]?.CITY || 
               offering.company_city || 
               'Unknown';
  const state = offering.issuers?.[0]?.stateorcountrydescription || 
                offering.issuers?.[0]?.STATEORCOUNTRYDESCRIPTION || 
                offering.company_location || 
                'Unknown';
  const cityState = `${city}, ${state}`;

  // Extract signer
  const signer = offering.signatures?.[0]?.nameofsigner || 
                offering.signatures?.[0]?.NAMEOFSIGNER || 
                offering.primary_signer || 
                'Not specified';

  // Extract accession number
  const accession = offering.accessionnumber || 
                   offering.ACCESSIONNUMBER || 
                   'Unknown';

  // Determine security type based on boolean flags
  let securityType = 'Unknown';
  if (offering.isequitytype || offering.ISEQUITYTYPE) securityType = 'Equity';
  else if (offering.isdebttype || offering.ISDEBTTYPE) securityType = 'Debt';
  else if (offering.isoptiontoacquiretype || offering.ISOPTIONTOACQUIRETYPE) securityType = 'Option to Acquire';
  else if (offering.ispooledinvestmentfundtype || offering.ISPOOLEDINVESTMENTFUNDTYPE) securityType = 'Pooled Investment Fund';
  else if (offering.isothertype || offering.ISOTHERTYPE) securityType = offering.descriptionofothertype || offering.DESCRIPTIONOFOTHERTYPE || 'Other';

  // Extract financial data
  const raiseTarget = offering.totalofferingamount || offering.TOTALOFFERINGAMOUNT || 0;
  const amountSold = offering.totalamountsold || offering.TOTALAMOUNTSOLD || 0;
  const minInvestment = offering.minimuminvestmentaccepted || offering.MINIMUMINVESTMENTACCEPTED || 0;

  return {
    id: accession,
    company,
    cityState,
    signer,
    accession,
    securityType,
    raiseTarget,
    amountSold,
    minInvestment
  };
}

export function buildPrompt(offering: SecOffering): string {
  const formatCurrency = (amount: number) => {
    if (amount === 0) return 'Not disclosed';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'standard',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const remaining = offering.raiseTarget - offering.amountSold;

  return `You are my venture-style research assistant.

❶  TARGET  
   • Legal entity: "${offering.company}" (principal place of business: ${offering.cityState})  
   • Executive / authorized signer: "${offering.signer}"  
   • SEC Form D accession #: ${offering.accession}  
   • Offering details (as of filing):  
        – Security type: ${offering.securityType}  
        – Total authorized: ${formatCurrency(offering.raiseTarget)}  
        – Sold: ${formatCurrency(offering.amountSold)}  
        – Remaining: ${formatCurrency(remaining)}  
        – Minimum investment: ${formatCurrency(offering.minInvestment)}

❷  TASKS  
   A. Validate & enrich company profile:
      • Confirm legal entity name, corporate structure, and registration details
      • Research founding team, key executives, and board composition
      • Map product/service offerings, business model, and revenue streams
      • Identify target market, customer base, and competitive positioning
      
   B. Financial & fundraising analysis:
      • Cross-reference this Form D with prior fundraising rounds
      • Analyze valuation trends, dilution patterns, and investor composition
      • Research current revenue, growth metrics, and burn rate (if available)
      • Identify lead investors, follow-on participants, and strategic partners
      
   C. Market & competitive intelligence:
      • Research industry dynamics, market size, and growth projections
      • Identify direct competitors and their recent funding activities
      • Analyze regulatory environment and potential compliance considerations
      • Assess technology differentiation and intellectual property position
      
   D. Due diligence red flags:
      • Check for any litigation, regulatory issues, or compliance violations
      • Research executive backgrounds for any concerning patterns
      • Validate business licenses and regulatory approvals
      • Cross-check against SEC enforcement actions or sanctions lists

❸  OUTPUT SPECS  
   • Bullet, semi-formal prose, ≤ 600 words  
   • Inline footnote links for all claims and data points
   • Highlight any material concerns or positive differentiators
   • Include next steps for deeper due diligence if warranted
   • Organize findings by: Company Overview, Financial Profile, Market Position, Risk Assessment`;
}

export function cachePrompt(prompt: string): void {
  try {
    localStorage.setItem('sec-last-generated-prompt', prompt);
  } catch (error) {
    console.warn('Failed to cache prompt:', error);
  }
}

export function loadCachedPrompt(): string | null {
  try {
    return localStorage.getItem('sec-last-generated-prompt');
  } catch (error) {
    console.warn('Failed to load cached prompt:', error);
    return null;
  }
}