import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Save, X, Sparkles, Video, ExternalLink, Settings, FileText } from "lucide-react";
import { CompanyPortfolio, StructuredCoverLetter } from '@/types/companyPortfolio';
import { useUpdateCompanyPortfolio } from "@/hooks/useCompanyPortfolios";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UploadTopVideoButton } from "./UploadTopVideoButton";
import { CoverLetterPromptModal } from "./CoverLetterPromptModal";
import { PortfolioOGModal } from "./PortfolioOGModal";
import { DocumentUploadModal } from "./DocumentUploadModal";

interface CoverLetterEditorProps {
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

export const CoverLetterEditor: React.FC<CoverLetterEditorProps> = ({ portfolio }) => {
  const updatePortfolio = useUpdateCompanyPortfolio();
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isOGModalOpen, setIsOGModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [editData, setEditData] = useState<StructuredCoverLetter>({
    opening_hook: '',
    key_achievements: [''],
    strategic_fit: [''],
    call_to_action: ''
  });

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

  const updateField = (field: keyof StructuredCoverLetter, value: string | string[]) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const updateArrayItem = (field: 'key_achievements' | 'strategic_fit', index: number, value: string) => {
    const currentArray = editData[field];
    const newArray = [...currentArray];
    newArray[index] = value;
    updateField(field, newArray);
  };

  const addArrayItem = (field: 'key_achievements' | 'strategic_fit') => {
    const currentArray = editData[field];
    updateField(field, [...currentArray, '']);
  };

  const removeArrayItem = (field: 'key_achievements' | 'strategic_fit', index: number) => {
    const currentArray = editData[field];
    if (currentArray.length > 1) {
      const newArray = currentArray.filter((_, i) => i !== index);
      updateField(field, newArray);
    }
  };

  const handleOpenIncognito = () => {
    const publicUrl = `/portfolio/${portfolio.company_slug}`;
    const fullUrl = `${window.location.origin}${publicUrl}`;
    
    // Try to open in incognito/private mode
    // Chrome uses different parameters than other browsers
    const newWindow = window.open(fullUrl, '_blank', 'noreferrer,noopener');
    
    if (!newWindow) {
      toast.error("Please allow popups and try again");
    } else {
      toast.success("Opened in new tab - use browser's incognito mode for private viewing");
    }
  };

  const handleOpenVendorPage = () => {
    const companySlug = portfolio.company_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .replace(/^-+|-+$/g, '');
    
    const vendorUrl = `https://www.jordanleahy.com/vendors/healthcare/${companySlug}`;
    window.open(vendorUrl, '_blank', 'noreferrer,noopener');
  };

  const handleRegenerateWithAgent = async (customPrompt: string, roleType: 'product_manager' | 'product_designer') => {
    if (!portfolio.job_applications) {
      toast.error("Job application data not found");
      return;
    }

    setIsRegenerating(true);
    setIsPromptModalOpen(false);
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User authentication required');
      }

      const { data, error } = await supabase.functions.invoke("cover-letter-agent", {
        body: { 
          jobDescription: portfolio.job_applications.job_description,
          companyName: portfolio.company_name,
          roleType: roleType,
          userId: user.id,
          additionalContext: customPrompt
        },
      });

      if (error || !data?.success) {
        throw new Error(error?.message || 'Failed to regenerate cover letter');
      }

      const updatedContent = {
        ...portfolio.generated_content,
        cover_letter: data.coverLetter
      };

      await updatePortfolio.mutateAsync({
        id: portfolio.id,
        generated_content: updatedContent
      });

      toast.success(`Cover letter regenerated with custom instructions!`);
      
    } catch (error: any) {
      console.error('Error regenerating cover letter:', error);
      toast.error(`Failed to regenerate: ${error.message}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <>
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex justify-center gap-2 bg-transparent p-2 rounded-full z-50">
        {!isEditing ? (
          <>
            <Button 
              onClick={() => setIsDocumentModalOpen(true)}
              size="default" 
              variant="outline" 
              className="w-12 h-12 p-3"
            >
              <FileText className="w-5 h-5" />
            </Button>
            
            <UploadTopVideoButton
              portfolio={portfolio} 
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 w-12 h-12 p-3"
            />
            
            <Button 
              onClick={() => setIsPromptModalOpen(true)} 
              size="default" 
              disabled={isRegenerating}
              className="bg-gradient-to-r from-primary to-primary-glow w-12 h-12 p-3"
            >
              <Sparkles className="w-5 h-5" />
            </Button>
            
            <Button onClick={() => setIsOGModalOpen(true)} size="default" variant="outline" className="w-12 h-12 p-3">
              <Settings className="w-5 h-5" />
            </Button>
            
            <Button onClick={handleStartEdit} size="default" variant="outline" className="w-12 h-12 p-3">
              <Edit className="w-5 h-5" />
            </Button>
            
            <Button onClick={handleOpenIncognito} size="default" variant="outline" className="w-12 h-12 p-3">
              <ExternalLink className="w-5 h-5" />
            </Button>
            
            <Button onClick={handleOpenVendorPage} size="default" variant="outline" className="w-12 h-12 p-3">
              <FileText className="w-5 h-5" />
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleSaveEdit} size="default" disabled={updatePortfolio.isPending} className="w-12 h-12 p-3">
              <Save className="w-5 h-5" />
            </Button>
            <Button onClick={handleCancelEdit} variant="outline" size="default" className="w-12 h-12 p-3">
              <X className="w-5 h-5" />
            </Button>
          </>
        )}
      </div>

      {isEditing && (
        <Card>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Opening Hook</label>
              <Textarea
                value={editData.opening_hook}
                onChange={(e) => updateField('opening_hook', e.target.value)}
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
                    onChange={(e) => updateArrayItem('key_achievements', index, e.target.value)}
                    placeholder="• **Project Name**: Brief description of actual project outcome"
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => removeArrayItem('key_achievements', index)}
                    variant="outline"
                    size="sm"
                    disabled={editData.key_achievements.length <= 1}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button onClick={() => addArrayItem('key_achievements')} variant="outline" size="sm">
                Add Achievement
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Strategic Fit</label>
              {editData.strategic_fit.map((fit, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Textarea
                    value={fit}
                    onChange={(e) => updateArrayItem('strategic_fit', index, e.target.value)}
                    placeholder="Specific connection between real project and company need"
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => removeArrayItem('strategic_fit', index)}
                    variant="outline"
                    size="sm"
                    disabled={editData.strategic_fit.length <= 1}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button onClick={() => addArrayItem('strategic_fit')} variant="outline" size="sm">
                Add Strategic Fit
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Call to Action</label>
              <Textarea
                value={editData.call_to_action}
                onChange={(e) => updateField('call_to_action', e.target.value)}
                placeholder="Confident next step referencing the role or company challenge"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      )}
      
      <CoverLetterPromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        onSubmit={handleRegenerateWithAgent}
        isLoading={isRegenerating}
      />
      
      <PortfolioOGModal
        isOpen={isOGModalOpen}
        onClose={() => setIsOGModalOpen(false)}
        portfolio={portfolio}
      />
      
      <DocumentUploadModal
        isOpen={isDocumentModalOpen}
        onClose={() => setIsDocumentModalOpen(false)}
        jobApplicationId={portfolio.job_application_id}
      />
    </>
  );
};