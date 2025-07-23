import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ExternalLink, Building, Calendar, DollarSign, Users, Target, Sparkles, Lightbulb, Copy, Clipboard, Trash2, Eye, EyeOff, Globe, Download } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useVendorBySlug } from '@/hooks/useVendors';
import { VENDOR_CATEGORIES, type Vendor } from '@/types/vendor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { VendorRichData } from '@/components/vendors/VendorRichData';
import { useUserRole } from '@/hooks/useUserRole';
import { useVendorPublish } from '@/hooks/useVendorPublish';
import { EditableSection } from '@/components/vendors/EditableSection';
import { VendorImageGallery } from '@/components/vendors/VendorImageGallery';
import { ProductJobsCard } from '@/components/vendors/ProductJobsCard';
import {
  companyOverviewConfig,
  servicesConfig,
  specializationsConfig,
  customersConfig,
  featuresConfig,
  benefitsConfig,
  competitiveConfig,
  competitorsConfig,
  notableCustomersConfig,
  fundingConfig,
  businessConfig,
  contactConfig,
  socialConfig,
  recognitionConfig,
  technologyConfig,
} from '@/data/vendorSectionConfigs';

// Utility function for generating vendor research prompts
const generateVendorPrompt = (websiteUrl: string, vendor: Vendor) => {
  return `You are an expert business research analyst with advanced website browsing capabilities. Your task is to conduct comprehensive research on the following company by thoroughly exploring their website and extracting detailed information that matches our exact database schema.

**COMPANY TO RESEARCH:**
Website: ${websiteUrl}
Company: ${vendor.company_name}

**RESEARCH METHODOLOGY:**
1. Browse and analyze ALL accessible pages of the website including:
   - Homepage and main navigation sections
   - About Us, Company, Team, Leadership pages
   - Products, Services, Solutions pages
   - Customer stories, case studies, testimonials
   - News, Press releases, Blog posts
   - Careers, Jobs, Culture pages
   - Investor relations, Funding announcements
   - Resource center, whitepapers, documentation
   - Contact, locations, office information

2. Look for additional information sources:
   - Sub-domains (blog.*, news.*, investors.*)
   - Footer links and legal pages
   - Product documentation and technical specs
   - Partner and integration pages
   - Social proof and customer logos

**EXTRACTION GUIDELINES:**
- Extract ONLY factual information found on the website
- When direct information isn't available, use contextual clues and industry standards
- For missing data, use appropriate null values or empty arrays
- Rewrite all content in neutral, professional tone (avoid direct quotes)
- Cross-reference information across multiple pages for accuracy
- Look for implied information (e.g., enterprise focus from customer logos)

**OUTPUT REQUIREMENTS:**
Return ONLY valid JSON that matches our database schema exactly. No additional text, explanations, or questions.

**DETAILED FIELD INSTRUCTIONS:**

{
  "company_name": "Extract official company name from header, about page, or legal sections",
  
  "headquarters": "Look in contact/about pages for main office location. Format: 'City, State/Province, Country'",
  
  "founding_year": "Check about page, timeline, company history sections. Use numeric year only",
  
  "company_type": "Determine from about page, legal info, or context. Options: 'Private', 'Public', 'Startup', 'Subsidiary', 'Non-profit'",
  
  "description": "Write comprehensive 2-3 sentence description combining mission, main business, and market focus. Extract from about page, homepage hero section, or company overview",
  
  "core_services": "Array of 3-8 main services/products. Check services page, navigation menu, product sections. Be specific (e.g., 'Cloud Infrastructure Management' not just 'Cloud Services')",
  
  "customers": "Array of target customer types. Look for customer pages, case studies, 'who we serve' sections. Include business size, industry, or role (e.g., 'Enterprise Healthcare Organizations', 'Mid-market SaaS Companies')",
  
  "specialties": "Array of 3-6 technical specialties, methodologies, or niche focuses. Check technology pages, expertise sections, certifications, or technical documentation",
  
  "key_features": "Array of 4-8 main product/service features. Extract from product pages, feature lists, or capability sections. Focus on functional capabilities",
  
  "key_benefits": "Array of 4-8 business benefits customers receive. Look for outcomes, ROI statements, value propositions. Focus on business impact",
  
  "competitive_advantages": "Array of 2-5 unique differentiators. Check 'why choose us', competitive comparison pages, or unique selling propositions",
  
  "competitors": "Array of 2-6 main competitor company names. Look for competitive comparison pages, industry analysis, press releases mentioning rivals, or inferred from market positioning",
  
  "notable_customers": "Array of recognizable customer names from case studies, testimonials, customer logos, or press releases. Include company names only",
  
  "website_url": "${websiteUrl}",
  
  "funding_stage": "Check press releases, about page, investor section. Options: 'Bootstrap', 'Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Private Equity', 'Public', 'Acquired'",
  
  "total_funding": "Look for funding announcements, press releases, or investor pages. Format as '$X million' or '$X billion'. Use 'Not disclosed' if private",
  
  "key_investors": "Array of investor names from press releases, about page, or investor sections. Include VC firms, strategic investors, or notable individual investors",
  
  "business_model": "Description of how the company makes money (e.g., 'SaaS subscription', 'Transaction-based', 'Professional services')",
  
  "employee_count_range": "Estimate from careers page, team size, or about section (e.g., '50-100', '500-1000')",
  
  "geographic_presence": "Description of geographic coverage or markets served",
  
  "contact_email": "Primary contact email if available",
  
  "contact_phone": "Main phone number if listed",
  
  "contact_address": "Full mailing address if provided",
  
  "linkedin_url": "LinkedIn company page URL if found",
  
  "twitter_url": "Twitter/X profile URL if found",
  
  "certifications": "Array of industry certifications, compliance standards, or security badges found",
  
  "awards_recognition": "Array of awards, recognition, or industry rankings found on the site",
  
  "office_locations": "Array of office locations from contact/locations pages",
  
  "partnerships": "Array of strategic partners, integrations, or technology alliances mentioned",
  
  "tech_stack": "Array of core technologies used in their platform",

  "performance_metrics": {
    "annual_revenue": "Extract revenue figures if disclosed (format: '$X million')",
    "customer_count": "Number of customers/clients served if mentioned",
    "market_share": "Market position percentage if disclosed",
    "growth_rate": "Annual growth rate if mentioned (format: 'X% YoY')",
    "retention_rate": "Customer retention percentage if disclosed",
    "transactions_processed": "Volume metrics if applicable (e.g., 'X million transactions/month')",
    "uptime_sla": "Service level agreement percentage if mentioned"
  },
  
  "research_data": {
    "data_sources": "Array listing specific website sections explored (e.g., ['About Page', 'Product Documentation', 'Press Releases', 'Customer Case Studies'])",
    "confidence_level": "Rate data confidence: 'high' (comprehensive website info), 'medium' (some gaps), or 'low' (limited information)",
    "verification_status": "'verified' if cross-referenced across multiple pages, 'unverified' if single source",
    "research_quality": "'comprehensive' if 5+ pages analyzed, 'standard' if 3-4 pages, 'limited' if 1-2 pages only",
    "last_updated": "Current timestamp in ISO format",
    "website_structure": "Brief description of website organization and information availability",
    "data_completeness": "Percentage estimate of how much required information was found (e.g., '85%')",
    "notable_findings": "Array of interesting discoveries not captured in standard fields"
  },
  
  "company_data": {
    "target_market_size": "Description of addressable market if mentioned",
    "industry_focus": "Primary industry verticals served",
    "recent_news": "Array of recent announcements or news",
    "website_structure": "Brief description of website organization",
    "notable_findings": "Array of interesting discoveries not captured in standard fields"
  }
}

**QUALITY VALIDATION:**
Before returning JSON, verify:
- All required string fields have meaningful content (minimum 10 characters)
- Arrays contain 3+ relevant items where specified
- No placeholder text or generic descriptions
- Dates are properly formatted
- Company name matches website branding
- Information is factual and website-sourced
- Competitors array includes actual competitor company names
- Performance metrics are quantifiable when available

**CRITICAL INSTRUCTIONS:**
- Use exact field names shown above - do not modify any field names
- Return ONLY the JSON object - no additional text, markdown, or explanations
- If information is unavailable, use null for strings/numbers, empty arrays [] for arrays, empty objects {} for objects
- Be thorough - spend time exploring the website comprehensively
- Focus on accuracy over speed - verify information across multiple pages

Begin your comprehensive website analysis now and return the complete JSON object.`;
};

