import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VENDOR_CATEGORIES } from "@/types/vendor";

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVendorAdded: () => void;
  secAccessionnumber?: string;
}

export const AddVendorModal = ({ isOpen, onClose, onVendorAdded, secAccessionnumber }: AddVendorModalProps) => {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const { toast } = useToast();

  const generateAdvancedPrompt = () => {
    if (!websiteUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a website URL first.",
        variant: "destructive",
      });
      return;
    }

    const prompt = `🔬 ADVANCED VENDOR INTELLIGENCE EXTRACTION SYSTEM 🔬

====================================================================
MISSION: Deep-dive research on ${websiteUrl} to extract comprehensive vendor intelligence data
OBJECTIVE: Generate a complete vendor profile suitable for competitive analysis and procurement evaluation
OUTPUT FORMAT: RAW JSON ONLY (NO markdown blocks, NO \`\`\`json wrappers)
====================================================================

RESEARCH INSTRUCTIONS:
1. Visit the company's main website, about pages, product pages, pricing pages, and press releases
2. Look for investor relations, funding announcements, customer case studies, and testimonials  
3. Examine leadership team backgrounds, company timeline, and competitive positioning
4. Analyze product features, benefits, target markets, and business model
5. Cross-reference information across multiple sources for accuracy
6. Focus on factual, verifiable information over marketing language

REQUIRED JSON STRUCTURE (EXACT DATABASE SCHEMA):
{
  "company_name": "",
  "headquarters": "",
  "founding_year": null,
  "company_type": "",
  "description": "",
  "core_services": [],
  "specialties": [],
  "customers": [],
  "key_features": [],
  "key_benefits": [],
  "website_url": "${websiteUrl}",
  "source_url": "${websiteUrl}",
  "funding_stage": null,
  "total_funding": null,
  "key_investors": [],
  "competitive_advantages": [],
  "notable_customers": [],
  "business_model": null,
  "employee_count_range": null,
  "geographic_presence": null,
  "contact_email": null,
  "contact_phone": null,
  "contact_address": null,
  "linkedin_url": null,
  "twitter_url": null,
  "certifications": [],
  "awards_recognition": [],
  "office_locations": [],
  "partnerships": [],
  "tech_stack": [],
  "performance_metrics": {},
  "research_data": {},
  "company_data": {},
  "status": "draft"
}

====================================================================
DETAILED MAPPING GUIDE:
====================================================================

COMPANY_NAME: Official legal business name or primary brand name (string)

HEADQUARTERS: City, State/Province, Country format (e.g., "San Francisco, CA, USA") (string)

FOUNDING_YEAR: 4-digit year as number (e.g., 2015) or null if unknown (number)

COMPANY_TYPE: Business category (string). Examples:
- "Private Technology Company"
- "Public Healthcare Company" 
- "SaaS Provider"
- "Consulting Firm"
- "Healthcare Technology Vendor"

DESCRIPTION: 150-300 word comprehensive overview (string)

CORE_SERVICES: Primary service offerings (array of strings, 3-8 items)
- Use specific, technical terminology
- Focus on main revenue-generating services

SPECIALTIES: Specific expertise areas or niche focuses (array of strings, 3-6 items)
- Technical specializations
- Industry verticals
- Regulatory compliance areas

CUSTOMERS: Customer segments or types served (array of strings, 2-5 items)
- Be specific about customer categories
- Include size descriptors when relevant

KEY_FEATURES: Product/service features that differentiate the vendor (array of strings, 4-8 items)
- Technical capabilities
- Platform features
- Integration abilities

KEY_BENEFITS: Business outcomes customers achieve (array of strings, 4-8 items)
- Focus on measurable benefits
- Include efficiency, cost, or performance improvements

FUNDING_STAGE: Current funding status (string or null). Examples:
- "Bootstrap/Self-Funded"
- "Series A/B/C/D/E"
- "Private Equity Backed"
- "Public Company"

TOTAL_FUNDING: Total funding raised (string format: "$XXM" or "$XXB") or null

KEY_INVESTORS: Major investors, VCs, or parent companies (array of strings)

COMPETITIVE_ADVANTAGES: What sets them apart from competitors (array of strings, 3-6 items)
- Unique technology
- Market position
- Strategic partnerships

NOTABLE_CUSTOMERS: Specific named customers (array of strings)
- Public references only
- Customer case studies mentioned

BUSINESS_MODEL: Revenue model (string). Examples:
- "SaaS subscription model"
- "Transaction-based fees"
- "Professional services"
- "Hybrid subscription and services"

EMPLOYEE_COUNT_RANGE: Company size estimate (string). Examples:
- "1-10"
- "50-100"
- "500-1000"
- "1000+"

GEOGRAPHIC_PRESENCE: Geographic coverage (string). Examples:
- "United States only"
- "North America"
- "Global presence in 50+ countries"

CONTACT_EMAIL: Primary business contact email (string)

CONTACT_PHONE: Main business phone number (string)

CONTACT_ADDRESS: Full business address (string)

LINKEDIN_URL: LinkedIn company page URL (string)

TWITTER_URL: Twitter/X company profile URL (string)

CERTIFICATIONS: Industry certifications and compliance standards (array of strings)

AWARDS_RECOGNITION: Awards, recognitions, rankings received (array of strings)

OFFICE_LOCATIONS: Physical office locations (array of strings)

PARTNERSHIPS: Strategic partnerships and integrations (array of strings)

TECH_STACK: Core technologies used in platform/products (array of strings)

PERFORMANCE_METRICS: Key company metrics (object):
{
  "annual_revenue": "estimate if available", 
  "customer_count": "number if known",
  "market_share": "percentage if available",
  "growth_rate": "annual growth rate if known",
  "retention_rate": "customer retention percentage"
}

RESEARCH_DATA: Research metadata (object):
{
  "research_date": "2024-07-20",
  "data_sources": ["website", "press_releases"],
  "confidence_level": "high/medium/low",
  "verification_status": "verified/unverified",
  "research_quality": "comprehensive/standard/limited",
  "data_completeness": "85%"
}

COMPANY_DATA: Additional unstructured data (object):
{
  "target_market_size": "Enterprise/Mid-Market/Small Business",
  "industry_focus": "Healthcare/Financial/Technology/Multi-Industry",
  "recent_news": ["recent announcements or news"],
  "website_structure": "description of site organization",
  "notable_findings": ["interesting discoveries"]
}

====================================================================
CRITICAL OUTPUT REQUIREMENTS:
====================================================================

1. RETURN RAW JSON ONLY - No markdown blocks, no \`\`\`json wrappers, no explanatory text
2. ALL STRING VALUES must use straight quotes (") not smart quotes (" ")
3. founding_year MUST be a number (e.g., 2015) not a string ("2015")
4. Use null (not "null" string) for truly unknown values
5. Use empty arrays [] for unknown list fields
6. Use empty objects {} for unknown object fields
7. Ensure all JSON is valid - test at jsonlint.com if unsure
8. Do not include fields beyond the specified schema
9. status field must always be "draft"

====================================================================
FALLBACK PROTOCOLS:
====================================================================

If specific information cannot be found:
- company_name: Use domain name without .com if no other name found
- headquarters: Research company registration/press releases for location
- Use null for unknown single values
- Use empty arrays [] for unknown list values
- Use empty objects {} for unknown object fields
- Be conservative - prefer null/empty over guessing

====================================================================
QUALITY ASSURANCE CHECKLIST:
====================================================================
Before submitting, verify:
✓ JSON is valid and properly formatted
✓ All required commas and brackets in place  
✓ founding_year is number type, not string
✓ No trailing commas in objects/arrays
✓ All strings use straight quotes
✓ Output contains ONLY the JSON, no other text
✓ Research reflects current/recent company information
✓ Information is factual and verifiable
✓ All field names match the exact database schema

BEGIN RESEARCH AND EXTRACTION FOR: ${websiteUrl}`;

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

  const handleSubmit = async () => {
    if (!websiteUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a website URL.",
        variant: "destructive",
      });
      return;
    }

    if (!category) {
      toast({
        title: "Error", 
        description: "Please select a category.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Normalize URL and extract company name
      let normalizedUrl = websiteUrl.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }
      
      const urlObj = new URL(normalizedUrl);
      const domain = urlObj.hostname.replace('www.', '');
      const companyName = domain.split('.')[0];
      
      // Generate slug from company name
      const slug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Create basic vendor record
      const insertData = {
        company_name: companyName.charAt(0).toUpperCase() + companyName.slice(1),
        slug: slug,
        website_url: normalizedUrl,
        source_url: normalizedUrl,
        status: 'draft',
        company_type: 'Technology Company',
        description: `${companyName.charAt(0).toUpperCase() + companyName.slice(1)} is a technology company providing innovative solutions.`,
        headquarters: 'Unknown',
        core_services: [],
        specialties: [],
        customers: [],
        key_features: [],
        key_benefits: [],
        key_investors: [],
        competitive_advantages: [],
        notable_customers: [],
        business_model: null,
        employee_count_range: null,
        geographic_presence: null,
        contact_email: null,
        contact_phone: null,
        contact_address: null,
        linkedin_url: null,
        twitter_url: null,
        certifications: [],
        awards_recognition: [],
        office_locations: [],
        partnerships: [],
        tech_stack: [],
        performance_metrics: {},
        research_data: {},
        company_data: {},
        user_id: user.id,
        sec_accession_number: secAccessionnumber || null,
      };

      const { error } = await supabase
        .from('vendors')
        .insert(insertData);

      if (error) {
        console.error("Database insert error:", error);
        throw error;
      }

      toast({
        title: "Success",
        description: `Vendor has been added successfully!`,
      });

      onVendorAdded();
      handleClose();
    } catch (error) {
      console.error("Error inserting vendor:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add vendor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setWebsiteUrl("");
    setCategory("");
    setShowPrompt(false);
    setGeneratedPrompt("");
    onClose();
  };

  if (showPrompt) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advanced Research Prompt</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Copy this prompt and use it with ChatGPT or Claude for detailed vendor research:
            </div>
            
            <Textarea
              value={generatedPrompt}
              readOnly
              className="min-h-[400px] font-mono text-xs"
            />
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPrompt(false)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={copyPrompt}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Prompt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="website-url">Website URL</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={generateAdvancedPrompt}
                className="h-6 w-6 p-0"
              >
                <Lightbulb className="h-4 w-4" />
              </Button>
            </div>
            <Input
              id="website-url"
              type="url"
              placeholder="https://company.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(VENDOR_CATEGORIES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Vendor"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
