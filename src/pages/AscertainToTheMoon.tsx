import React from "react";
import { Helmet } from "react-helmet-async";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
const AscertainToTheMoon = () => {
  return <>
      <Helmet>
        <title>Cover Letter - Ascertain to the Moon</title>
        <meta name="description" content="A personal cover letter and introduction" />
      </Helmet>
      <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-background/90 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            
            
          </div>

          {/* Video and Cover Letter Section - Side by side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-[35%_1fr] gap-8 mb-12">
            {/* Video Section */}
            <Card>
              <CardContent className="p-0">
                <AspectRatio ratio={9/16}>
                  <video 
                    className="w-full h-full object-cover rounded-lg"
                    controls
                    preload="metadata"
                    muted
                    autoPlay={false}
                  >
                    <source src="https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/general/667F0B04-8D3D-429C-992C-1D8FB2883E9E%20(1)%20(1).mov" type="video/mp4" />
                    <source src="https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/general/667F0B04-8D3D-429C-992C-1D8FB2883E9E%20(1)%20(1).mov" type="video/quicktime" />
                    Your browser does not support the video tag.
                  </video>
                </AspectRatio>
              </CardContent>
            </Card>

            {/* Cover Letter Content */}
            <Card>
              <CardContent className="p-8">
                <div className="prose prose-lg max-w-none">
                  <h2 className="text-2xl font-semibold mb-6">Dear Hoshi & Eli,</h2>
                  
                  <div className="space-y-6 text-muted-foreground leading-relaxed">
                    <p>
                      I understand the challenge you're solving intimately: case managers spending 60% of their time on manual administrative tasks instead of high-impact patient care. As someone who has dedicated my career to designing AI-powered healthcare solutions that reduce administrative burden, I'm excited about the opportunity to help Ascertain reach the moon—and beyond.
                    </p>
                    
                    <p>
                      My experience directly aligns with your mission. I designed and implemented an <a href="/cases/case1" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline font-medium">AI sepsis detection system</a> that reduced mortality rates by 23% by creating a data dense custom Sepsis CDS dashboard. This project taught me how AI can transform healthcare workflows when thoughtfully integrated into existing systems—exactly what Ascertain is doing with case management.
                    </p>
                    
                    <p>
                      More specifically relevant to your work, I built a comprehensive <a href="/cases/case4" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline font-medium">prior authorization workflow system</a> that reduced response times from 3 days to 5 minutes through intelligent automation. This system processed thousands of authorizations while maintaining compliance—the same type of administrative workflow automation that's core to Ascertain's value proposition for health systems like Northwell.
                    </p>
                    
                    <p>
                      Throughout my work in Healthcare RCM, I've seen firsthand how the right design can eliminate friction for overworked clinical staff. From CDI dashboards that streamline diagnosis coding to denial management platforms that cut appeal processing from 30 to 10 minutes, I've consistently focused on creating solutions that let healthcare professionals focus on what matters most: patient care.
                    </p>
                    
                    <p>
                      Your partnership with Deerfield Management and collaboration with the Aegis Digital Consortium demonstrates the thoughtful, strategic approach needed to scale AI in healthcare. I'm particularly excited about how Ascertain is reimagining workflows from the ground up rather than just making existing processes more efficient—this philosophical alignment resonates deeply with my design approach.
                    </p>
                    
                    <p>
                      I would love to discuss how my experience designing AI-powered healthcare tools can contribute to Ascertain's mission of enabling higher quality patient care, faster care journeys, and more cost-efficient delivery. Let's schedule a conversation about taking Ascertain to the moon together.
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t">
                    <p className="text-lg font-medium">
                      Best regards,<br />
                      Jordan Leahy
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      jordanwilliamleahy.com
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Google Calendar Scheduling */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Schedule a Conversation</CardTitle>
              <CardDescription>
                Let's discuss how my experience can contribute to Ascertain's mission
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Google Calendar Appointment Scheduling begin */}
              <iframe src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0HtVBzITEmJVDw6wxuGBdLLnH99oOFJpzPZysiE0Tr70J6k5kzzrqp6WLR8SVCmH72f8EyuUBE?gv=true" style={{
                border: 0
              }} width="100%" height="600" frameBorder="0" />
              {/* end Google Calendar Appointment Scheduling */}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
    </>;
};
export default AscertainToTheMoon;