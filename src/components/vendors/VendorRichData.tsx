
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

      {/* Company Information */}
      {companyData && Object.keys(companyData).length > 0 && (
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

      {/* Contact Information */}
      {companyData?.contact_info && (
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

      {/* Social Media */}
      {companyData?.social_media && (
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

      {/* Research Insights */}
      {researchData && Object.keys(researchData).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Research Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {researchData.research_quality && (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Research Quality</p>
                  <Badge variant="secondary" className="capitalize">
                    {researchData.research_quality}
                  </Badge>
                </div>
                <Separator />
              </>
            )}
            
            {researchData.confidence_level && (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Confidence Level</p>
                  <Badge variant="outline" className="capitalize">
                    {researchData.confidence_level}
                  </Badge>
                </div>
                <Separator />
              </>
            )}
            
            {researchData.data_sources && researchData.data_sources.length > 0 && (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Data Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {researchData.data_sources.map((source: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs capitalize">
                        {source}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}
            
            {researchData.verification_status && (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Verification Status</p>
                  <Badge 
                    variant={researchData.verification_status === 'verified' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {researchData.verification_status}
                  </Badge>
                </div>
                <Separator />
              </>
            )}
            
            {researchData.last_updated && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">
                    {new Date(researchData.last_updated).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
