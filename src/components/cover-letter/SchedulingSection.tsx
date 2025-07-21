
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SchedulingSectionProps {
  title?: string;
  description?: string;
  calendarSrc: string;
  companyName?: string;
}

export const SchedulingSection: React.FC<SchedulingSectionProps> = ({
  title = "Schedule a Conversation",
  description,
  calendarSrc,
  companyName
}) => {
  const defaultDescription = companyName 
    ? `Let's discuss how my experience can contribute to ${companyName}'s mission`
    : "Let's discuss how my experience can contribute to your mission";

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description || defaultDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <iframe 
          src={calendarSrc}
          style={{ border: 0 }} 
          width="100%" 
          height="600" 
          frameBorder="0" 
        />
      </CardContent>
    </Card>
  );
};
