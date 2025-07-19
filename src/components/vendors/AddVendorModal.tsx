import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, ExternalLink, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVendorAdded: () => void;
}

type ModalMode = 'prompt' | 'json';

export const AddVendorModal = ({ isOpen, onClose, onVendorAdded }: AddVendorModalProps) => {
  const [mode, setMode] = useState<ModalMode>('prompt');
  const [companyUrl, setCompanyUrl] = useState("");
  const [cachedUrl, setCachedUrl] = useState("");
  const [jsonData, setJsonData] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
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
      const prompt = `CRITICAL: Return ONLY valid JSON with straight double quotes (") - NO smart quotes, curly quotes, or markdown. Do not include any text before or after the JSON.

Research the company at ${companyUrl} and return a complete JSON object with the following EXACT structure. All fields are required - use null for unknown values, empty arrays [] for missing lists, and empty strings "" for missing text:

{
  "company_name": "string - REQUIRED: Exact official company name",
  "slug": "string - REQUIRED: URL-friendly version of company name (lowercase, no spaces, use dashes)",
  "headquarters": "string - REQUIRED: City, State format (e.g., 'Austin, TX' or 'London, UK')",
  "founding_year": 2020,
  "company_type": "string - REQUIRED: One of: 'SaaS Platform', 'Healthcare Technology', 'Consulting Firm', 'Private', 'Public', 'Subsidiary'",
  "description": "string - REQUIRED: 2-3 sentence professional description of company and value proposition",
  "core_services": ["Service 1", "Service 2", "Service 3"],
  "specialties": ["Specialty 1", "Specialty 2"],
  "customers": ["Customer Type 1", "Customer Type 2"],
  "key_features": ["Feature 1", "Feature 2", "Feature 3"],
  "key_benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "website_url": "${companyUrl}",
  "source_url": "${companyUrl}",
  "funding_stage": "string or null - Options: 'Seed', 'Series A', 'Series B', 'Series C', 'IPO', 'Private', 'Public' or null",
  "total_funding": "string or null - Format: '$10M', '$1.2B' or null",
  "key_investors": ["Investor 1", "Investor 2"],
  "competitive_advantages": ["Advantage 1", "Advantage 2"],
  "performance_metrics": {
    "employees": "string - Number or range like '50-100' or '500+'",
    "revenue": "string or null - Format: '$10M ARR' or null if private",
    "customers": "string - Number like '1000+' or '50 enterprise clients'"
  },
  "notable_customers": ["Customer 1", "Customer 2", "Customer 3"],
  "research_data": {
    "research_date": "2024-01-15",
    "data_sources": ["company website", "press releases", "funding announcements"],
    "last_updated": "2024-01-15",
    "research_quality": "high"
  },
  "company_data": {
    "business_model": "SaaS subscription",
    "target_market": "Enterprise healthcare",
    "technology_stack": ["React", "Node.js", "AWS"],
    "partnerships": ["Partner 1", "Partner 2"]
  }
}

CRITICAL REQUIREMENTS:
1. Return ONLY the JSON object - no other text, explanations, or markdown
2. Use ONLY straight double quotes (") - NO smart quotes (" ") or single quotes
3. Ensure all required fields (company_name, slug, headquarters, company_type, description) have actual values, not null
4. For the slug field: convert company name to lowercase, remove special characters, replace spaces with dashes (e.g., "SmarterDx" becomes "smarterdx")
5. Use proper JSON syntax - validate before responding
6. Keep array items concise (2-8 words each)
7. Use consistent location formatting (City, State/Country)
8. Include the complete JSON structure - do not truncate any fields
9. All array fields must be present (even if empty arrays [])
10. VERIFY your JSON has ONLY straight quotes before sending

Research Guidelines:
- Visit their website, about page, careers page, press releases
- Look for case studies, customer testimonials, success stories  
- Check for funding announcements and growth metrics
- Identify target market and competitive positioning
- Find team size, locations, notable employees
- Look for awards, certifications, industry recognition

Validate your JSON before responding to ensure it's complete and properly formatted.`;

      setGeneratedPrompt(prompt);
      
      toast({
        title: "Success",
        description: "Prompt generated! Copy it and use with ChatGPT, then switch to JSON mode to add the result.",
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

  const processJsonData = async () => {
    if (!jsonData.trim()) {
      toast({
        title: "Error",
        description: "Please paste the JSON data from ChatGPT.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Clean the JSON data - remove any potential markdown formatting or extra text
      let cleanedJsonData = jsonData.trim();
      
      // Remove markdown code blocks if present
      if (cleanedJsonData.startsWith('```json')) {
        cleanedJsonData = cleanedJsonData.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedJsonData.startsWith('```')) {
        cleanedJsonData = cleanedJsonData.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove any text before the first { or after the last }
      const firstBrace = cleanedJsonData.indexOf('{');
      const lastBrace = cleanedJsonData.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanedJsonData = cleanedJsonData.substring(firstBrace, lastBrace + 1);
      }

      console.log("Cleaned JSON data:", cleanedJsonData);

      // Parse and validate JSON
      const parsedData = JSON.parse(cleanedJsonData);
      
      // Validate required fields
      if (!parsedData.company_name || !parsedData.description || !parsedData.headquarters || !parsedData.slug) {
        throw new Error("Missing required fields: company_name, description, headquarters, or slug");
      }

      // Ensure arrays are properly formatted
      const arrayFields = ['core_services', 'specialties', 'customers', 'key_features', 'key_benefits', 'key_investors', 'competitive_advantages', 'notable_customers'];
      arrayFields.forEach(field => {
        if (!Array.isArray(parsedData[field])) {
          parsedData[field] = [];
        }
      });

      // Ensure performance_metrics is an object
      if (!parsedData.performance_metrics || typeof parsedData.performance_metrics !== 'object') {
        parsedData.performance_metrics = {};
      }

      // Create vendor record
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      console.log("Inserting vendor data:", parsedData);

      // Insert completed record
      const { data: vendor, error } = await supabase
        .from('vendors')
        .insert({
          company_name: parsedData.company_name,
          slug: parsedData.slug,
          status: 'completed',
          company_type: parsedData.company_type || 'Private',
          description: parsedData.description,
          headquarters: parsedData.headquarters,
          founding_year: parsedData.founding_year,
          core_services: parsedData.core_services || [],
          specialties: parsedData.specialties || [],
          customers: parsedData.customers || [],
          key_features: parsedData.key_features || [],
          key_benefits: parsedData.key_benefits || [],
          website_url: parsedData.website_url,
          source_url: parsedData.source_url || parsedData.website_url,
          funding_stage: parsedData.funding_stage,
          total_funding: parsedData.total_funding,
          key_investors: parsedData.key_investors || [],
          competitive_advantages: parsedData.competitive_advantages || [],
          performance_metrics: parsedData.performance_metrics,
          notable_customers: parsedData.notable_customers || [],
          research_data: parsedData.research_data || {},
          company_data: parsedData.company_data || {},
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
        description: `Vendor "${parsedData.company_name}" has been added successfully!`,
      });

      onVendorAdded();
      handleClose();
    } catch (error) {
      console.error("Error processing JSON:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process JSON data. Please check the format and try again.",
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
    onClose();
  };

  const switchToJsonMode = () => {
    setMode('json');
    setGeneratedPrompt("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
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
                {isGenerating ? "Generating..." : "Generate Prompt"}
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
                  <p className="text-sm text-muted-foreground">
                    Copy this prompt and use it with ChatGPT, then switch to JSON mode to paste the response.
                  </p>
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
                  placeholder="Paste the JSON response from ChatGPT here..."
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <Button 
                onClick={processJsonData} 
                disabled={isProcessing || !jsonData.trim()}
                className="w-full"
              >
                {isProcessing ? "Processing..." : "Add Vendor"}
              </Button>

              <p className="text-sm text-muted-foreground">
                Paste the complete JSON response from ChatGPT to create the vendor record.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
