import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, MapPin, ExternalLink, TrendingUp } from 'lucide-react';

const RCMCompanies = () => {
  // Sample RCM companies data - you can replace this with real data
  const companies = [
    {
      id: 1,
      name: "Example RCM Solutions",
      description: "Leading revenue cycle management solutions for healthcare providers",
      location: "New York, NY",
      employees: "500-1000",
      specialties: ["Revenue Optimization", "Claims Processing", "Denial Management"],
      website: "https://example.com"
    },
    {
      id: 2,
      name: "Healthcare Revenue Partners",
      description: "Comprehensive RCM services for hospitals and health systems",
      location: "Dallas, TX",
      employees: "200-500",
      specialties: ["Patient Access", "Coding Services", "Financial Analytics"],
      website: "https://example.com"
    },
    {
      id: 3,
      name: "MedBilling Pro",
      description: "Specialized medical billing and revenue cycle optimization",
      location: "San Francisco, CA",
      employees: "100-200",
      specialties: ["Medical Billing", "Compliance", "Revenue Analytics"],
      website: "https://example.com"
    }
  ];

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              RSAM Companies
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Discover leading Revenue Cycle Management companies and their innovative solutions 
              for healthcare revenue optimization and operational excellence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <TrendingUp className="w-5 h-5 mr-2" />
                Explore Companies
              </Button>
              <Button variant="outline" size="lg">
                <Building2 className="w-5 h-5 mr-2" />
                Submit a Company
              </Button>
            </div>
          </div>
        </section>

        {/* Companies Grid */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Featured RCM Companies</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Leading organizations driving innovation in healthcare revenue cycle management
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
                <Card key={company.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-xl text-blue-600">{company.name}</CardTitle>
                      <Badge variant="secondary">
                        <Users className="w-3 h-3 mr-1" />
                        {company.employees}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-1" />
                      {company.location}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {company.description}
                    </p>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Specialties:</h4>
                      <div className="flex flex-wrap gap-1">
                        {company.specialties.map((specialty, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Button variant="outline" className="w-full" asChild>
                      <a href={company.website} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Visit Website
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Partner with Leading RCM Companies
            </h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              Connect with industry-leading revenue cycle management companies to optimize 
              your healthcare organization's financial performance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary">
                Get in Touch
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600">
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 bg-gray-900 text-white">
          <div className="max-w-6xl mx-auto text-center">
            <h3 className="text-xl font-semibold mb-2">RSAM Companies</h3>
            <p className="text-gray-400">
              Your trusted source for healthcare revenue cycle management solutions
            </p>
            <p className="text-sm text-gray-500 mt-4">
              © {new Date().getFullYear()} RSAM Companies. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </PageLayout>
  );
};

export default RCMCompanies;