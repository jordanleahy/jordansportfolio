import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Download, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

export const CoverLetterGenerator = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: new Date().toLocaleDateString(),
    companyName: 'Veeva Labs',
    position: 'Director of Product Design',
    hiringManager: 'Hiring Manager'
  });

  const [generatedLetter, setGeneratedLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const veevaJobDetails = {
    role: 'Director of Product Design',
    company: 'Veeva Labs',
    responsibilities: [
      'UX design strategy for Veeva Labs platform',
      'Create design strategy for Veeva labs products',
      'Create design artifacts, wireframes, mockups, and prototypes',
      'Distill complex processes into intuitive UI workflows',
      'Partner with Product Management and Engineering'
    ],
    requirements: [
      '7+ years professional experience',
      'HCI or design or related field',
      'Portfolio of shipped UX and UI work',
      'Experience with design systems',
      'SaaS enterprise solutions experience',
      'Experience mentoring designers'
    ]
  };

  const generateCoverLetter = () => {
    setIsGenerating(true);
    
    const coverLetter = `${formData.date}

Dear ${formData.hiringManager},

I am writing to express my strong interest in the Director of Product Design position at Veeva Labs. Having spent significant time in the pharmaceutical ecosystem through my roles at BCG and PrescriberPoint, I bring a unique perspective that aligns perfectly with Veeva's mission to build innovative applications for the life sciences industry.

**Strategic Design Leadership & Pharma Expertise**

My experience at BCG provided me with deep insights into pharmaceutical business strategy and operational challenges, while my time at PrescriberPoint gave me hands-on experience understanding the daily workflows and pain points of healthcare professionals. This dual perspective—strategic and tactical—positions me uniquely to lead UX design strategy for Veeva Labs' platform, ensuring our solutions address real user needs while supporting broader business objectives.

**Product Design Excellence**

Throughout my career, I have consistently delivered design solutions that transform complex pharmaceutical processes into intuitive user experiences. My approach aligns directly with Veeva Labs' mission to build applications to the highest standards:

• **Strategic Design Vision**: I excel at creating comprehensive design strategies that balance user needs with business goals, particularly in complex enterprise environments
• **Rapid Prototyping & Iteration**: Proven ability to quickly create design artifacts, wireframes, and prototypes that effectively communicate new initiatives to stakeholders
• **Complex Process Simplification**: My pharma background enables me to distill intricate regulatory and commercial processes into clean, intuitive UI workflows
• **Cross-functional Collaboration**: Extensive experience partnering with Product Management and Engineering teams throughout the entire product lifecycle

**Enterprise SaaS & Design Systems**

My portfolio demonstrates deep experience designing UX and UI for SaaS enterprise solutions, with particular strength in creating and maintaining design systems that scale across multiple products. I understand the unique challenges of enterprise software—balancing powerful functionality with usability, ensuring consistency across complex workflows, and designing for users with varying technical expertise.

**Team Development & Mentorship**

As a design leader, I am passionate about building strong design teams. My experience mentoring designers has taught me the importance of creating an environment where creativity flourishes while maintaining high design standards—exactly the kind of culture that enables teams to pioneer new technologies and architectures.

**Why Veeva Labs**

What excites me most about this opportunity is Veeva Labs' commitment to building products that are truly loved by their users. Too often in enterprise software, usability is sacrificed for functionality. Veeva Labs' approach—building innovative applications to the highest standards while pioneering new technologies—represents the kind of product philosophy I'm passionate about leading.

My pharma industry knowledge, combined with my design leadership experience, positions me to immediately contribute to Veeva Labs' success while building upon the strong foundation you've established.

I would welcome the opportunity to discuss how my unique background and design expertise can contribute to Veeva Labs' continued innovation in the life sciences space.

Thank you for your consideration.

Best regards,
${formData.name}
${formData.email}
${formData.phone}`;

    setGeneratedLetter(coverLetter);
    setIsGenerating(false);
    toast.success('Cover letter generated successfully!');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLetter);
    toast.success('Cover letter copied to clipboard!');
  };

  const downloadLetter = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedLetter], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Cover_Letter_${formData.companyName}_${formData.position}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Cover letter downloaded!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Cover Letter Generator</h1>
        <p className="text-muted-foreground">
          Create a tailored cover letter for the Veeva Labs Director of Product Design position
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Your Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your.email@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hiringManager">Hiring Manager</Label>
              <Input
                id="hiringManager"
                value={formData.hiringManager}
                onChange={(e) => setFormData(prev => ({ ...prev, hiringManager: e.target.value }))}
                placeholder="Hiring Manager or specific name if known"
              />
            </div>

            <Button 
              onClick={generateCoverLetter}
              disabled={!formData.name || !formData.email || isGenerating}
              className="w-full"
            >
              {isGenerating ? 'Generating...' : 'Generate Cover Letter'}
            </Button>
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle>Veeva Labs - Director of Product Design</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Key Responsibilities:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {veevaJobDetails.responsibilities.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Requirements:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {veevaJobDetails.requirements.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Your Advantage:</p>
              <p className="text-sm text-blue-700 mt-1">
                Your BCG and PrescriberPoint experience provides unique pharma industry insights that align perfectly with Veeva's life sciences focus.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generated Cover Letter */}
      {generatedLetter && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated Cover Letter
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadLetter}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={generatedLetter}
              onChange={(e) => setGeneratedLetter(e.target.value)}
              className="min-h-[600px] font-mono text-sm"
              placeholder="Your generated cover letter will appear here..."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};