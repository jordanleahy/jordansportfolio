import React from "react";
import { Helmet } from "react-helmet-async";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { TimeOnTaskTimer } from "@/components/TimeOnTaskTimer";
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
            <Card className="bg-transparent border-none shadow-none">
              <CardContent className="p-0 space-y-4">
                <AspectRatio ratio={9/16}>
                  <video 
                    className="w-full h-full object-cover rounded-lg"
                    controls
                    preload="metadata"
                    muted
                    autoPlay={false}
                    poster="/lovable-uploads/6ad28481-a75a-4096-a9f1-74822cefe882.png"
                  >
                    <source src="https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/general//667F0B04-8D3D-429C-992C-1D8FB2883E9E%20(1)%20(1)%202.mov" type="video/mp4" />
                    <source src="https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/general//667F0B04-8D3D-429C-992C-1D8FB2883E9E%20(1)%20(1)%202.mov" type="video/quicktime" />
                    Your browser does not support the video tag.
                  </video>
                </AspectRatio>
                <TimeOnTaskTimer />
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

          {/* Healthcare Project Showcase */}
          <div className="mt-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Related Healthcare AI Experience</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Healthcare AI projects that demonstrate my experience with workflow automation and clinical decision support systems
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Inpatient Revenue Cycle Management */}
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-2">Inpatient Revenue Cycle Management</CardTitle>
                  <CardDescription className="text-sm">
                    Designed an AI-powered CDI dashboard to help CDS specialists review and validate pre-bill diagnoses.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">#RCM</span>
                    <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">#LLM</span>
                    <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">#ICD-10</span>
                  </div>
                  <button 
                    onClick={() => window.open('/cases/case1', '_blank')}
                    className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-2 group-hover:gap-3 transition-all"
                  >
                    View Case Study
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </button>
                </CardContent>
              </Card>

              {/* Drug Prior Auth and Validation */}
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                    <div className="w-6 h-6 bg-cyan-600 rounded-lg flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-sm"></div>
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-2">Drug Prior Auth and Validation</CardTitle>
                  <CardDescription className="text-sm">
                    Designed an AI drug prior authorization workflow tool that identifies formulary rules, medical requirements, step therapy, reauthorization dates, drafts the letter, and sends to the appropriate insurance company.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">#PriorAuth</span>
                    <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">#ML</span>
                    <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">#Workflow</span>
                  </div>
                  <button 
                    onClick={() => window.open('/cases/case4', '_blank')}
                    className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-2 group-hover:gap-3 transition-all"
                  >
                    View Case Study
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </button>
                </CardContent>
              </Card>

              {/* Denial and Appeal Resolution */}
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                    <div className="w-6 h-6 bg-slate-600 rounded flex items-center justify-center">
                      <div className="w-3 h-3 border border-white"></div>
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-2">Denial and Appeal Resolution</CardTitle>
                  <CardDescription className="text-sm">
                    Designed a denial and appeal resolution application for managing denials, including the drafting of templates and sending to payer.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">#Appeals</span>
                    <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">#Research</span>
                    <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">#UX</span>
                  </div>
                  <button 
                    onClick={() => window.open('/cases/case3', '_blank')}
                    className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-2 group-hover:gap-3 transition-all"
                  >
                    View Case Study
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
    </>;
};
export default AscertainToTheMoon;