import { useIsMobile } from '@/hooks/use-mobile';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PerformanceMetrics } from '@/components/vendors/PerformanceMetrics';

export default function VendorDetail() {
  const { slugname: category, vendorSlug } = useParams<{ slugname: string; vendorSlug: string }>();
  const navigate = useNavigate();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [pasteContent, setPasteContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<any>(null);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();
  
  const { data: vendor, isLoading, error } = useVendorBySlug(vendorSlug || '');
  
  const { togglePublishStatus, getPublicUrl, isPublishing } = useVendorPublish({
    vendorId: vendor?.id || '',
    vendorSlug: vendorSlug || '',
    category: category || ''
  });

  console.log('VendorDetail params:', { category, vendorSlug });
  console.log('Available categories:', Object.keys(VENDOR_CATEGORIES));
  console.log('Category exists:', category && VENDOR_CATEGORIES[category as keyof typeof VENDOR_CATEGORIES]);

  if (!category || !vendorSlug) {
    console.log('Missing required params, redirecting to 404');
    return <Navigate to="/404" replace />;
  }

  // Check if category exists, if not, use a default fallback
  const categoryConfig = VENDOR_CATEGORIES[category as keyof typeof VENDOR_CATEGORIES] || {
    title: `${category.charAt(0).toUpperCase() + category.slice(1)} Companies`,
    description: `Analysis of ${category} vendors, their capabilities, funding, and market positioning for competitive intelligence research.`
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">Loading vendor details...</div>
        </div>
      </PageLayout>
    );
  }

  if (error || !vendor) {
    console.log('Vendor not found or error:', error);
    return <Navigate to="/404" replace />;
  }

  const generateAdvancedPrompt = () => {
    if (!vendor.website_url) {
      toast({
        title: "Error",
        description: "This vendor doesn't have a website URL available.",
        variant: "destructive",
      });
      return;
    }

    const prompt = generateVendorPrompt(vendor.website_url, vendor);
    setGeneratedPrompt(prompt);
    setShowPrompt(true);
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    toast({
      title: "Copied!",
      description: "Advanced research prompt copied to clipboard.",
    });
  };

  const generateInvestorResearchPrompt = (investors: string[], companyName: string) => {
    const prompt = `You are an expert investment research analyst. Research these specific venture capital and investment firms that have invested in ${companyName}. For each firm, extract comprehensive information that matches our investor database schema.

**SPECIFIC FIRMS TO RESEARCH:**
${investors.map(investor => `- ${investor}`).join('\n')}

**RESEARCH METHODOLOGY:**
1. For each firm listed above, research from multiple sources:
   - Official firm websites and about pages
   - Crunchbase, PitchBook, and investment databases
   - Recent news and press releases
   - LinkedIn profiles of key partners
   - Portfolio company pages and case studies
   - SEC filings (if applicable)

2. Focus specifically on these firms since they've shown interest in ${companyName}'s sector

**OUTPUT REQUIREMENTS:**
Return ONLY valid JSON array with detailed information for each of these specific investors. Each record must match our database schema exactly.

**DETAILED FIELD INSTRUCTIONS:**
[
  {
    "company_name": "Official name of the investment firm",
    "address": "Street address of main office (if available)",
    "city": "Primary office city",
    "state": "State/Province code (e.g., 'CA', 'NY')",
    "zip": "ZIP/Postal code",
    "website": "Primary website URL",
    "sector_focus": ["Array of investment sectors", "based on portfolio companies"],
    "stage": "Primary investment stage (e.g., 'Series A', 'Growth Equity', 'Early Stage')",
    "check_size_min": 10, // Minimum investment size in millions (numeric only)
    "check_size_max": 100, // Maximum investment size in millions (numeric only)
    "latest_fund_name": "Name of most recent fund",
    "latest_fund_year": 2023, // Year of latest fund (numeric)
    "latest_fund_size": 500, // Fund size in millions (numeric only)
    "total_aum": 2000, // Total assets under management in millions (numeric only)
    "lead_partner": "Name and title of key partner",
    "contact_email": "General contact email"
  }
]

**SPECIFIC RESEARCH FOCUS:**
- Since these firms invested in ${companyName}, look for their investment thesis in related sectors
- Check if they've made other investments in similar companies
- Look for their typical check sizes and stage preferences
- Find recent fund announcements and portfolio activity
- Get accurate contact information and key partner details

Research all ${investors.length} firms listed above and return comprehensive data for each one.`;

    setGeneratedPrompt(prompt);
    setIsPromptModalOpen(true);
    
    toast({
      title: "Research Prompt Generated", 
      description: `Generated targeted research prompt for ${investors.length} investor(s)`,
    });
  };

  const openPasteModal = () => {
    setIsPasteOpen(true);
    setPasteContent("");
  };

  const validateVendorData = (data: any): boolean => {
    // Check for required fields that should be present in ChatGPT response
    const requiredStringFields = ['company_name', 'description', 'headquarters'];
    const requiredArrayFields = ['core_services', 'specialties', 'customers'];
    
    for (const field of requiredStringFields) {
      if (!data[field] || typeof data[field] !== 'string') {
        return false;
      }
    }
    
    for (const field of requiredArrayFields) {
      if (!data[field] || !Array.isArray(data[field])) {
        return false;
      }
    }
    
    return true;
  };

  const processJsonData = async () => {
    if (!pasteContent.trim()) {
      toast({
        title: "No Data",
        description: "Please paste JSON data first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-funding-json', {
        body: { rawJson: pasteContent }
      });

      if (error) throw error;

      setProcessingResult(data);
      if (data.success) {
        setProcessedData(data.cleanedData);
        const fixCount = data.fixes?.length || 0;
        const warningCount = data.warnings?.length || 0;
        const aiUsed = data.aiCleaningUsed ? " (AI-powered)" : "";
        
        toast({
          title: `JSON Processed Successfully${aiUsed}`,
          description: `${fixCount} issues fixed, ${warningCount} warnings`,
        });
      } else {
        toast({
          title: "Processing Failed",
          description: `${data.errors?.length || 0} errors found`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing JSON:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process JSON data",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const submitPastedData = async () => {
    const dataToSubmit = processedData || pasteContent;
    
    try {
      let jsonData;
      if (processedData) {
        jsonData = processedData;
      } else {
        jsonData = JSON.parse(dataToSubmit);
        
        if (!validateVendorData(jsonData)) {
          toast({
            title: "Invalid Data Structure",
            description: "The JSON doesn't contain required vendor fields. Try processing it first.",
            variant: "destructive",
          });
          return;
        }
      }

      // Map ChatGPT response to vendor fields with improved data handling
      const vendorUpdate: Partial<Vendor> = {
        // Core company info
        company_name: jsonData.company_name || vendor?.company_name,
        description: jsonData.description || vendor?.description,
        headquarters: jsonData.headquarters || vendor?.headquarters,
        founding_year: jsonData.founding_year || vendor?.founding_year,
        company_type: jsonData.company_type || vendor?.company_type,
        
        // Services and capabilities
        core_services: jsonData.core_services || vendor?.core_services || [],
        specialties: jsonData.specialties || vendor?.specialties || [],
        customers: jsonData.customers || vendor?.customers || [],
        key_features: jsonData.key_features || vendor?.key_features || [],
        key_benefits: jsonData.key_benefits || vendor?.key_benefits || [],
        competitive_advantages: jsonData.competitive_advantages || vendor?.competitive_advantages || [],
        notable_customers: jsonData.notable_customers || vendor?.notable_customers || [],
        
        // Competitors - now properly handled
        competitors: jsonData.competitors || vendor?.competitors || [],
        
        // Funding info
        funding_stage: jsonData.funding_stage || vendor?.funding_stage,
        total_funding: jsonData.total_funding || vendor?.total_funding,
        key_investors: jsonData.key_investors || vendor?.key_investors || [],
        
        // Performance metrics - now properly structured
        performance_metrics: jsonData.performance_metrics || vendor?.performance_metrics || null,
        
        // Extract new direct fields from JSON
        business_model: jsonData.business_model || vendor?.business_model,
        employee_count_range: jsonData.employee_count_range || vendor?.employee_count_range,
        geographic_presence: jsonData.geographic_presence || vendor?.geographic_presence,
        contact_email: jsonData.contact_email || vendor?.contact_email,
        contact_phone: jsonData.contact_phone || vendor?.contact_phone,
        contact_address: jsonData.contact_address || vendor?.contact_address,
        linkedin_url: jsonData.linkedin_url || vendor?.linkedin_url,
        twitter_url: jsonData.twitter_url || vendor?.twitter_url,
        certifications: jsonData.certifications || vendor?.certifications || [],
        awards_recognition: jsonData.awards_recognition || vendor?.awards_recognition || [],
        office_locations: jsonData.office_locations || vendor?.office_locations || [],
        partnerships: jsonData.partnerships || vendor?.partnerships || [],
        tech_stack: jsonData.tech_stack || vendor?.tech_stack || [],
        
        // Research data - flattened structure to match database schema
        research_data: {
          ...vendor?.research_data,
          // Store the complete ChatGPT response for reference
          chatgpt_response: jsonData,
          // Extract research metadata to top level
          data_sources: jsonData.research_data?.data_sources || [],
          confidence_level: jsonData.research_data?.confidence_level || 'medium',
          verification_status: jsonData.research_data?.verification_status || 'unverified',
          research_quality: jsonData.research_data?.research_quality || 'standard',
          last_updated: new Date().toISOString(),
          website_structure: jsonData.research_data?.website_structure || '',
          data_completeness: jsonData.research_data?.data_completeness || '0%',
          notable_findings: jsonData.research_data?.notable_findings || []
        },
        
        // Company data - now only contains unstructured fields
        company_data: {
          ...vendor?.company_data,
          ...jsonData.company_data,
          // Keep only non-extracted fields
          contact_info: {
            ...vendor?.company_data?.contact_info,
            ...jsonData.company_data?.contact_info
          },
          social_media: {
            ...vendor?.company_data?.social_media,
            ...jsonData.company_data?.social_media
          }
        }
      };

      // Update vendor in database
      const { error } = await supabase
        .from('vendors')
        .update(vendorUpdate)
        .eq('id', vendor?.id);

      if (error) {
        throw error;
      }
      
      // Show success message
      toast({
        title: "Vendor Data Updated!",
        description: "ChatGPT response has been processed and vendor data updated successfully.",
      });
      
      // Close modal and clear content
      setIsPasteOpen(false);
      setPasteContent("");
      
      // Refresh the page to show updated data
      window.location.reload();
      
    } catch (error) {
      console.error('Error processing JSON:', error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Please paste valid JSON data from ChatGPT response.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVendor = async () => {
    if (!vendor) return;

    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to delete vendors.",
          variant: "destructive",
        });
        return;
      }

      // Check if user can delete this vendor (admin or owner)
      if (!isAdmin && vendor.user_id !== user.id) {
        toast({
          title: "Permission Denied",
          description: "You can only delete vendors you created.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendor.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Vendor Deleted",
        description: `${vendor.company_name} has been permanently deleted.`,
      });

      // Invalidate React Query cache to ensure the vendor list is updated
      await queryClient.invalidateQueries({ queryKey: ["vendors"] });
      await queryClient.invalidateQueries({ queryKey: ["vendor", vendorSlug] });

      // Navigate back to the vendors list
      navigate(`/vendors/${category}`);
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete vendor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getCompanyTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'Public': return 'default';
      case 'Private': return 'secondary';
      case 'Startup': return 'destructive';
      case 'Subsidiary': return 'outline';
      default: return 'secondary';
    }
  };

  const pageTitle = `${vendor.company_name} - ${categoryConfig.title} Vendor Profile`;
  const pageDescription = `${vendor.description} ${vendor.founding_year ? `Founded in ${vendor.founding_year}, ` : ''}${vendor.company_name} offers ${vendor.core_services.join(', ')} for ${vendor.customers.join(', ')}.`;

  return (
    <PageLayout>
      <Helmet>
        <title>{pageTitle} | Competitive Intelligence</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={`${vendor.company_name}, ${categoryConfig.title}, ${vendor.specialties.join(', ')}, ${vendor.core_services.join(', ')}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content="https://265639ae-98fe-47f5-888f-bed563c20e8d.lovableproject.com/og-images/default-hero.png" />
        <meta property="og:url" content={`https://265639ae-98fe-47f5-888f-bed563c20e8d.lovableproject.com/vendors/${category}/${vendorSlug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Jordan's Portfolio" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content="https://265639ae-98fe-47f5-888f-bed563c20e8d.lovableproject.com/og-images/default-hero.png" />
        <link rel="canonical" href={`/vendors/${category}/${vendorSlug}`} />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": vendor.company_name,
            "description": vendor.description,
            "foundingDate": vendor.founding_year?.toString(),
            "address": {
              "@type": "PostalAddress",
              "addressLocality": vendor.headquarters
            },
            "url": vendor.website_url,
            "knowsLanguage": "en-US",
            "industry": categoryConfig.title
          })}
        </script>
      </Helmet>

      <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Advanced Research Prompt for {vendor.company_name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Copy this prompt and use it with ChatGPT or Claude for detailed vendor research:
            </div>
            
            <Textarea
              value={generatedPrompt}
              readOnly
              className="min-h-[300px] sm:min-h-[400px] font-mono text-xs"
            />
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPrompt(false)}
                className="flex-1 order-2 sm:order-1"
              >
                Close
              </Button>
              <Button
                onClick={copyPrompt}
                className="flex-1 order-1 sm:order-2"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Prompt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasteOpen} onOpenChange={setIsPasteOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Paste ChatGPT Response</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Paste the JSON response from ChatGPT here. Use "Process JSON" to automatically fix common formatting issues using AI-powered cleaning.
            </div>
            
            <Textarea
              value={pasteContent}
              onChange={(e) => {
                setPasteContent(e.target.value);
                setProcessedData(null);
                setProcessingResult(null);
              }}
              placeholder="Paste your ChatGPT JSON response here..."
              className="min-h-[150px] font-mono text-sm"
            />

            {processingResult && (
              <div className="space-y-2">
                {processingResult.aiCleaningUsed && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <h4 className="font-medium text-blue-900 mb-2">🤖 AI-Powered Cleaning Used</h4>
                    {processingResult.aiReasoning && (
                      <p className="text-sm text-blue-800 whitespace-pre-wrap">{processingResult.aiReasoning}</p>
                    )}
                  </div>
                )}

                {processingResult.fixes && processingResult.fixes.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <h4 className="font-medium text-green-900 mb-2">✅ Fixes Applied ({processingResult.fixes.length})</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      {processingResult.fixes.map((fix: string, idx: number) => (
                        <li key={idx}>• {fix}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {processingResult.warnings && processingResult.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <h4 className="font-medium text-yellow-900 mb-2">⚠️ Warnings ({processingResult.warnings.length})</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      {processingResult.warnings.map((warning: string, idx: number) => (
                        <li key={idx}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {processingResult.errors && processingResult.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <h4 className="font-medium text-red-900 mb-2">❌ Errors ({processingResult.errors.length})</h4>
                    <ul className="text-sm text-red-800 space-y-2">
                      {processingResult.errors.map((error: string, idx: number) => (
                        <li key={idx} className="flex items-center justify-between gap-2">
                          <span className="flex-1">• {error}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => processJsonData()}
                            disabled={isProcessing}
                            className="h-7 px-2 text-xs border-red-300 hover:bg-red-100 text-red-700"
                          >
                            {isProcessing ? "Fixing..." : "Fix Error"}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {processedData && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Processed Data Preview:</h4>
                <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(processedData, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsPasteOpen(false)}
                className="flex-1 order-3 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={processJsonData}
                disabled={!pasteContent.trim() || isProcessing}
                className="flex-1 order-1 sm:order-2"
              >
                {isProcessing ? "Processing..." : "🤖 Process JSON (AI-Powered)"}
              </Button>
              <Button
                onClick={submitPastedData}
                disabled={!pasteContent.trim() && !processedData}
                className="flex-1 order-2 sm:order-3"
              >
                {processedData ? "Submit Processed Data" : "Submit Raw Data"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Investor Research Prompt Modal */}
      <Dialog open={isPromptModalOpen} onOpenChange={setIsPromptModalOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Investor Research Prompt</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Copy this prompt and use it with ChatGPT or Claude to research these specific investors:
            </div>
            
            <Textarea
              value={generatedPrompt}
              readOnly
              className="min-h-[300px] sm:min-h-[400px] font-mono text-xs"
            />
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsPromptModalOpen(false)}
                className="flex-1 order-2 sm:order-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(generatedPrompt);
                  toast({
                    title: "Copied!",
                    description: "Investor research prompt copied to clipboard.",
                  });
                }}
                className="flex-1 order-1 sm:order-2"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Prompt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto py-4 sm:py-8 px-4">
        <div className="space-y-4 sm:space-y-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/" className="text-sm">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/vendors/${category}`} className="text-sm">{categoryConfig.title}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm font-medium">{vendor.company_name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
                  {vendor.website_url ? (
                    <a 
                      href={vendor.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors cursor-pointer hover:underline hover:decoration-green-500 hover:decoration-2 hover:underline-offset-4"
                    >
                      {vendor.company_name}
                    </a>
                  ) : (
                    <span className="hover:underline hover:decoration-green-500 hover:decoration-2 hover:underline-offset-4 transition-all duration-200 cursor-default">
                      {vendor.company_name}
                    </span>
                  )}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm sm:text-base text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{vendor.headquarters}</span>
                  </div>
                  {vendor.founding_year && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>Founded {vendor.founding_year}</span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                    {vendor.company_type}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:flex-shrink-0">
                {/* Admin-only Publish Button */}
                {isAdmin && (
                  <Button
                    variant={vendor.status === 'published' ? "outline" : "default"}
                    size={isMobile ? "icon" : "default"}
                    onClick={() => togglePublishStatus(vendor.status || 'draft')}
                    disabled={isPublishing}
                    className="min-h-[44px]"
                    aria-label={vendor.status === 'published' ? "Unpublish vendor" : "Publish vendor"}
                  >
                    {vendor.status === 'published' ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        {!isMobile && <span className="ml-2">Unpublish</span>}
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4" />
                        {!isMobile && <span className="ml-2">Publish</span>}
                      </>
                    )}
                  </Button>
                )}
                
                {vendor.website_url && (
                  <>
                    <Button asChild size={isMobile ? "icon" : "default"} className="min-h-[44px]">
                      <a 
                        href={vendor.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        aria-label={isMobile ? `Visit ${vendor.company_name} website` : undefined}
                      >
                        <ExternalLink className="h-4 w-4" />
                        {!isMobile && <span className="ml-2">Visit Website</span>}
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={generateAdvancedPrompt}
                      aria-label="Generate Research Prompt"
                      className="min-h-[44px] min-w-[44px]"
                    >
                      <Lightbulb className="h-4 w-4" />
                    </Button>
                     <Button
                       variant="outline"
                       size="icon"
                       onClick={openPasteModal}
                       aria-label="Paste ChatGPT JSON Response"
                       className="min-h-[44px] min-w-[44px]"
                     >
                       <Clipboard className="h-4 w-4" />
                     </Button>
                     
                     {/* Delete Button with Confirmation */}
                     <AlertDialog>
                       <AlertDialogTrigger asChild>
                         <Button
                           variant="outline"
                           size="icon"
                           aria-label={`Delete ${vendor.company_name}`}
                           className="min-h-[44px] min-w-[44px] border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                           disabled={isDeleting}
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </AlertDialogTrigger>
                       <AlertDialogContent>
                         <AlertDialogHeader>
                           <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
                           <AlertDialogDescription>
                             Are you sure you want to permanently delete "{vendor.company_name}"? 
                             This action cannot be undone and will remove all associated data.
                           </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                           <AlertDialogCancel>Cancel</AlertDialogCancel>
                           <AlertDialogAction
                             onClick={handleDeleteVendor}
                             className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                             disabled={isDeleting}
                           >
                             {isDeleting ? "Deleting..." : "Delete"}
                           </AlertDialogAction>
                         </AlertDialogFooter>
                       </AlertDialogContent>
                     </AlertDialog>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            <div className="xl:col-span-2 space-y-6 lg:space-y-8">
              {/* Product Jobs Card - Admin Only - Updated to pass vendor prop */}
              <ProductJobsCard vendorId={vendor.id} vendor={vendor} />
              
              <EditableSection 
                vendor={vendor} 
                config={companyOverviewConfig} 
                canEdit={isAdmin}
              />
              
              <EditableSection 
                vendor={vendor} 
                config={servicesConfig} 
                canEdit={isAdmin}
              />
              
              <EditableSection 
                vendor={vendor} 
                config={customersConfig} 
                canEdit={isAdmin}
              />
              
              <EditableSection 
                vendor={vendor} 
                config={specializationsConfig} 
                canEdit={isAdmin}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <EditableSection 
                  vendor={vendor} 
                  config={featuresConfig} 
                  canEdit={isAdmin}
                />

                <EditableSection 
                  vendor={vendor} 
                  config={benefitsConfig} 
                  canEdit={isAdmin}
                />
              </div>

              <EditableSection 
                vendor={vendor} 
                config={notableCustomersConfig} 
                canEdit={isAdmin}
              />

              <EditableSection 
                vendor={vendor} 
                config={competitiveConfig} 
                canEdit={isAdmin}
              />

              <EditableSection 
                vendor={vendor} 
                config={competitorsConfig} 
                canEdit={isAdmin}
              />

              <EditableSection 
                vendor={vendor} 
                config={{
                  ...fundingConfig,
                  actionButtons: [
                    {
                      label: 'Research Investors',
                      icon: Download,
                      onClick: () => generateInvestorResearchPrompt(vendor.key_investors, vendor.company_name),
                      condition: isAdmin && vendor.key_investors && vendor.key_investors.length > 0
                    },
                    {
                      label: 'Paste ChatGPT Response',
                      icon: Clipboard,
                      onClick: openPasteModal,
                      condition: isAdmin
                    }
                  ]
                }}
                canEdit={isAdmin}
              />

              <EditableSection 
                vendor={vendor} 
                config={businessConfig} 
                canEdit={isAdmin}
              />

              <EditableSection 
                vendor={vendor} 
                config={contactConfig} 
                canEdit={isAdmin}
              />

              <EditableSection 
                vendor={vendor} 
                config={socialConfig} 
                canEdit={isAdmin}
              />

              <EditableSection 
                vendor={vendor} 
                config={recognitionConfig} 
                canEdit={isAdmin}
              />

              <EditableSection 
                vendor={vendor} 
                config={technologyConfig} 
                canEdit={isAdmin}
              />

              <VendorImageGallery 
                vendor={vendor} 
                canEdit={isAdmin}
              />

              {vendor.performance_metrics && (
                <PerformanceMetrics metrics={vendor.performance_metrics} />
              )}

              <VendorRichData 
                companyData={vendor.company_data}
                researchData={vendor.research_data}
              />
            </div>

            <div className="space-y-4 lg:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Company Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vendor.founding_year && (
                    <>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Founded</p>
                        <p className="text-xl sm:text-2xl font-bold">{vendor.founding_year}</p>
                      </div>
                      <Separator />
                    </>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Headquarters</p>
                    <p className="font-medium text-sm sm:text-base break-words">{vendor.headquarters}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Company Type</p>
                    <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded inline-block mt-1">
                      {vendor.company_type}
                    </span>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
