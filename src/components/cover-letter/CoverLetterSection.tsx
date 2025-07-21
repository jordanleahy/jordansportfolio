
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CoverLetterContent } from "@/data/coverLetterContent";

interface CoverLetterSectionProps {
  content: CoverLetterContent;
}

export const CoverLetterSection: React.FC<CoverLetterSectionProps> = ({ content }) => {
  return (
    <Card>
      <CardContent className="p-8">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-semibold mb-6">{content.recipient}</h2>
          
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            {content.paragraphs.map((paragraph, index) => (
              <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />
            ))}
          </div>

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
