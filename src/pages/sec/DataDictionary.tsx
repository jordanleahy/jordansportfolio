import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLayout } from '@/components/layout/PageLayout';
import { ArrowLeft, Building2, DollarSign, FileText, MapPin, Users, Calendar, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const DataDictionary = () => {
  const dataCategories = [
    {
      icon: Building2,
      title: "Company Information",
      description: "Basic information about the issuing company",
      fields: [
        {
          name: "Entity Name",
          description: "Legal name of the company issuing securities",
          filterUsage: "Search by company name to find specific organizations",
          examples: ["Tesla Inc", "SpaceX", "Stripe Inc"]
        },
        {
          name: "Industry Group Type", 
          description: "Primary business sector classification",
          filterUsage: "Filter by technology sectors like Software, Biotechnology, etc.",
          examples: ["Computer Software", "Biotechnology", "Internet", "FinTech"]
        },
        {
          name: "Entity Type",
          description: "Legal structure of the organization",
          filterUsage: "Understand the corporate structure",
          examples: ["Corporation", "Limited Liability Company", "Partnership"]
        },
        {
          name: "Year of Incorporation",
          description: "When the company was legally established",
          filterUsage: "Find newer vs established companies",
          examples: ["2020", "2015", "2010"]
        }
      ]
    },
    {
      icon: DollarSign,
      title: "Financial Data",
      description: "Funding amounts and financial metrics",
      fields: [
        {
          name: "Total Offering Amount",
          description: "Total amount the company intends to raise",
          filterUsage: "Filter by funding size ranges ($500k-$2M, $5M+, etc.)",
          examples: ["$1,000,000", "$5,500,000", "$25,000,000"]
        },
        {
          name: "Total Amount Sold",
          description: "Amount actually raised so far",
          filterUsage: "Find companies that have fully raised or are still fundraising",
          examples: ["$750,000", "$5,500,000", "$20,000,000"]
        },
        {
          name: "Total Remaining",
          description: "Amount still available to raise (Offering - Sold)",
          filterUsage: "Identify companies with remaining funding capacity",
          examples: ["$250,000", "$0", "$5,000,000"]
        },
        {
          name: "Minimum Investment",
          description: "Smallest investment amount accepted",
          filterUsage: "Find opportunities matching your investment capacity",
          examples: ["$1,000", "$25,000", "$100,000"]
        },
        {
          name: "Revenue Range",
          description: "Company's annual revenue bracket",
          filterUsage: "Assess company maturity and scale",
          examples: ["No Revenues", "$1-5 million", "Over $100 million"]
        }
      ]
    },
    {
      icon: Users,
      title: "Investment Details",
      description: "Types of securities and investor information",
      fields: [
        {
          name: "Security Type",
          description: "Type of investment being offered",
          filterUsage: "Filter by equity, debt, or other security types",
          examples: ["Equity", "Debt", "Pooled Investment Fund"]
        },
        {
          name: "Federal Exemptions",
          description: "SEC regulations under which the offering is made",
          filterUsage: "Understand regulatory framework",
          examples: ["506(b)", "506(c)", "504"]
        },
        {
          name: "Accredited Investors Only",
          description: "Whether offering is limited to accredited investors",
          filterUsage: "Determine investment eligibility requirements",
          examples: ["Yes", "No"]
        },
        {
          name: "Number of Investors",
          description: "Total investors who have already invested",
          filterUsage: "Gauge investor interest and validation",
          examples: ["5", "25", "100"]
        }
      ]
    },
    {
      icon: MapPin,
      title: "Geographic Information",
      description: "Location and jurisdiction details",
      fields: [
        {
          name: "State/Country",
          description: "Where the company is incorporated",
          filterUsage: "Filter by specific states (NY, CA, DE, etc.)",
          examples: ["Delaware", "California", "New York"]
        },
        {
          name: "City",
          description: "Primary business location",
          filterUsage: "Find companies in specific metropolitan areas",
          examples: ["San Francisco", "New York", "Austin"]
        },
        {
          name: "Jurisdiction of Incorporation",
          description: "Legal jurisdiction where company was formed",
          filterUsage: "Understand legal and tax implications",
          examples: ["Delaware", "Nevada", "Wyoming"]
        }
      ]
    },
    {
      icon: Calendar,
      title: "Timeline Information",
      description: "Important dates and deadlines",
      fields: [
        {
          name: "Filing Date",
          description: "When the Form D was submitted to the SEC",
          filterUsage: "Find recent filings or track timing patterns",
          examples: ["2024-01-15", "2023-12-20", "2024-02-01"]
        },
        {
          name: "First Sale Date",
          description: "When the first securities were sold",
          filterUsage: "Understand fundraising timeline",
          examples: ["2024-01-01", "2023-11-15", "2024-01-30"]
        },
        {
          name: "Is Amendment",
          description: "Whether this is an updated filing",
          filterUsage: "Track changes to existing offerings",
          examples: ["Yes", "No"]
        }
      ]
    },
    {
      icon: Shield,
      title: "Regulatory Information",
      description: "Compliance and regulatory details",
      fields: [
        {
          name: "Over 100 Persons Flag",
          description: "Whether the issuer has >100 beneficial owners",
          filterUsage: "Understand company ownership structure",
          examples: ["Yes", "No"]
        },
        {
          name: "Business Combination Transaction",
          description: "Whether this involves a merger or acquisition",
          filterUsage: "Find M&A related fundraising",
          examples: ["Yes", "No"]
        },
        {
          name: "Investment Fund Type",
          description: "Type of fund if applicable",
          filterUsage: "Filter investment vehicles vs operating companies",
          examples: ["Hedge Fund", "Private Equity", "Venture Capital"]
        }
      ]
    }
  ];

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/sec" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to SEC Dashboard
                </Link>
              </Button>
            </div>

            <div className="text-center space-y-4 mb-8">
              <h1 className="text-3xl font-bold text-foreground">SEC Data Dictionary</h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Comprehensive guide to all data fields available in SEC Form D filings. 
                Use this reference to understand what each field means and how to filter effectively.
              </p>
            </div>

            {/* Overview Card */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  About SEC Form D Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Form D is filed by companies when they sell securities under certain exemptions from SEC registration requirements. 
                    This data provides insights into private fundraising activities across various industries and company stages.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold">Companies Covered</h4>
                      <p className="text-sm text-muted-foreground">Startups to established businesses raising private capital</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold">Filing Frequency</h4>
                      <p className="text-sm text-muted-foreground">Filed within 15 days of first sale of securities</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold">Data Freshness</h4>
                      <p className="text-sm text-muted-foreground">Updated regularly from SEC EDGAR database</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Categories */}
            <div className="grid grid-cols-1 gap-6">
              {dataCategories.map((category, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <category.icon className="h-6 w-6 text-primary" />
                      {category.title}
                    </CardTitle>
                    <p className="text-muted-foreground">{category.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {category.fields.map((field, fieldIndex) => (
                        <div key={fieldIndex} className="border rounded-lg p-4 space-y-3">
                          <div>
                            <h4 className="font-semibold text-sm">{field.name}</h4>
                            <p className="text-sm text-muted-foreground">{field.description}</p>
                          </div>
                          
                          <div>
                            <Badge variant="outline" className="text-xs mb-2">How to Filter</Badge>
                            <p className="text-xs text-muted-foreground">{field.filterUsage}</p>
                          </div>
                          
                          <div>
                            <p className="text-xs font-medium mb-1">Examples:</p>
                            <div className="flex flex-wrap gap-1">
                              {field.examples.map((example, exampleIndex) => (
                                <Badge key={exampleIndex} variant="secondary" className="text-xs">
                                  {example}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tips Section */}
            <Card>
              <CardHeader>
                <CardTitle>Filtering Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Effective Search Strategies</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Use company names or partial matches in search</li>
                      <li>• Combine multiple industry filters for broader results</li>
                      <li>• Filter by amount ranges to match your criteria</li>
                      <li>• Use state filters to focus on specific regions</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Understanding the Data</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Form D filings are self-reported by companies</li>
                      <li>• Not all private fundraising requires Form D filing</li>
                      <li>• Data may include multiple rounds from same company</li>
                      <li>• Amendment filings update previous submissions</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default DataDictionary;