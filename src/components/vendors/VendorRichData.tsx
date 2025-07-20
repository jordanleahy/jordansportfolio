
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Mail, Phone, MapPin, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VendorRichDataProps {
  companyData: any;
  researchData: any;
}

export const VendorRichData = ({ companyData, researchData }: VendorRichDataProps) => {
  if (!companyData && !researchData) return null;

  return (
    <div className="space-y-6">
      {/* Company Information */}
      {companyData && Object.keys(companyData).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {companyData.business_model && (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Business Model</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Geographic Presence</p>
                  <p className="font-medium">{companyData.geographic_presence}</p>
                </div>
                <Separator />
              </>
            )}

            {companyData.technology_stack && companyData.technology_stack.length > 0 && (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Technology Stack</p>
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
                <p className="text-sm font-medium text-muted-foreground mb-2">Certifications</p>
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
            {researchData.competitors && researchData.competitors.length > 0 && (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Key Competitors</p>
                  <div className="flex flex-wrap gap-2">
                    {researchData.competitors.map((competitor: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {competitor}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {researchData.recent_news && researchData.recent_news.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Recent News</p>
                <ul className="space-y-2">
                  {researchData.recent_news.map((news: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground mt-1 flex-shrink-0" />
                      <span>{news}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
