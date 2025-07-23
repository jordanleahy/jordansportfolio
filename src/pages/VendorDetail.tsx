import React, { useState, useEffect } from 'react'; // Fixed TypeScript property references
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Users, 
  Globe, 
  DollarSign, 
  Shield, 
  FileText, 
  Download,
  Clipboard,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { EditableSection } from '@/components/vendors/EditableSection';
import { InvestorResearchModal } from '@/components/investors/InvestorResearchModal';
import { type Vendor } from '@/types/vendor';

export default function VendorDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);
  const [investorModalStep, setInvestorModalStep] = useState<'prompt' | 'import'>('prompt');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  useEffect(() => {
    const fetchVendor = async () => {
      if (!slug) {
        console.log('No slug provided');
        setIsLoading(false);
        return;
      }
      
      console.log('Fetching vendor with slug:', slug);
      
      try {
        const { data, error } = await supabase
          .from('vendors')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        console.log('Vendor fetch result:', { data, error });

        if (error) {
          console.error('Error fetching vendor:', error);
          toast({
            title: "Error",
            description: "Failed to load vendor details",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (!data) {
          console.log('No vendor found for slug:', slug);
          toast({
            title: "Vendor not found",
            description: "The vendor you're looking for doesn't exist.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        console.log('Setting vendor data:', data);
        setVendor(data);
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "Failed to load vendor details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendor();
  }, [slug, toast]);

  const generateInvestorResearchPrompt = (keyInvestors: string[], companyName: string) => {
    const investorList = keyInvestors.map(investor => `- ${investor}`).join('\n');
    
    const prompt = `You are an expert investment research analyst. I need you to research these specific investors who have invested in ${companyName}:

${investorList}

For each investor, extract detailed information from multiple sources (websites, Crunchbase, PitchBook, LinkedIn, etc.) and return ONLY a valid JSON array with this exact structure:

[
  {
    "firm_name": "Official firm name",
    "address": "Street address of main office",
    "city": "Primary office city",
    "state": "State/Province code",
    "zip": "ZIP/Postal code",
    "website": "Primary website URL",
    "sector_focus": ["Array of investment sectors/verticals"],
    "stage": "Primary investment stage (e.g., 'Series A', 'Growth Equity', 'Seed')",
    "check_size_min": 5, // Minimum investment size in millions (numeric only)
    "check_size_max": 50, // Maximum investment size in millions (numeric only)
    "latest_fund_name": "Name of most recent fund",
    "latest_fund_year": 2023, // Year of latest fund (numeric)
    "latest_fund_size": 2000, // Fund size in millions (numeric only)
    "total_aum": 15000, // Total assets under management in millions (numeric only)
    "lead_partner": "Name and title of key contact partner",
    "contact_email": "General contact email"
  }
]

Extract ONLY factual information from reliable sources. For missing data, use null for strings/numbers and empty arrays for arrays. Return only the JSON array with no additional text.`;

    setGeneratedPrompt(prompt);
    setInvestorModalStep('prompt');
    setIsInvestorModalOpen(true);
  };

  const openClipboardModal = () => {
    setInvestorModalStep('import');
    setIsInvestorModalOpen(true);
  };

  const handleInvestorsAdded = (count: number) => {
    toast({
      title: "Success!",
      description: `Added ${count} investor(s) to the database`,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Vendor Not Found</h1>
          <p className="text-muted-foreground">The vendor you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Configuration objects for different sections
  const basicInfoConfig = {
    title: "Basic Information",
    fields: [
      { key: 'company_name' as keyof Vendor, type: 'text' as const, label: 'Company Name' },
      { key: 'website_url' as keyof Vendor, type: 'text' as const, label: 'Website' },
      { key: 'headquarters' as keyof Vendor, type: 'text' as const, label: 'Headquarters' },
      { key: 'founding_year' as keyof Vendor, type: 'number' as const, label: 'Founded Year' },
      { key: 'employee_count_range' as keyof Vendor, type: 'text' as const, label: 'Employee Count' },
    ]
  };

  const descriptionConfig = {
    title: "Company Description",
    fields: [
      { key: 'description' as keyof Vendor, type: 'multiline' as const, label: 'Description', maxLength: 1000 },
    ]
  };

  const productsConfig = {
    title: "Products & Services",
    fields: [
      { key: 'core_services' as keyof Vendor, type: 'array' as const, label: 'Products/Services', maxItems: 10 },
    ]
  };

  const fundingConfig = {
    title: "Funding Information",
    fields: [
      { key: 'total_funding' as keyof Vendor, type: 'text' as const, label: 'Total Funding' },
      { key: 'funding_stage' as keyof Vendor, type: 'text' as const, label: 'Funding Stage' },
      { key: 'key_investors' as keyof Vendor, type: 'array' as const, label: 'Key Investors', maxItems: 15 },
    ]
  };

  const technicalConfig = {
    title: "Technical Information",
    fields: [
      { key: 'tech_stack' as keyof Vendor, type: 'array' as const, label: 'Technology Stack', maxItems: 15 },
      { key: 'key_features' as keyof Vendor, type: 'array' as const, label: 'Integration Capabilities', maxItems: 15 },
    ]
  };

  const complianceConfig = {
    title: "Compliance & Security",
    fields: [
      { key: 'certifications' as keyof Vendor, type: 'array' as const, label: 'Compliance Certifications', maxItems: 10 },
      { key: 'key_features' as keyof Vendor, type: 'array' as const, label: 'Security Features', maxItems: 10 },
    ]
  };

  const businessConfig = {
    title: "Business Model",
    fields: [
      { key: 'business_model' as keyof Vendor, type: 'text' as const, label: 'Pricing Model' },
      { key: 'customers' as keyof Vendor, type: 'array' as const, label: 'Target Market', maxItems: 10 },
      { key: 'competitors' as keyof Vendor, type: 'array' as const, label: 'Competitors', maxItems: 10 },
    ]
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">{vendor.company_name}</h1>
          <Badge variant={vendor.status === 'completed' ? 'default' : 'secondary'}>
            {vendor.status}
          </Badge>
        </div>
        
        {vendor.description && (
          <p className="text-lg text-muted-foreground mb-6">{vendor.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2 mb-6">
          {vendor.website_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={vendor.website_url} target="_blank" rel="noopener noreferrer">
                <Globe className="mr-2 h-4 w-4" />
                Visit Website
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <EditableSection vendor={vendor} config={basicInfoConfig} canEdit={isAdmin} />
          <EditableSection vendor={vendor} config={descriptionConfig} canEdit={isAdmin} />
          <EditableSection vendor={vendor} config={productsConfig} canEdit={isAdmin} />
          <EditableSection 
            vendor={vendor} 
            config={fundingConfig} 
            canEdit={isAdmin}
            extraButton={
              isAdmin && vendor.key_investors && vendor.key_investors.length > 0 ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateInvestorResearchPrompt(vendor.key_investors, vendor.company_name)}
                    title="Generate research prompt for these investors"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openClipboardModal}
                    title="Import investor data from clipboard"
                  >
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </div>
              ) : null
            }
          />
        </div>

        <div className="space-y-6">
          <EditableSection vendor={vendor} config={technicalConfig} canEdit={isAdmin} />
          <EditableSection vendor={vendor} config={complianceConfig} canEdit={isAdmin} />
          <EditableSection vendor={vendor} config={businessConfig} canEdit={isAdmin} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Company Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{vendor.headquarters || 'Not specified'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Founded {vendor.founding_year || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{vendor.employee_count_range || 'Not specified'} employees</span>
            </div>
          </CardContent>
        </Card>

        {vendor.core_services && vendor.core_services.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Products & Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {vendor.core_services.slice(0, 5).map((service, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    {service}
                  </li>
                ))}
                {vendor.core_services.length > 5 && (
                  <li className="text-sm text-muted-foreground">
                    +{vendor.core_services.length - 5} more...
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        )}

        {(vendor.total_funding || vendor.funding_stage || (vendor.key_investors && vendor.key_investors.length > 0)) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <DollarSign className="h-5 w-5" />
                Funding Information Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vendor.total_funding && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Total Funding</h4>
                  <p className="text-sm text-muted-foreground">{vendor.total_funding}</p>
                </div>
              )}
              {vendor.funding_stage && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Funding Stage</h4>
                  <p className="text-sm text-muted-foreground">{vendor.funding_stage}</p>
                </div>
              )}
              {vendor.key_investors && vendor.key_investors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Key Investors</h4>
                  <div className="flex flex-wrap gap-1">
                    {vendor.key_investors.slice(0, 3).map((investor, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {investor}
                      </Badge>
                    ))}
                    {vendor.key_investors.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{vendor.key_investors.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <InvestorResearchModal
        isOpen={isInvestorModalOpen}
        onClose={() => setIsInvestorModalOpen(false)}
        onInvestorsAdded={handleInvestorsAdded}
        initialStep={investorModalStep}
      />
    </div>
  );
}
