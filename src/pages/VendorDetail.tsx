import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ExternalLink, Building, Calendar, DollarSign, Users, Target, Sparkles } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useVendorBySlug } from '@/hooks/useVendors';
import { VENDOR_CATEGORIES } from '@/types/vendor';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function VendorDetail() {
  const { slugname, vendorSlug } = useParams<{ slugname: string; vendorSlug: string }>();
  
  const { data: vendor, isLoading, error } = useVendorBySlug(vendorSlug || '');

  if (!slugname || !vendorSlug || !VENDOR_CATEGORIES[slugname as keyof typeof VENDOR_CATEGORIES]) {
    return <Navigate to="/404" replace />;
  }

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
    return <Navigate to="/404" replace />;
  }

  const categoryConfig = VENDOR_CATEGORIES[slugname as keyof typeof VENDOR_CATEGORIES];

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
        <link rel="canonical" href={`/vendors/${slugname}/${vendorSlug}`} />
        
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

      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
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
                  <Link to={`/vendors/${slugname}`}>{categoryConfig.title}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{vendor.company_name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Button variant="outline" asChild className="mb-4">
            <Link to={`/vendors/${slugname}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {categoryConfig.title}
            </Link>
          </Button>

          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">{vendor.company_name}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {vendor.headquarters}
                  </div>
                  {vendor.founding_year && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Founded {vendor.founding_year}
                    </div>
                  )}
                  <Badge variant={getCompanyTypeBadgeColor(vendor.company_type)}>
                    {vendor.company_type}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Company Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{vendor.description}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Core Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {vendor.core_services.map((service, idx) => (
                      <Badge key={idx} variant="outline">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Target Customers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {vendor.customers.map((customer, idx) => (
                      <Badge key={idx} variant="secondary">
                        {customer}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Specialty Focus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {vendor.specialties.map((specialty, idx) => (
                      <Badge key={idx} variant="outline">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Key Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {vendor.key_features.map((feature, idx) => (
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
                      {vendor.key_benefits.map((benefit, idx) => (
                        <Badge key={idx} variant="secondary">
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
                    <CardTitle>Notable Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {vendor.notable_customers.map((customer, idx) => (
                        <Badge key={idx} variant="outline">
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
                    <CardTitle>Competitive Advantages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {vendor.competitive_advantages.map((advantage, idx) => (
                        <Badge key={idx} variant="default">
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
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <pre className="text-sm">{JSON.stringify(vendor.performance_metrics, null, 2)}</pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vendor.founding_year && (
                    <>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Founded</p>
                        <p className="text-2xl font-bold">{vendor.founding_year}</p>
                      </div>
                      <Separator />
                    </>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Headquarters</p>
                    <p className="font-medium">{vendor.headquarters}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Company Type</p>
                    <Badge variant={getCompanyTypeBadgeColor(vendor.company_type)}>
                      {vendor.company_type}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {(vendor.total_funding || vendor.funding_stage || (vendor.key_investors && vendor.key_investors.length > 0)) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Funding Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {vendor.total_funding && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Funding</p>
                          <p className="text-2xl font-bold text-primary">
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
                          <p className="font-medium">{vendor.funding_stage}</p>
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
