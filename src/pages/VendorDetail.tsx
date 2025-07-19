
import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ExternalLink, Building, Calendar, DollarSign, Users, Target, Sparkles } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RCM_SAMPLE_DATA, type Vendor } from '@/types/vendor';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const CATEGORY_DATA: Record<string, { title: string; data: Vendor[] }> = {
  rcm: {
    title: 'Revenue Cycle Management',
    data: RCM_SAMPLE_DATA
  }
};

export default function VendorDetail() {
  const { category, vendorSlug } = useParams<{ category: string; vendorSlug: string }>();

  if (!category || !vendorSlug || !CATEGORY_DATA[category]) {
    return <Navigate to="/404" replace />;
  }

  const categoryData = CATEGORY_DATA[category];
  const vendor = categoryData.data.find(v => v.slug === vendorSlug);

  if (!vendor) {
    return <Navigate to="/404" replace />;
  }

  const formatFunding = (amount?: number) => {
    if (!amount) return 'Not disclosed';
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${(amount / 1000).toFixed(0)}K`;
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

  const pageTitle = `${vendor.companyName} - ${categoryData.title} Vendor Profile`;
  const pageDescription = `${vendor.description} Founded in ${vendor.yearFounded}, ${vendor.companyName} offers ${vendor.coreServices.join(', ')} for ${vendor.targetCustomers.join(', ')}.`;

  return (
    <PageLayout>
      <Helmet>
        <title>{pageTitle} | Competitive Intelligence</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={`${vendor.companyName}, ${categoryData.title}, ${vendor.specialtyFocus.join(', ')}, ${vendor.coreServices.join(', ')}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href={`/vendors/${category}/${vendorSlug}`} />
        
        {/* Schema.org structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": vendor.companyName,
            "description": vendor.description,
            "foundingDate": vendor.yearFounded.toString(),
            "address": {
              "@type": "PostalAddress",
              "addressLocality": vendor.headquarters
            },
            "url": vendor.websiteUrl,
            "knowsLanguage": "en-US",
            "industry": categoryData.title
          })}
        </script>
      </Helmet>

      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          {/* Breadcrumb Navigation */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/vendors/${category}`}>{categoryData.title} Vendors</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{vendor.companyName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Back Button */}
          <Button variant="outline" asChild className="mb-4">
            <Link to={`/vendors/${category}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {categoryData.title} Vendors
            </Link>
          </Button>

          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">{vendor.companyName}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {vendor.headquarters}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Founded {vendor.yearFounded}
                  </div>
                  <Badge variant={getCompanyTypeBadgeColor(vendor.companyType)}>
                    {vendor.companyType}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {vendor.websiteUrl && (
                  <Button asChild>
                    <a href={vendor.websiteUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Website
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Company Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Company Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{vendor.description}</p>
                </CardContent>
              </Card>

              {/* Core Services */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Core Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {vendor.coreServices.map((service, idx) => (
                      <Badge key={idx} variant="outline">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Target Customers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Target Customers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {vendor.targetCustomers.map((customer, idx) => (
                      <Badge key={idx} variant="secondary">
                        {customer}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Specialty Focus */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Specialty Focus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {vendor.specialtyFocus.map((specialty, idx) => (
                      <Badge key={idx} variant="outline">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Key Features & Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Key Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {vendor.keyFeatures.map((feature, idx) => (
                        <Badge key={idx} variant="default">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Key Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {vendor.keyBenefits.map((benefit, idx) => (
                        <Badge key={idx} variant="secondary">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Notable Customers */}
              {vendor.notableCustomers && vendor.notableCustomers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notable Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {vendor.notableCustomers.map((customer, idx) => (
                        <Badge key={idx} variant="outline">
                          {customer}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Performance Metrics */}
              {vendor.metrics && vendor.metrics.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vendor.metrics.map((metric, idx) => (
                        <div key={idx} className="p-4 bg-muted/50 rounded-lg">
                          <p className="font-medium text-primary">{metric}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Additional Notes */}
              {vendor.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground bg-muted/50 p-4 rounded-lg leading-relaxed">
                      {vendor.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Company Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Company Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Founded</p>
                    <p className="text-2xl font-bold">{vendor.yearFounded}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Headquarters</p>
                    <p className="font-medium">{vendor.headquarters}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Company Type</p>
                    <Badge variant={getCompanyTypeBadgeColor(vendor.companyType)}>
                      {vendor.companyType}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Funding Information */}
              {(vendor.fundingRaised || vendor.latestFundingRound || vendor.investors) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Funding Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {vendor.fundingRaised && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Funding</p>
                          <p className="text-2xl font-bold text-primary">
                            {formatFunding(vendor.fundingRaised)}
                          </p>
                        </div>
                        <Separator />
                      </>
                    )}
                    {vendor.latestFundingRound && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Latest Round</p>
                          <p className="font-medium">{vendor.latestFundingRound}</p>
                        </div>
                        <Separator />
                      </>
                    )}
                    {vendor.investors && vendor.investors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Investors</p>
                        <div className="flex flex-wrap gap-1">
                          {vendor.investors.map((investor, idx) => (
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
