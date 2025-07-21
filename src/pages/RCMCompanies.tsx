
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Vendor, VENDOR_CATEGORIES } from '@/types/vendor';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Building2, MapPin, Users, DollarSign, Target, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const RCMCompanies = () => {
  const { data: vendors, isLoading } = useQuery({
    queryKey: ['public-rcm-vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('status', 'published')
        .or('core_services.cs.{"Revenue Cycle Management"},core_services.cs.{"RCM"},core_services.cs.{"Medical Billing"},specialties.cs.{"Revenue Cycle"},specialties.cs.{"RCM"},company_type.ilike.%rcm%')
        .order('company_name');
      
      if (error) throw error;
      return data as Vendor[];
    },
  });

  const category = VENDOR_CATEGORIES.rcm;

  if (isLoading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
          <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>RCM Companies</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    );
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

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              {/* Breadcrumb */}
              <Breadcrumb className="mb-6">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>RCM Companies</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Building2 className="h-4 w-4" />
                  Vendor Intelligence
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {category.title}
                </h1>
                <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                  {category.description}
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{vendors?.length || 0} Companies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Funding Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Market Intelligence</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Companies Grid */}
        <div className="container mx-auto px-4 py-12">
          {vendors && vendors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {vendors.map((vendor) => (
                <Card key={vendor.id} className="group hover:shadow-lg transition-all duration-300 border hover:border-primary/20 h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                            {vendor.company_name}
                          </CardTitle>
                          <Badge className={getCompanyTypeBadgeColor(vendor.company_type)}>
                            {vendor.company_type}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          {vendor.headquarters && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {vendor.headquarters}
                            </span>
                          )}
                          {vendor.founding_year && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Founded {vendor.founding_year}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {vendor.website_url && (
                        <a
                          href={vendor.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    
                    <CardDescription className="line-clamp-3 text-sm leading-relaxed mb-4">
                      {vendor.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0 flex-1 flex flex-col">
                    <div className="space-y-4 flex-1">
                      {/* Company Overview Stats */}
                      <div className="grid grid-cols-2 gap-4 text-xs bg-muted/30 p-3 rounded-lg">
                        {vendor.employee_count_range && (
                          <div>
                            <span className="text-muted-foreground">Employees:</span>
                            <p className="font-medium">{vendor.employee_count_range}</p>
                          </div>
                        )}
                        {vendor.funding_stage && (
                          <div>
                            <span className="text-muted-foreground">Funding:</span>
                            <p className="font-medium">{vendor.funding_stage}</p>
                          </div>
                        )}
                        {vendor.total_funding && (
                          <div>
                            <span className="text-muted-foreground">Total Funding:</span>
                            <p className="font-medium">{vendor.total_funding}</p>
                          </div>
                        )}
                        {vendor.business_model && (
                          <div>
                            <span className="text-muted-foreground">Model:</span>
                            <p className="font-medium">{vendor.business_model}</p>
                          </div>
                        )}
                      </div>

                      {/* Core Services */}
                      {vendor.core_services && vendor.core_services.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            Core Services
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {vendor.core_services.slice(0, 3).map((service, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                            {vendor.core_services.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{vendor.core_services.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Target Customers */}
                      {vendor.customers && vendor.customers.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Target Customers
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {vendor.customers.slice(0, 2).map((customer, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {customer}
                              </Badge>
                            ))}
                            {vendor.customers.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{vendor.customers.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* View Details Button */}
                    <Link 
                      to={`/vendors/rcm/${vendor.slug}`}
                      className="block mt-6"
                    >
                      <Button 
                        variant="outline" 
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        View Company Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No RCM Companies Found</h3>
              <p className="text-muted-foreground">
                No published RCM companies are currently available. Check back later for updates.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default RCMCompanies;
