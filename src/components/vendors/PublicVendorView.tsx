import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ExternalLink, Building, Calendar, DollarSign, Users, Target, Sparkles, Lightbulb } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useVendorBySlug } from '@/hooks/useVendors';
import { VENDOR_CATEGORIES } from '@/types/vendor';
import { VendorImageGallery } from '@/components/vendors/VendorImageGallery';
import { PerformanceMetrics } from '@/components/vendors/PerformanceMetrics';

export default function PublicVendorView() {
  const { category, vendorSlug } = useParams<{ category: string; vendorSlug: string }>();
  
  const { data: vendor, isLoading, error } = useVendorBySlug(vendorSlug || '');

  if (!category || !vendorSlug) {
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
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => (
              <Badge key={index} variant="secondary" className="text-sm">
                {item}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Helmet>
        <title>{vendor.company_name} - Company Profile</title>
        <meta name="description" content={vendor.description} />
        <meta property="og:title" content={`${vendor.company_name} - Company Profile`} />
        <meta property="og:description" content={vendor.description} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${vendor.company_name} - Company Profile`} />
        <meta name="twitter:description" content={vendor.description} />
      </Helmet>

      <PageLayout>
        <div className="container mx-auto py-8 px-4 space-y-8">
          {/* Header Section */}
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                      {vendor.company_name}
                    </h1>
                    <Badge className={getCompanyTypeBadgeColor(vendor.company_type)}>
                      {vendor.company_type}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {vendor.headquarters}
                    </span>
                    {vendor.founding_year && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Founded {vendor.founding_year}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  {vendor.description}
                </p>

                <div className="flex gap-3">
                  {vendor.website_url && (
                    <Button asChild>
                      <a href={vendor.website_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Website
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Company Stats */}
              <div className="lg:w-80">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Company Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {vendor.employee_count_range && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Employees</span>
                        <span className="font-medium">{vendor.employee_count_range}</span>
                      </div>
                    )}
                    {vendor.funding_stage && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Funding Stage</span>
                        <span className="font-medium">{vendor.funding_stage}</span>
                      </div>
                    )}
                    {vendor.total_funding && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Funding</span>
                        <span className="font-medium">{vendor.total_funding}</span>
                      </div>
                    )}
                    {vendor.business_model && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Business Model</span>
                        <span className="font-medium">{vendor.business_model}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <Separator />

          {/* Performance Metrics */}
          {vendor.performance_metrics && Object.keys(vendor.performance_metrics).length > 0 && (
            <PerformanceMetrics metrics={vendor.performance_metrics} />
          )}

          {/* Services and Capabilities Grid */}
          <div className="grid gap-6 md:grid-cols-2">
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
          {vendor.vendor_images && vendor.vendor_images.length > 0 && (
            <VendorImageGallery 
              vendor={vendor}
              canEdit={false}
            />
          )}

          {/* Contact Information */}
          {(vendor.contact_email || vendor.contact_phone || vendor.contact_address || vendor.linkedin_url || vendor.twitter_url) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {vendor.contact_email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <a href={`mailto:${vendor.contact_email}`} className="text-primary hover:underline">
                      {vendor.contact_email}
                    </a>
                  </div>
                )}
                {vendor.contact_phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{vendor.contact_phone}</span>
                  </div>
                )}
                {vendor.contact_address && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address</span>
                    <span className="font-medium text-right">{vendor.contact_address}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  {vendor.linkedin_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={vendor.linkedin_url} target="_blank" rel="noopener noreferrer">
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {vendor.twitter_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={vendor.twitter_url} target="_blank" rel="noopener noreferrer">
                        Twitter
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </PageLayout>
    </>
  );
}