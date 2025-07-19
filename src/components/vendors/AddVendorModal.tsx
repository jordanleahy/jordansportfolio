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
      const prompt = `🚨 BULLETPROOF JSON GENERATOR 🚨

Research ${companyUrl} and return ONLY RAW JSON (NO MARKDOWN BLOCKS, NO \`\`\`json):

{
  "company_name": "Exact company name",
  "slug": "lowercase-company-name",
  "headquarters": "City, State",
  "founding_year": 2020,
  "company_type": "SaaS Platform",
  "description": "2-3 sentence description",
  "core_services": ["service1", "service2"],
  "specialties": ["specialty1", "specialty2"],
  "customers": ["customer-type1"],
  "key_features": ["feature1", "feature2"],
  "key_benefits": ["benefit1", "benefit2"],
  "website_url": "${companyUrl}",
  "source_url": "${companyUrl}",
  "funding_stage": "Series A",
  "total_funding": "$10M",
  "key_investors": ["investor1"],
  "competitive_advantages": ["advantage1"],
  "performance_metrics": {"employees": "100", "revenue": "$5M"},
  "notable_customers": ["customer1"],
  "research_data": {"research_date": "2024-07-19", "data_sources": ["website"], "research_quality": "high"},
  "company_data": {"business_model": "SaaS", "target_market": "Enterprise"},
  "status": "draft"
}

CRITICAL RULES:
• NO \`\`\`json blocks - raw JSON only
• Use straight quotes (") not smart quotes (" ")  
• founding_year = number (not string)
• Empty arrays [] for unknown data
• "null" for missing values
• status = "draft"

FALLBACKS: Use "Unknown" for company_name, "unknown-company" for slug, "Unknown" for others if data unavailable.

VALIDATION: Test at jsonlint.com before submitting.`;

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

      // Insert vendor record
      const { data: vendor, error } = await supabase
        .from('vendors')
        .insert({
          company_name: cleanedData.company_name,
          slug: cleanedData.slug,
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
