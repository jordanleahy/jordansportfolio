import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { generateVendorPrompt } from "@/lib/promptBuilder";
import { PageLayout } from "@/components/layout/PageLayout";
import type { Vendor } from "@/types/vendor";

export default function AdminVendors() {
  const [companyUrl, setCompanyUrl] = useState("");
  const [jsonResponse, setJsonResponse] = useState("");
  const [previewData, setPreviewData] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generatePrompt = () => {
    if (!companyUrl) {
      toast.error("Please enter a company URL");
      return;
    }
    const prompt = generateVendorPrompt(companyUrl);
    navigator.clipboard.writeText(prompt);
    toast.success("Prompt copied to clipboard! Paste it into ChatGPT o3.");
  };

  const validateAndPreview = () => {
    if (!jsonResponse.trim()) {
      toast.error("Please paste the JSON response from ChatGPT");
      return;
    }

    try {
      const parsed = JSON.parse(jsonResponse);
      
      // Validate required fields
      const required = ['company_name', 'headquarters', 'company_type', 'description'];
      const missing = required.filter(field => !parsed[field]);
      
      if (missing.length > 0) {
        toast.error(`Missing required fields: ${missing.join(', ')}`);
        return;
      }

      // Generate slug from company name
      const slug = parsed.company_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      const vendorData: Vendor = {
        id: crypto.randomUUID(),
        company_name: parsed.company_name,
        headquarters: parsed.headquarters,
        company_type: parsed.company_type,
        description: parsed.description,
        core_services: parsed.core_services || [],
        specialties: parsed.specialties || [],
        customers: parsed.customers || [],
        founding_year: parsed.founding_year,
        funding_stage: parsed.funding_stage,
        total_funding: parsed.total_funding,
        key_investors: parsed.key_investors || [],
        competitive_advantages: parsed.competitive_advantages || [],
        key_features: parsed.key_features || [],
        key_benefits: parsed.key_benefits || [],
        performance_metrics: parsed.performance_metrics,
        notable_customers: parsed.notable_customers || [],
        website_url: parsed.website_url,
        slug
      };

      setPreviewData(vendorData);
      toast.success("JSON validated successfully! Review the preview below.");
    } catch (error) {
      toast.error("Invalid JSON format. Please check your input.");
      console.error("JSON parse error:", error);
    }
  };

  const saveVendor = async () => {
    if (!previewData) {
      toast.error("No data to save. Please validate JSON first.");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to continue");
        return;
      }

      const { error } = await supabase
        .from('vendors')
        .insert({
          ...previewData,
          user_id: user.id
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.error("A vendor with this slug already exists");
        } else {
          throw error;
        }
        return;
      }

      toast.success(`Vendor "${previewData.company_name}" saved successfully!`);
      
      // Reset form
      setCompanyUrl("");
      setJsonResponse("");
      setPreviewData(null);
      
      // Open the new vendor page
      window.open(`/vendors/rcm/${previewData.slug}`, '_blank');
      
    } catch (error) {
      console.error("Error saving vendor:", error);
      toast.error("Failed to save vendor. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Vendor Research Assistant</h1>
        <p className="text-muted-foreground">
          Add new vendors by researching with ChatGPT o3
        </p>
      </div>

      <div className="grid gap-8 max-w-4xl mx-auto">
        {/* Step 1: Generate Prompt */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Generate Research Prompt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter company URL (e.g., https://candidhealth.com)"
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
            />
            <Button onClick={generatePrompt} className="w-full">
              Generate & Copy Prompt for ChatGPT
            </Button>
            <p className="text-sm text-muted-foreground">
              This will copy a research prompt to your clipboard. Paste it into ChatGPT o3.
            </p>
          </CardContent>
        </Card>

        {/* Step 2: Paste Response */}
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Paste ChatGPT Response</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste the JSON response from ChatGPT here..."
              value={jsonResponse}
              onChange={(e) => setJsonResponse(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
            <Button onClick={validateAndPreview} className="w-full">
              Validate & Preview Data
            </Button>
          </CardContent>
        </Card>

        {/* Step 3: Preview & Save */}
        {previewData && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Preview & Save</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-secondary p-4 rounded-lg space-y-2">
                <h3 className="font-semibold">{previewData.company_name}</h3>
                <p className="text-sm text-muted-foreground">{previewData.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Headquarters:</strong> {previewData.headquarters}
                  </div>
                  <div>
                    <strong>Type:</strong> {previewData.company_type}
                  </div>
                  <div>
                    <strong>Services:</strong> {previewData.core_services.join(', ')}
                  </div>
                  <div>
                    <strong>URL Slug:</strong> /vendors/rcm/{previewData.slug}
                  </div>
                </div>
              </div>
              <Button 
                onClick={saveVendor} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Saving..." : "Save Vendor & Open Page"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </PageLayout>
  );
}