
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Target, TrendingUp, ArrowRight } from "lucide-react";

interface StructuredCoverLetter {
  opening_hook: string;
  key_achievements: string[];
  strategic_fit: string[];
  call_to_action: string;
}

interface CoverLetterContent {
  recipient: string;
  paragraphs: (string | StructuredCoverLetter)[];
  signature: {
    name: string;
    website: string;
  };
}

interface CoverLetterSectionProps {
  content: CoverLetterContent & {
    structured?: StructuredCoverLetter;
  };
}

export const CoverLetterSection: React.FC<CoverLetterSectionProps> = ({ content }) => {
  // Parse structured content if it exists
  let structuredContent: StructuredCoverLetter | null = null;
  
  if (content.structured) {
    structuredContent = content.structured;
  } else if (content.paragraphs.length > 0 && typeof content.paragraphs[0] === 'object') {
    structuredContent = content.paragraphs[0] as StructuredCoverLetter;
  }

  return (
    <Card>
      <CardContent className="p-8">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-semibold mb-6">{content.recipient}</h2>
          
          {structuredContent ? (
            // New structured, scannable format
            <div className="space-y-8">
              {/* Opening Hook - Attention Grabber */}
              <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-lg">
                <p className="text-lg font-medium text-foreground leading-relaxed">
                  {structuredContent.opening_hook}
                </p>
              </div>

              {/* Key Achievements - Visual Bullets */}
              {structuredContent.key_achievements && structuredContent.key_achievements.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">Key Achievements</h3>
                  </div>
                  <div className="space-y-3">
                    {structuredContent.key_achievements.map((achievement, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <p 
                          className="text-muted-foreground leading-relaxed"
                          dangerouslySetInnerHTML={{ 
                            __html: achievement.replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-semibold">$1</strong>') 
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategic Fit - Company Alignment */}
              {structuredContent.strategic_fit && structuredContent.strategic_fit.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">Strategic Fit</h3>
                  </div>
                  <div className="space-y-3">
                    {structuredContent.strategic_fit.map((fit, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <p className="text-muted-foreground leading-relaxed">{fit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Call to Action - Next Steps */}
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRight className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Next Steps</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {structuredContent.call_to_action}
                </p>
              </div>
            </div>
          ) : (
            // Fallback to original format for legacy content
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              {content.paragraphs.map((paragraph, index) => (
                <p key={index} dangerouslySetInnerHTML={{ __html: typeof paragraph === 'string' ? paragraph : '' }} />
              ))}
            </div>
          )}

          <div className="mt-8 pt-6 border-t">
            <p className="text-lg font-medium">
              Best regards,<br />
              {content.signature.name}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {content.signature.website}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
