import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ExternalLink, Building, Calendar, DollarSign, Users, Target, Sparkles, Lightbulb, Home } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useVendorBySlug } from '@/hooks/useVendors';
import { VENDOR_CATEGORIES } from '@/types/vendor';
import { VendorImageGallery } from '@/components/vendors/VendorImageGallery';
import { PerformanceMetrics } from '@/components/vendors/PerformanceMetrics';

export default function PublicVendorView() {
  const {
    category,
    vendorSlug
  } = useParams<{
    category?: string;
    vendorSlug: string;
  }>();
  const {
    data: vendor,
    isLoading,
    error
  } = useVendorBySlug(vendorSlug || '');

  if (!vendorSlug) {
    return <Navigate to="/404" replace />;
  }

  // Determine category and config - handle RCM companies special case
  const actualCategory = category || 'rcm';
  const categoryConfig = VENDOR_CATEGORIES[actualCategory as keyof typeof VENDOR_CATEGORIES] || {
    title: `RCM Companies`,
    description: `Analysis of RCM vendors, their capabilities, funding, and market positioning for competitive intelligence research.`
  };

  if (isLoading) {
    return <PageLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">Loading vendor details...</div>
        </div>
      </PageLayout>;
  }

  if (error || !vendor || vendor.status !== 'published') {
    return <Navigate to="/404" replace />;
  }

  const getCompanyTypeBadgeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'startup':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800/20 dark:text-emerald-300';
      case 'private':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300';
      case 'public':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800/20 dark:text-purple-300';
      case 'subsidiary':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-800/20 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300';
    }
  };

  const renderArrayField = (items: string[] | undefined, title: string, icon: React.ReactNode) => {
    if (!items || items.length === 0) return null;
    return <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {items.map((item, index) => <li key={index} className="flex items-start gap-3 text-sm leading-relaxed">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span className="text-muted-foreground">{item}</span>
              </li>)}
          </ul>
        </CardContent>
      </Card>;
  };

  const getCategoryDisplayName = (cat: string) => {
    switch (cat) {
      case 'rcm':
        return 'RCM Companies';
      default:
        return `${cat.charAt(0).toUpperCase() + cat.slice(1)} Companies`;
    }
  };

  return <>
      <Helmet>
        <title>{vendor.company_name} - Company Profile</title>
        <meta name="description" content={vendor.description || `${vendor.company_name} company profile and information`} />
        <meta property="og:title" content={`${vendor.company_name} - Company Profile`} />
        <meta property="og:description" content={vendor.description || `${vendor.company_name} company profile and information`} />
        <meta property="og:image" content="https://265639ae-98fe-47f5-888f-bed563c20e8d.lovableproject.com/og-images/default-hero.png" />
        <meta property="og:url" content={`https://265639ae-98fe-47f5-888f-bed563c20e8d.lovableproject.com/vendors/${actualCategory}/${vendorSlug}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Jordan's Portfolio" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${vendor.company_name} - Company Profile`} />
        <meta name="twitter:description" content={vendor.description || `${vendor.company_name} company profile and information`} />
        <meta name="twitter:image" content="https://265639ae-98fe-47f5-888f-bed563c20e8d.lovableproject.com/og-images/default-hero.png" />
      </Helmet>

      <PageLayout>
        <div className="container mx-auto py-8 px-4 space-y-8">
          {/* Breadcrumb Navigation */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${actualCategory}companies`}>
                  {getCategoryDisplayName(actualCategory)}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{vendor.company_name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Clean Header Section */}
          <div className="rounded-lg p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              {/* Company Info */}
              <div className="space-y-3 md:space-y-4 flex-1">
                {/* Company Name and Type */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                    {vendor.company_name}
                  </h1>
                  <Badge className={getCompanyTypeBadgeColor(vendor.company_type)}>
                    {vendor.company_type}
                  </Badge>
                </div>
                
                {/* Location and Founded Info */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm md:text-base text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Building className="h-4 w-4 flex-shrink-0" />
                    <span className="break-words">{vendor.headquarters}</span>
                  </span>
                  {vendor.founding_year && (
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      Founded {vendor.founding_year}
                    </span>
                  )}
                </div>
              </div>

              {/* Visit Website Button */}
              {vendor.website_url && (
                <div className="flex justify-end md:ml-8">
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <a href={vendor.website_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Website
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Services and Capabilities - Single Column */}
              <div className="space-y-6">
                {renderArrayField(vendor.core_services, "Core Services", <Target className="h-5 w-5" />)}
                {renderArrayField(vendor.specialties, "Specialties", <Sparkles className="h-5 w-5" />)}
                {renderArrayField(vendor.customers, "Target Customers", <Users className="h-5 w-5" />)}
                {renderArrayField(vendor.key_features, "Key Features", <Lightbulb className="h-5 w-5" />)}
                {renderArrayField(vendor.key_benefits, "Key Benefits", <DollarSign className="h-5 w-5" />)}
                {renderArrayField(vendor.competitive_advantages, "Competitive Advantages", <Target className="h-5 w-5" />)}
              </div>

              {/* Additional Information */}
              <div className="grid gap-6 md:grid-cols-2">
                {renderArrayField(vendor.notable_customers, "Notable Customers", <Building className="h-5 w-5" />)}
                {renderArrayField(vendor.competitors, "Competitors", <Target className="h-5 w-5" />)}
                {renderArrayField(vendor.key_investors, "Key Investors", <DollarSign className="h-5 w-5" />)}
                {renderArrayField(vendor.certifications, "Certifications", <Sparkles className="h-5 w-5" />)}
                {renderArrayField(vendor.awards_recognition, "Awards & Recognition", <Sparkles className="h-5 w-5" />)}
                {renderArrayField(vendor.partnerships, "Partnerships", <Building className="h-5 w-5" />)}
              </div>

              {/* Image Gallery */}
              {vendor.vendor_images && vendor.vendor_images.length > 0 && <VendorImageGallery vendor={vendor} canEdit={false} />}
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
              {/* Company Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Company Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vendor.founding_year && <div>
                      <span className="text-sm text-muted-foreground block mb-1">Founded</span>
                      <span className="text-xl font-semibold">{vendor.founding_year}</span>
                    </div>}
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">Headquarters</span>
                    <span className="font-medium">{vendor.headquarters}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">Company Type</span>
                    <span className="font-medium">{vendor.company_type}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Funding Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Funding Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">Total Funding</span>
                    <span className="text-xl font-semibold">
                      {vendor.total_funding || 'Not disclosed'}
                    </span>
                  </div>
                  {vendor.funding_stage && <div>
                      <span className="text-sm text-muted-foreground block mb-1">Funding Stage</span>
                      <span className="font-medium">{vendor.funding_stage}</span>
                    </div>}
                  {vendor.key_investors && vendor.key_investors.length > 0 && <div>
                      <span className="text-sm text-muted-foreground block mb-2">Key Investors</span>
                      <ul className="space-y-1">
                        {vendor.key_investors.map((investor, index) => <li key={index} className="flex items-start gap-2">
                            <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                            <span className="text-sm font-medium">{investor}</span>
                          </li>)}
                      </ul>
                    </div>}
                  {vendor.employee_count_range && <div>
                      <span className="text-sm text-muted-foreground block mb-1">Employees</span>
                      <span className="font-medium">{vendor.employee_count_range}</span>
                    </div>}
                  {vendor.business_model && <div>
                      <span className="text-sm text-muted-foreground block mb-1">Business Model</span>
                      <span className="font-medium">{vendor.business_model}</span>
                    </div>}
                  {vendor.geographic_presence && <div>
                      <span className="text-sm text-muted-foreground block mb-1">Geographic Presence</span>
                      <span className="font-medium">{vendor.geographic_presence}</span>
                    </div>}
                </CardContent>
              </Card>

              {/* Contact Information */}
              {(vendor.contact_email || vendor.contact_phone || vendor.contact_address || vendor.linkedin_url || vendor.twitter_url) && <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {vendor.contact_email && <div className="flex justify-between">
                        <span className="text-muted-foreground">Email</span>
                        <a href={`mailto:${vendor.contact_email}`} className="text-primary hover:underline">
                          {vendor.contact_email}
                        </a>
                      </div>}
                    {vendor.contact_phone && <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone</span>
                        <span className="font-medium">{vendor.contact_phone}</span>
                      </div>}
                    {vendor.contact_address && <div className="flex justify-between">
                        <span className="text-muted-foreground">Address</span>
                        <span className="font-medium text-right">{vendor.contact_address}</span>
                      </div>}
                    <div className="flex gap-2 pt-2">
                      {vendor.linkedin_url && <Button variant="outline" size="sm" asChild>
                          <a href={vendor.linkedin_url} target="_blank" rel="noopener noreferrer">
                            LinkedIn
                          </a>
                        </Button>}
                      {vendor.twitter_url && <Button variant="outline" size="sm" asChild>
                          <a href={vendor.twitter_url} target="_blank" rel="noopener noreferrer">
                            Twitter
                          </a>
                        </Button>}
                    </div>
                  </CardContent>
                </Card>}
            </div>
          </div>

          {/* Performance Metrics - At Bottom */}
          {vendor.performance_metrics && Object.keys(vendor.performance_metrics).length > 0 && <PerformanceMetrics metrics={vendor.performance_metrics} />}
        </div>
      </PageLayout>
    </>;
}
