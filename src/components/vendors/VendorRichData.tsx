
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Mail, Phone, MapPin, Calendar, Users, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CitationViewer } from './CitationViewer';
import { CitationIndicator } from './CitationIndicator';
import { useState } from 'react';

interface VendorRichDataProps {
  companyData: any;
  researchData: any;
}

export const VendorRichData = ({ companyData, researchData }: VendorRichDataProps) => {
  const [showCitations, setShowCitations] = useState(true);
  
  if (!companyData && !researchData) return null;

  // Extract citations from research data
  const citations = researchData?.citations || {};
  const citationCount = researchData?.citation_count || 0;

  const getCitationsForField = (fieldName: string) => {
    return citations[fieldName] || [];
  };

  // Utility functions to check for meaningful data
  const hasCompanyData = () => {
    if (!companyData) return false;
    
    return !!(
      companyData.business_model ||
      companyData.company_size ||
      companyData.target_market_size ||
      companyData.geographic_presence ||
      (companyData.technology_stack && companyData.technology_stack.length > 0) ||
      (companyData.certifications && companyData.certifications.length > 0)
    );
  };

  const hasContactData = () => {
    if (!companyData?.contact_info) return false;
    
    return !!(
      companyData.contact_info.email ||
      companyData.contact_info.phone ||
      companyData.contact_info.address
    );
  };

  const hasSocialMediaData = () => {
    if (!companyData?.social_media) return false;
    
    return !!(
      companyData.social_media.linkedin ||
      companyData.social_media.twitter
    );
  };

  const hasResearchData = () => {
    if (!researchData) return false;
    
    return !!(
      researchData.research_quality ||
      researchData.confidence_level ||
      (researchData.data_sources && researchData.data_sources.length > 0) ||
      researchData.verification_status ||
      researchData.last_updated
    );
  };

  return (
    <div className="space-y-6">
      {/* Citation Toggle */}
      {citationCount > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Show Source Citations</span>
            <Badge variant="secondary" className="text-xs">
              {citationCount} total
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCitations(!showCitations)}
            className="gap-2"
          >
            {showCitations ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
            {showCitations ? 'On' : 'Off'}
          </Button>
        </div>
      )}

      {/* Citations Overview */}
      {showCitations && citationCount > 0 && (
        <CitationViewer citations={citations} citationCount={citationCount} />
      )}

      {/* Company Information - Only show if there's meaningful data */}
      {hasCompanyData() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Additional Company Information</span>
              {showCitations && getCitationsForField('company_data').length > 0 && (
                <CitationIndicator citations={getCitationsForField('company_data')} />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {companyData.business_model && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-muted-foreground">Business Model</p>
                    {showCitations && getCitationsForField('business_model').length > 0 && (
                      <CitationIndicator citations={getCitationsForField('business_model')} />
                    )}
                  </div>
                  <p className="font-medium">{companyData.business_model}</p>
                </div>
                <Separator />
              </>
            )}
            
            {companyData.company_size && (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company Size</p>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">{companyData.company_size}</span>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {companyData.target_market_size && (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Target Market</p>
                  <p className="font-medium">{companyData.target_market_size}</p>
                </div>
                <Separator />
              </>
            )}

            {companyData.geographic_presence && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-muted-foreground">Geographic Presence</p>
                    {showCitations && getCitationsForField('geographic_presence').length > 0 && (
                      <CitationIndicator citations={getCitationsForField('geographic_presence')} />
                    )}
                  </div>
                  <p className="font-medium">{companyData.geographic_presence}</p>
                </div>
                <Separator />
              </>
            )}

            {companyData.technology_stack && companyData.technology_stack.length > 0 && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">Technology Stack</p>
                    {showCitations && getCitationsForField('tech_stack').length > 0 && (
                      <CitationIndicator citations={getCitationsForField('tech_stack')} />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {companyData.technology_stack.map((tech: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {companyData.certifications && companyData.certifications.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Certifications</p>
                  {showCitations && getCitationsForField('certifications').length > 0 && (
                    <CitationIndicator citations={getCitationsForField('certifications')} />
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {companyData.certifications.map((cert: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contact Information - Only show if there's contact data */}
      {hasContactData() && (
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {companyData.contact_info.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={`mailto:${companyData.contact_info.email}`}
                  className="text-primary hover:underline"
                >
                  {companyData.contact_info.email}
                </a>
              </div>
            )}
            
            {companyData.contact_info.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={`tel:${companyData.contact_info.phone}`}
                  className="text-primary hover:underline"
                >
                  {companyData.contact_info.phone}
                </a>
              </div>
            )}
            
            {companyData.contact_info.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-sm">{companyData.contact_info.address}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Social Media - Only show if there are social media links */}
      {hasSocialMediaData() && (
        <Card>
          <CardHeader>
            <CardTitle>Social Media</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {companyData.social_media.linkedin && (
                <Button asChild variant="outline" size="sm">
                  <a 
                    href={companyData.social_media.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="gap-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    LinkedIn
                  </a>
                </Button>
              )}
              
              {companyData.social_media.twitter && (
                <Button asChild variant="outline" size="sm">
                  <a 
                    href={companyData.social_media.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="gap-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Twitter
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};
