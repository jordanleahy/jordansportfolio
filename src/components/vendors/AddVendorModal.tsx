import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddVendorModal = ({ isOpen, onClose }: AddVendorModalProps) => {
  const [companyUrl, setCompanyUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
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
      // Create draft vendor record
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Generate company name from URL for the slug
      const urlObj = new URL(companyUrl);
      const domain = urlObj.hostname.replace('www.', '');
      const companyName = domain.split('.')[0];
      const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-');

      // Insert draft record
      const { data: vendor, error } = await supabase
        .from('vendors')
        .insert({
          company_name: companyName,
          slug,
          status: 'draft',
          company_data: {
            source_url: companyUrl
          },
          research_data: {},
          user_id: user.id,
          // Required fields with defaults
          company_type: 'Private',
          description: 'Pending research',
          headquarters: 'TBD',
        })
        .select()
        .single();

      if (error) throw error;

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
        description: `Draft vendor record created and prompt generated!`,
      });
    } catch (error) {
      console.error("Error creating vendor:", error);
      toast({
        title: "Error",
        description: "Failed to create vendor record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
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
    setCompanyUrl("");
    setGeneratedPrompt("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
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
                    onClick={() => window.open('/admin/vendors', '_blank')}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Admin Panel
                  </Button>
                </div>
              </div>
              <div className="bg-muted p-4 rounded-md text-sm max-h-60 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{generatedPrompt}</pre>
              </div>
              <p className="text-sm text-muted-foreground">
                Copy this prompt and use it with ChatGPT to generate vendor data. 
                Then paste the JSON response in the Admin Panel to complete the vendor profile.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};