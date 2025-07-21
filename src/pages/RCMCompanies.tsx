import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Vendor, VENDOR_CATEGORIES } from '@/types/vendor';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Building2, MapPin, Users, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const RCMCompanies = () => {
  const { data: vendors, isLoading } = useQuery({
    queryKey: ['public-rcm-vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('status', 'published')
        .ilike('company_type', '%rcm%')
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
          <div className="container mx-auto px-4 py-12">
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

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto text-center">
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

        {/* Companies Grid */}
        <div className="container mx-auto px-4 py-12">
          {vendors && vendors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor) => (
                <Card key={vendor.id} className="group hover:shadow-lg transition-all duration-300 border hover:border-primary/20">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                          {vendor.company_name}
                        </CardTitle>
                        {vendor.headquarters && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                            <MapPin className="h-3 w-3" />
                            {vendor.headquarters}
                          </div>
                        )}
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
                    
                    <CardDescription className="line-clamp-3 text-sm leading-relaxed">
                      {vendor.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Core Services */}
                      {vendor.core_services && vendor.core_services.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Core Services</h4>
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

                      {/* Company Details */}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        {vendor.company_type && (
                          <div>
                            <span className="text-muted-foreground">Type:</span>
                            <p className="font-medium capitalize">{vendor.company_type}</p>
                          </div>
                        )}
                        {vendor.founding_year && (
                          <div>
                            <span className="text-muted-foreground">Founded:</span>
                            <p className="font-medium">{vendor.founding_year}</p>
                          </div>
                        )}
                      </div>

                      {/* View Details Button */}
                      <Link 
                        to={`/public/vendors/rcm/${vendor.slug}`}
                        className="block"
                      >
                        <Button 
                          variant="outline" 
                          className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        >
                          View Details
                        </Button>
                      </Link>
                    </div>
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