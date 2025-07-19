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
}

export const AddVendorModal = ({ isOpen, onClose, onVendorAdded }: AddVendorModalProps) => {
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

REQUIRED JSON STRUCTURE:
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
  "website_url": "${websiteUrl}",
  "source_url": "${websiteUrl}",
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

====================================================================
DETAILED FIELD SPECIFICATIONS:
====================================================================

COMPANY_NAME: Official legal business name or primary brand name

HEADQUARTERS: City, State/Province, Country format (e.g., "San Francisco, CA, USA")

FOUNDING_YEAR: 4-digit year as number (e.g., 2015) or null if unknown

COMPANY_TYPE: Select most accurate category:
- "Private SaaS Company"
- "Public Technology Company" 
- "Healthcare Technology Vendor"
- "Financial Services Provider"
- "Enterprise Software Vendor"
- "Consulting Services Firm"
- "System Integrator"
- "Technology Startup"
- "Fortune 500 Company"
- Or create appropriate category based on business model

DESCRIPTION: 150-300 word comprehensive overview covering:
- What the company does
- Primary business focus
- Target market served
- Key value proposition
- Market position or unique approach

CORE_SERVICES: Primary service offerings (3-8 items):
- Use specific, technical terminology
- Focus on main revenue-generating services
- Examples: ["Revenue Cycle Management", "Clinical Documentation Improvement", "Medical Coding Services"]

SPECIALTIES: Specific expertise areas or niche focuses (3-6 items):
- Technical specializations
- Industry verticals
- Regulatory compliance areas
- Examples: ["HIPAA Compliance", "Epic EHR Integration", "Denial Management"]

CUSTOMERS: Customer segments or types served (2-5 items):
- Be specific about customer categories
- Include size descriptors when relevant
- Examples: ["Multi-Specialty Physician Groups", "Critical Access Hospitals", "Academic Medical Centers"]

KEY_FEATURES: Product/service features that differentiate the vendor (4-8 items):
- Technical capabilities
- Platform features
- Integration abilities
- Examples: ["Real-time Analytics Dashboard", "AI-Powered Coding Automation", "24/7 Support"]

KEY_BENEFITS: Business outcomes customers achieve (4-8 items):
- Focus on measurable benefits
- Include efficiency, cost, or performance improvements
- Examples: ["30% Reduction in Claim Denials", "Improved Cash Flow", "Enhanced Compliance"]

FUNDING_STAGE: Current funding status:
- "Bootstrap/Self-Funded"
- "Angel/Pre-Seed"
- "Seed Round"
- "Series A/B/C/D/E"
- "Growth Equity"
- "Private Equity Backed"
- "Public Company"
- "Acquired by [Parent Company]"

TOTAL_FUNDING: Total funding raised (format: "$XXM" or "$XXB") or null

KEY_INVESTORS: Major investors, VCs, or parent companies (if applicable)

COMPETITIVE_ADVANTAGES: What sets them apart from competitors (3-6 items):
- Unique technology
- Market position
- Strategic partnerships
- Examples: ["First-to-Market AI Technology", "Largest Customer Base", "Proprietary Integration Platform"]

PERFORMANCE_METRICS: Key company metrics as object:
{
  "employee_count": "estimate or range",
  "annual_revenue": "estimate if available", 
  "customer_count": "number if known",
  "years_in_business": "calculated from founding",
  "market_share": "percentage if available",
  "client_retention_rate": "percentage if disclosed"
}

NOTABLE_CUSTOMERS: Specific named customers or customer examples (if disclosed):
- Public references only
- Customer case studies
- Press release mentions

RESEARCH_DATA: Research metadata object:
{
  "research_date": "2024-07-19",
  "data_sources": ["website", "press_releases", "third_party"],
  "research_quality": "high/medium/low",
  "confidence_level": "high/medium/low",
  "last_updated": "most recent info date found",
  "verification_status": "verified/unverified"
}

COMPANY_DATA: Additional structured data object:
{
  "business_model": "SaaS/Professional Services/Hybrid/Other",
  "target_market": "Enterprise/Mid-Market/Small Business/All",
  "geographic_presence": "US Only/North America/Global",
  "industry_focus": "Healthcare/Financial/Technology/Multi-Industry",
  "technology_stack": ["known technologies used"],
  "certifications": ["relevant certifications"],
  "partnerships": ["key technology partners"]
}

====================================================================
CRITICAL OUTPUT REQUIREMENTS:
====================================================================

1. RETURN RAW JSON ONLY - No markdown blocks, no \`\`\`json wrappers, no explanatory text
2. ALL STRING VALUES must use straight quotes (") not smart quotes (" ")
3. founding_year MUST be a number (e.g., 2015) not a string ("2015")
4. Use null (not "null" string) for truly unknown values
5. Use empty arrays [] for unknown list fields
6. Ensure all JSON is valid - test at jsonlint.com if unsure
7. Do not include fields beyond the specified schema
8. status field must always be "draft"

====================================================================
FALLBACK PROTOCOLS:
====================================================================

If specific information cannot be found:
- company_name: Use domain name without .com if no other name found
- headquarters: Research company registration/press releases for location
- Use null for unknown single values
- Use empty arrays [] for unknown list values
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
        company_type: '',
        description: '',
        headquarters: '',
        core_services: [],
        specialties: [],
        customers: [],
        key_features: [],
        key_benefits: [],
        key_investors: [],
        competitive_advantages: [],
        notable_customers: [],
        performance_metrics: {},
        research_data: {},
        company_data: {},
        user_id: user.id,
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