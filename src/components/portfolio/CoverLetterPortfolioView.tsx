
import React, { useState } from "react";
import { CompanyPortfolio } from "@/types/companyPortfolio";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, FileText, Edit, Save, X } from "lucide-react";
import { CoverLetterPageLayout } from "@/components/cover-letter/CoverLetterPageLayout";
import { VideoWithCoverLetterLayout } from "@/components/cover-letter/VideoWithCoverLetterLayout";
import { SchedulingSection } from "@/components/cover-letter/SchedulingSection";
import { HealthcareProjectsSection } from "@/components/cover-letter/HealthcareProjectsSection";
import { CoverLetterContent } from "@/data/coverLetterContent";
import { PortfolioVideoUploadSection } from "./PortfolioVideoUploadSection";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useUpdateCompanyPortfolio } from "@/hooks/useCompanyPortfolios";
import { toast } from "sonner";

interface CoverLetterPortfolioViewProps {
  portfolio: CompanyPortfolio & {
    job_applications?: {
      job_description: string;
      job_description_link?: string;
      resume_link?: string;
      cover_letter_link?: string;
      created_at: string;
    };
  };
}

const CoverLetterPortfolioView = ({ portfolio }: CoverLetterPortfolioViewProps) => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const updatePortfolio = useUpdateCompanyPortfolio();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    opening_hook: '',
    key_achievements: [''],
    strategic_fit: [''],
    call_to_action: ''
  });
  
  const jobApplication = portfolio.job_applications;

  // Initialize edit data when entering edit mode
  const handleStartEdit = () => {
    const currentContent = portfolio.generated_content?.cover_letter;
    if (currentContent && typeof currentContent === 'object') {
      setEditData({
        opening_hook: currentContent.opening_hook || '',
        key_achievements: currentContent.key_achievements || [''],
        strategic_fit: currentContent.strategic_fit || [''],
        call_to_action: currentContent.call_to_action || ''
      });
    }
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      const updatedContent = {
        ...portfolio.generated_content,
        cover_letter: editData
      };

      await updatePortfolio.mutateAsync({
        id: portfolio.id,
        generated_content: updatedContent
      });

      toast.success("Cover letter updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating cover letter:', error);
      toast.error("Failed to update cover letter. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const updateAchievement = (index: number, value: string) => {
    const newAchievements = [...editData.key_achievements];
    newAchievements[index] = value;
    setEditData(prev => ({ ...prev, key_achievements: newAchievements }));
  };

  const addAchievement = () => {
    setEditData(prev => ({ 
      ...prev, 
      key_achievements: [...prev.key_achievements, ''] 
    }));
  };

  const removeAchievement = (index: number) => {
    if (editData.key_achievements.length > 1) {
      const newAchievements = editData.key_achievements.filter((_, i) => i !== index);
      setEditData(prev => ({ ...prev, key_achievements: newAchievements }));
    }
  };

  const updateStrategicFit = (index: number, value: string) => {
    const newFit = [...editData.strategic_fit];
    newFit[index] = value;
    setEditData(prev => ({ ...prev, strategic_fit: newFit }));
  };

  const addStrategicFit = () => {
    setEditData(prev => ({ 
      ...prev, 
      strategic_fit: [...prev.strategic_fit, ''] 
    }));
  };

  const removeStrategicFit = (index: number) => {
    if (editData.strategic_fit.length > 1) {
      const newFit = editData.strategic_fit.filter((_, i) => i !== index);
      setEditData(prev => ({ ...prev, strategic_fit: newFit }));
    }
  };

  // Use custom video if available, otherwise fall back to default
  const videoSrc = portfolio.custom_video_url || 
    "https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/general//667F0B04-8D3D-429C-992C-1D8FB2883E9E%20(1)%20(1)%202.mov";

  // Create cover letter content using the generated cover letter or fallback
  const coverLetterContent: CoverLetterContent & { structured?: any } = {
    recipient: `Dear ${portfolio.company_name} Team,`,
    paragraphs: [],
    signature: {
      name: "Jordan Leahy",
      website: "jordanwilliamleahy.com"
    }
  };

  // Handle new structured format or legacy format
  if (portfolio.generated_content?.cover_letter) {
    if (typeof portfolio.generated_content.cover_letter === 'object') {
      // New structured format
      coverLetterContent.structured = portfolio.generated_content.cover_letter;
      coverLetterContent.paragraphs = []; // Empty for structured format
    } else {
      // Legacy string format
      coverLetterContent.paragraphs = [portfolio.generated_content.cover_letter];
    }
  } else {
    // Fallback content
    coverLetterContent.paragraphs = [
      `I'm writing to express my strong interest in joining ${portfolio.company_name}. With over 10 years of experience in healthcare technology and AI applications, I'm excited about the opportunity to contribute to your team's mission.`,
      `My background in clinical documentation integrity, revenue cycle management, and healthcare data analytics aligns perfectly with your needs. I've successfully implemented technology solutions that improve patient outcomes and operational efficiency across multiple healthcare organizations.`,
      `I would love to discuss how my experience can contribute to ${portfolio.company_name}'s continued success and growth. Thank you for considering my application.`
    ];
  }

  return (
    <CoverLetterPageLayout>
      {/* Admin Edit Interface */}
      {isAdmin && (
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Admin: Cover Letter Editor</CardTitle>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <Button onClick={handleStartEdit} size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Cover Letter
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleSaveEdit} size="sm" disabled={updatePortfolio.isPending}>
                        <Save className="w-4 h-4 mr-2" />
                        {updatePortfolio.isPending ? 'Saving...' : 'Save'}
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline" size="sm">
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            {isEditing && (
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Opening Hook</label>
                  <Textarea
                    value={editData.opening_hook}
                    onChange={(e) => setEditData(prev => ({ ...prev, opening_hook: e.target.value }))}
                    placeholder="One powerful sentence connecting a specific real project to company needs"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Key Achievements</label>
                  {editData.key_achievements.map((achievement, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Textarea
                        value={achievement}
                        onChange={(e) => updateAchievement(index, e.target.value)}
                        placeholder="• **Project Name**: Brief description of actual project outcome"
                        rows={2}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => removeAchievement(index)}
                        variant="outline"
                        size="sm"
                        disabled={editData.key_achievements.length <= 1}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button onClick={addAchievement} variant="outline" size="sm">
                    Add Achievement
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Strategic Fit</label>
                  {editData.strategic_fit.map((fit, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Textarea
                        value={fit}
                        onChange={(e) => updateStrategicFit(index, e.target.value)}
                        placeholder="Specific connection between real project and company need"
                        rows={2}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => removeStrategicFit(index)}
                        variant="outline"
                        size="sm"
                        disabled={editData.strategic_fit.length <= 1}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button onClick={addStrategicFit} variant="outline" size="sm">
                    Add Strategic Fit
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Call to Action</label>
                  <Textarea
                    value={editData.call_to_action}
                    onChange={(e) => setEditData(prev => ({ ...prev, call_to_action: e.target.value }))}
                    placeholder="Confident next step referencing the role or company challenge"
                    rows={2}
                  />
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}

      <VideoWithCoverLetterLayout
        videoSrc={videoSrc}
        posterSrc="/lovable-uploads/6ad28481-a75a-4096-a9f1-74822cefe882.png"
        coverLetterContent={coverLetterContent}
        portfolio={portfolio}
      />

      <SchedulingSection
        calendarSrc="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0HtVBzITEmJVDw6wxuGBdLLnH99oOFJpzPZysiE0Tr70J6k5kzzrqp6WLR8SVCmH72f8EyuUBE?gv=true"
        companyName={portfolio.company_name}
      />

      <HealthcareProjectsSection />

      {jobApplication && (jobApplication.resume_link || jobApplication.job_description_link) && (
        <div className="mt-12 text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {jobApplication.resume_link && (
              <Button asChild size="lg">
                <a href={jobApplication.resume_link} target="_blank" rel="noopener noreferrer">
                  <FileText className="w-5 h-5 mr-2" />
                  View Resume
                </a>
              </Button>
            )}
            {jobApplication.job_description_link && (
              <Button asChild variant="outline" size="lg">
                <a href={jobApplication.job_description_link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-5 h-5 mr-2" />
                  View Job Posting
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </CoverLetterPageLayout>
  );
};

export default CoverLetterPortfolioView;
