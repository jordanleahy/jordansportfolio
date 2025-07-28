import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Save, X, Sparkles, Video } from "lucide-react";
import { CompanyPortfolio, StructuredCoverLetter } from '@/types/companyPortfolio';
import { useUpdateCompanyPortfolio } from "@/hooks/useCompanyPortfolios";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UploadTopVideoButton } from "./UploadTopVideoButton";

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
  const [selectedRoleType, setSelectedRoleType] = useState<'product_manager' | 'product_designer'>('product_manager');
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

  const handleRegenerateWithAgent = async () => {
    if (!portfolio.job_applications) {
      toast.error("Job application data not found");
      return;
    }

    setIsRegenerating(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User authentication required');
      }

      const { data, error } = await supabase.functions.invoke("cover-letter-agent", {
        body: { 
          jobDescription: portfolio.job_applications.job_description,
          companyName: portfolio.company_name,
          roleType: selectedRoleType,
          userId: user.id
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

      toast.success(`Cover letter regenerated for ${selectedRoleType.replace('_', ' ')} role!`);
      
    } catch (error: any) {
      console.error('Error regenerating cover letter:', error);
      toast.error(`Failed to regenerate: ${error.message}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Admin: Cover Letter Editor</CardTitle>
          <div className="flex gap-2">
            <UploadTopVideoButton 
              portfolio={portfolio} 
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            />
            {!isEditing ? (
              <>
                <div className="flex items-center gap-2">
                  <Select value={selectedRoleType} onValueChange={(value: 'product_manager' | 'product_designer') => setSelectedRoleType(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product_manager">Product Manager</SelectItem>
                      <SelectItem value="product_designer">Product Designer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleRegenerateWithAgent} 
                    size="sm" 
                    disabled={isRegenerating}
                    className="bg-gradient-to-r from-primary to-primary-glow"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isRegenerating ? 'Regenerating...' : 'Regenerate with AI'}
                  </Button>
                </div>
                <Button onClick={handleStartEdit} size="sm" variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Manual Edit
                </Button>
              </>
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
      )}
    </Card>
  );
};