import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const TorchDentalCoverLetter = () => {
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const jobData = {
    companyName: 'Torch Dental',
    jobTitle: 'Product Manager for AI Initiatives',
    jobDescription: `Torch Dental is a rapidly growing start-up whose mission is to improve the lives of healthcare providers by simplifying supply ordering, providing transparent pricing, and modernizing a previously outdated ordering process. Torch is targeting the $100+ billion office-based healthcare supply industry, starting with dental practices.

Role Overview: As the Product Manager for AI Initiatives, you will be the driving force behind the development and launch of new AI products and features for dental practices. You will partner directly with our CEO, CTO, and an elite cross-functional team to deliver transformative solutions that solve the most important challenges faced by dental practices today.

Responsibilities:
- Lead AI Product Strategy: Develop and execute the product vision and roadmap for Torch Dental's AI initiatives, balancing innovation, technical feasibility, and business impact
- Research & Insights: Proactively identify market opportunities, conduct in-depth research on dental workflows, and gather feedback from customers to guide AI-powered product development
- Stakeholder Partnership: Interface closely with C-suite, engineering, and marketing teams to translate business needs into actionable technical requirements
- Product Development: Own the full product lifecycle—from ideation and specification through prototyping, testing, launch, and post-launch optimization
- AI Integration: Inform how AI is integrated into Torch Dental's products and how various products integrate into a product suite offered to dental practices
- Metrics & Success: Define clear KPIs, track product adoption and performance, and advocate for continuous improvement based on user data and market trends

Requirements:
- 5–7 years of work experience, with a demonstrated track record of success at top tier tech startups, big tech or professional services firms
- 3+ years of product management experience with AI/ML-based products
- Strong academic credentials: Degree from a top institution in Computer Science, Engineering, or Business
- Technical fluency—comfortable discussing architectures and collaborating with engineers
- Exceptional strategic, analytical, and communication skills, with an entrepreneurial drive
- Relentless customer focus with ability to balance visionary innovation and pragmatic design
- Experience building products in healthcare, dental, SaaS, or AI-driven environments is highly desirable
- Must be able to work full-time, in person, in New York City`,
    roleType: 'Product Manager',
    userId: null,
    additionalContext: 'Healthcare AI experience including revenue cycle management, prior authorization systems, and clinical decision support tools. Extensive background in healthcare product management with focus on AI/ML implementations.'
  };

  const generateCoverLetter = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('cover-letter-agent', {
        body: jobData
      });
      
      if (error) {
        console.error('Cover letter generation error:', error);
        toast.error('Failed to generate cover letter. Please try again.');
        return;
      }
      
      if (data?.coverLetter) {
        setCoverLetter(data.coverLetter);
        toast.success('Cover letter generated successfully!');
      } else if (data?.content) {
        setCoverLetter(data.content);
        toast.success('Cover letter generated successfully!');
      } else {
        console.log('Full response:', data);
        toast.error('Unexpected response format. Check console for details.');
      }
    } catch (err) {
      console.error('Exception during cover letter generation:', err);
      toast.error('An error occurred while generating the cover letter.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCoverLetter = () => {
    if (!coverLetter) return;
    
    const blob = new Blob([coverLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'torch-dental-cover-letter.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Torch Dental - Product Manager for AI Initiatives
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Generate a personalized cover letter for the Product Manager for AI Initiatives role at Torch Dental,
            leveraging your healthcare AI experience and product management background.
          </div>
          
          {!coverLetter ? (
            <Button 
              onClick={generateCoverLetter} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Cover Letter...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Cover Letter
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={generateCoverLetter} 
                  disabled={isGenerating}
                  variant="outline"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    'Regenerate'
                  )}
                </Button>
                <Button onClick={downloadCoverLetter} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
              
              <Card>
                <CardContent className="p-6">
                  <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                    {coverLetter}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};