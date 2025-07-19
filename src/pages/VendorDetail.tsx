import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ExternalLink, Building, Calendar, DollarSign, Users, Target, Sparkles, Lightbulb, Copy, Clipboard } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useVendorBySlug } from '@/hooks/useVendors';
import { VENDOR_CATEGORIES, type Vendor } from '@/types/vendor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { generateVendorPrompt } from '@/lib/promptBuilder';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function VendorDetail() {
  const { category, vendorSlug } = useParams<{ category: string; vendorSlug: string }>();
  const [showPrompt, setShowPrompt] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [pasteContent, setPasteContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<any>(null);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const { data: vendor, isLoading, error } = useVendorBySlug(vendorSlug || '');

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

    const prompt = generateVendorPrompt(vendor.website_url);
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
      const { data, error } = await supabase.functions.invoke('process-vendor-json', {
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

      // Map ChatGPT response to vendor fields
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
        
        // Funding info
        funding_stage: jsonData.funding_stage || vendor?.funding_stage,
        total_funding: jsonData.total_funding || vendor?.total_funding,
        key_investors: jsonData.key_investors || vendor?.key_investors || [],
        
        // Store complete research data
        research_data: {
          ...vendor?.research_data,
          chatgpt_response: jsonData,
          last_updated: new Date().toISOString(),
          confidence_level: jsonData.confidence_level,
          verification_status: jsonData.verification_status
        },
        
        // Performance metrics if provided
        performance_metrics: jsonData.performance_metrics || vendor?.performance_metrics
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
        <meta property="og:type" content="article" />
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
                  {vendor.company_name}
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
                  <Badge variant={getCompanyTypeBadgeColor(vendor.company_type)} className="w-fit">
                    {vendor.company_type}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:flex-shrink-0">
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
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            <div className="xl:col-span-2 space-y-6 lg:space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Company Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    {vendor.description}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Sparkles className="h-5 w-5" />
                    Core Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {vendor.core_services.map((service, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs sm:text-sm">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Users className="h-5 w-5" />
                    Target Customers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {vendor.customers.map((customer, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs sm:text-sm">
                        {customer}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Target className="h-5 w-5" />
                    Specialty Focus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {vendor.specialties.map((specialty, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs sm:text-sm">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Key Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {vendor.key_features.map((feature, idx) => (
                        <Badge key={idx} variant="default" className="text-xs sm:text-sm">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Key Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {vendor.key_benefits.map((benefit, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs sm:text-sm">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {vendor.notable_customers && vendor.notable_customers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Notable Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {vendor.notable_customers.map((customer, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs sm:text-sm">
                          {customer}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {vendor.competitive_advantages && vendor.competitive_advantages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Competitive Advantages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {vendor.competitive_advantages.map((advantage, idx) => (
                        <Badge key={idx} variant="default" className="text-xs sm:text-sm">
                          {advantage}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {vendor.performance_metrics && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 p-4 rounded-lg overflow-x-auto">
                      <pre className="text-xs sm:text-sm whitespace-pre-wrap">
                        {JSON.stringify(vendor.performance_metrics, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
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
                    <Badge variant={getCompanyTypeBadgeColor(vendor.company_type)} className="mt-1">
                      {vendor.company_type}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {(vendor.total_funding || vendor.funding_stage || (vendor.key_investors && vendor.key_investors.length > 0)) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <DollarSign className="h-5 w-5" />
                      Funding Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {vendor.total_funding && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Funding</p>
                          <p className="text-xl sm:text-2xl font-bold text-primary break-words">
                            {vendor.total_funding}
                          </p>
                        </div>
                        <Separator />
                      </>
                    )}
                    {vendor.funding_stage && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Funding Stage</p>
                          <p className="font-medium text-sm sm:text-base">{vendor.funding_stage}</p>
                        </div>
                        <Separator />
                      </>
                    )}
                    {vendor.key_investors && vendor.key_investors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Key Investors</p>
                        <div className="flex flex-wrap gap-1">
                          {vendor.key_investors.map((investor, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {investor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
