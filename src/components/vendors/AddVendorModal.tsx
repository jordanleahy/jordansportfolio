import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, ExternalLink, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateVendorData, ValidationResult } from "@/utils/vendorValidation";
import { VendorPreview } from "./VendorPreview";
import { VendorQAResults } from "./VendorQAResults";

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVendorAdded: () => void;
}

type ModalMode = 'prompt' | 'json' | 'qa' | 'preview';

interface QAResult {
  qualityScore: number;
  feedback: string[];
  suggestions: string[];
  warnings: string[];
  isRecommended: boolean;
}

export const AddVendorModal = ({ isOpen, onClose, onVendorAdded }: AddVendorModalProps) => {
  const [mode, setMode] = useState<ModalMode>('prompt');
  const [companyUrl, setCompanyUrl] = useState("");
  const [cachedUrl, setCachedUrl] = useState("");
  const [jsonData, setJsonData] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [qaResult, setQaResult] = useState<QAResult | null>(null);
  const [isRunningQA, setIsRunningQA] = useState(false);
  const { toast } = useToast();

  const generatePrompt = async () => {
    if (!companyUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a company URL first.",
        variant: "destructive",
      });
      return;
    }

    setCachedUrl(companyUrl);
    setIsGenerating(true);
    
    try {
      const prompt = `🔬 ADVANCED VENDOR INTELLIGENCE EXTRACTION SYSTEM 🔬

====================================================================
MISSION: Deep-dive research on ${companyUrl} to extract comprehensive vendor intelligence data
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

BEGIN RESEARCH AND EXTRACTION FOR: ${companyUrl}`;

      setGeneratedPrompt(prompt);
      
      toast({
        title: "Success",
        description: "Bulletproof prompt generated! Copy it, use with ChatGPT, then paste the raw JSON response in JSON mode.",
      });
    } catch (error) {
      console.error("Error generating prompt:", error);
      toast({
        title: "Error",
        description: "Failed to generate prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const validateJsonData = async () => {
    if (!jsonData.trim()) {
      toast({
        title: "Error",
        description: "Please paste the JSON data from ChatGPT.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Aggressive JSON cleaning
      let cleanedJsonData = jsonData.trim();
      
      // Remove any markdown code blocks
      cleanedJsonData = cleanedJsonData.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      
      // Remove any text before first { and after last }
      const firstBrace = cleanedJsonData.indexOf('{');
      const lastBrace = cleanedJsonData.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanedJsonData = cleanedJsonData.substring(firstBrace, lastBrace + 1);
      }

      // Replace smart quotes with straight quotes
      cleanedJsonData = cleanedJsonData
        .replace(/[\u201C\u201D]/g, '"') // Replace smart double quotes
        .replace(/[\u2018\u2019]/g, "'") // Replace smart single quotes
        .replace(/[\u2013\u2014]/g, '-'); // Replace em/en dashes

      console.log("Cleaned JSON data:", cleanedJsonData);

      // Parse JSON
      const parsedData = JSON.parse(cleanedJsonData);
      
      // Validate data against schema
      const result = validateVendorData(parsedData);
      setValidationResult(result);
      
      if (result.isValid) {
        // Proceed to QA step
        setMode('qa');
        await runQAAnalysis(result.cleanedData);
      } else {
        toast({
          title: "Validation Failed",
          description: `Found ${result.errors.length} error(s). Please fix the issues and try again.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
      toast({
        title: "JSON Parse Error",
        description: error instanceof Error ? error.message : "Invalid JSON format. Please check your data and try again.",
        variant: "destructive",
      });
    }
  };

  const runQAAnalysis = async (vendorData: any) => {
    setIsRunningQA(true);
    
    try {
      console.log("Running QA analysis for:", vendorData.company_name);
      
      const { data, error } = await supabase.functions.invoke('vendor-qa-agent', {
        body: { vendorData }
      });

      if (error) {
        console.error("QA analysis error:", error);
        throw error;
      }

      console.log("QA analysis result:", data);
      setQaResult(data);
      
      toast({
        title: "QA Analysis Complete",
        description: `Quality score: ${data.qualityScore}/100`,
      });

    } catch (error) {
      console.error("Error running QA analysis:", error);
      toast({
        title: "QA Analysis Failed",
        description: "Proceeding to preview without QA analysis.",
        variant: "destructive",
      });
      
      // Fallback to preview mode
      setMode('preview');
    } finally {
      setIsRunningQA(false);
    }
  };

  const handleQAProceed = () => {
    setMode('preview');
  };

  const handleQAReject = () => {
    setMode('json');
    setQaResult(null);
  };

  const handleQABypass = () => {
    setMode('preview');
    setQaResult(null);
  };

  const confirmAddVendor = async () => {
    if (!validationResult || !validationResult.isValid) {
      toast({
        title: "Error",
        description: "No valid data to insert.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const cleanedData = validationResult.cleanedData;
      console.log("Inserting vendor data:", cleanedData);

      // Auto-generate slug from company name
      const slug = cleanedData.company_name
        ?.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        || 'unknown-company';

      // Insert vendor record
      const { data: vendor, error } = await supabase
        .from('vendors')
        .insert({
          company_name: cleanedData.company_name,
          slug: slug,
          status: cleanedData.status || 'draft',
          company_type: cleanedData.company_type,
          description: cleanedData.description,
          headquarters: cleanedData.headquarters,
          founding_year: cleanedData.founding_year,
          core_services: cleanedData.core_services || [],
          specialties: cleanedData.specialties || [],
          customers: cleanedData.customers || [],
          key_features: cleanedData.key_features || [],
          key_benefits: cleanedData.key_benefits || [],
          website_url: cleanedData.website_url,
          source_url: cleanedData.source_url,
          funding_stage: cleanedData.funding_stage,
          total_funding: cleanedData.total_funding,
          key_investors: cleanedData.key_investors || [],
          competitive_advantages: cleanedData.competitive_advantages || [],
          performance_metrics: cleanedData.performance_metrics || {},
          notable_customers: cleanedData.notable_customers || [],
          research_data: cleanedData.research_data || {},
          company_data: cleanedData.company_data || {},
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Database insert error:", error);
        throw error;
      }

      toast({
        title: "Success",
        description: `Vendor "${cleanedData.company_name}" has been added successfully!`,
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
      setIsProcessing(false);
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    toast({
      title: "Copied!",
      description: "Prompt copied to clipboard.",
    });
  };

  const handleClose = () => {
    setMode('prompt');
    setCompanyUrl("");
    setCachedUrl("");
    setJsonData("");
    setGeneratedPrompt("");
    setValidationResult(null);
    onClose();
  };

  const switchToJsonMode = () => {
    setMode('json');
    setGeneratedPrompt("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'prompt' ? 'default' : 'outline'}
              onClick={() => setMode('prompt')}
              size="sm"
            >
              Generate Prompt
            </Button>
            <Button
              variant={mode === 'json' ? 'default' : 'outline'}
              onClick={() => setMode('json')}
              size="sm"
            >
              Add JSON Data
            </Button>
            {qaResult && (
              <Button
                variant={mode === 'qa' ? 'default' : 'outline'}
                onClick={() => setMode('qa')}
                size="sm"
              >
                QA Results ({qaResult.qualityScore}/100)
              </Button>
            )}
            {validationResult && (
              <Button
                variant={mode === 'preview' ? 'default' : 'outline'}
                onClick={() => setMode('preview')}
                size="sm"
                disabled={!validationResult.isValid}
              >
                Preview
              </Button>
            )}
          </div>

          {mode === 'prompt' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="companyUrl">Company URL</Label>
                <Input
                  id="companyUrl"
                  type="url"
                  placeholder="https://company.com"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  disabled={!!cachedUrl}
                  className={cachedUrl ? "bg-muted" : ""}
                />
              </div>

              <Button 
                onClick={generatePrompt} 
                disabled={isGenerating || !companyUrl.trim()}
                className="w-full"
              >
                {isGenerating ? "Generating..." : "Generate Bulletproof Prompt"}
              </Button>

              {generatedPrompt && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Generated Prompt</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyPrompt}
                        className="gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={switchToJsonMode}
                        className="gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Switch to JSON Mode
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-md text-sm max-h-60 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{generatedPrompt}</pre>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                    <p className="text-sm text-yellow-800 font-medium">
                      📋 Instructions:
                    </p>
                    <ol className="text-sm text-yellow-700 mt-1 list-decimal list-inside space-y-1">
                      <li>Copy the prompt above</li>
                      <li>Paste it into ChatGPT</li>
                      <li>Copy the raw JSON response (no markdown blocks)</li>
                      <li>Switch to JSON mode and paste it there</li>
                      <li>Verify at jsonlint.com if parsing fails</li>
                    </ol>
                  </div>
                </div>
              )}
            </>
          )}

          {mode === 'json' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="jsonData">JSON Data from ChatGPT</Label>
                <Textarea
                  id="jsonData"
                  placeholder="Paste the raw JSON response from ChatGPT here (no markdown blocks)..."
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <Button 
                onClick={validateJsonData} 
                disabled={isProcessing || !jsonData.trim()}
                className="w-full"
              >
                {isProcessing ? "Validating..." : "Validate & Preview"}
              </Button>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> If you get parsing errors, the JSON likely has smart quotes. 
                  Try pasting it at <a href="https://jsonlint.com" target="_blank" rel="noopener noreferrer" className="underline">jsonlint.com</a> first to identify issues.
                </p>
              </div>
            </>
          )}

          {mode === 'qa' && (
            <>
              {isRunningQA ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">
                    AI Quality Agent is analyzing the vendor data...
                  </p>
                </div>
              ) : qaResult ? (
                <VendorQAResults
                  qaResult={qaResult}
                  onProceed={handleQAProceed}
                  onReject={handleQAReject}
                  onBypass={handleQABypass}
                  isProcessing={isProcessing}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No QA results available</p>
                </div>
              )}
            </>
          )}

          {mode === 'preview' && validationResult && (
            <VendorPreview
              validationResult={validationResult}
              onConfirm={confirmAddVendor}
              onCancel={() => setMode('json')}
              isProcessing={isProcessing}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
