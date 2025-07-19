
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

    setIsGenerating(true);
    
    try {
      const prompt = `Please analyze the company at ${companyUrl} and provide detailed information in the following JSON format:

{
  "company_name": "Exact company name",
  "headquarters": "City, State/Country",
  "founding_year": 2020,
  "company_type": "Private/Public/Subsidiary",
  "description": "Detailed company description (2-3 sentences)",
  "core_services": ["Service 1", "Service 2", "Service 3"],
  "specialties": ["Specialty 1", "Specialty 2"],
  "customers": ["Customer Type 1", "Customer Type 2"],
  "key_features": ["Feature 1", "Feature 2", "Feature 3"],
  "key_benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "website_url": "${companyUrl}",
  "funding_stage": "Seed/Series A/B/C/IPO/Private",
  "total_funding": "$X million",
  "key_investors": ["Investor 1", "Investor 2"],
  "competitive_advantages": ["Advantage 1", "Advantage 2"],
  "performance_metrics": {
    "employees": "Number or range",
    "revenue": "$X million (if public)",
    "customers": "Number of customers/clients"
  },
  "notable_customers": ["Customer 1", "Customer 2", "Customer 3"]
}

Focus on revenue cycle management (RCM) capabilities, healthcare technology, and competitive positioning. Ensure all information is accurate and current.`;

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
      // Parse and validate JSON
      const parsedData = JSON.parse(jsonData);
      
      // Validate required fields
      if (!parsedData.company_name || !parsedData.description || !parsedData.headquarters) {
        throw new Error("Missing required fields: company_name, description, or headquarters");
      }

      // Create vendor record
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Generate slug from company name
      const slug = parsedData.company_name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .trim();

      // Insert completed record
      const { data: vendor, error } = await supabase
        .from('vendors')
        .insert({
          company_name: parsedData.company_name,
          slug,
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
          funding_stage: parsedData.funding_stage,
          total_funding: parsedData.total_funding,
          key_investors: parsedData.key_investors || [],
          competitive_advantages: parsedData.competitive_advantages || [],
          performance_metrics: parsedData.performance_metrics,
          notable_customers: parsedData.notable_customers || [],
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

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
