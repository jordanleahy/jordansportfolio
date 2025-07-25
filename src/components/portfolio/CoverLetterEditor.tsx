import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Save, X } from "lucide-react";
import { CompanyPortfolio, StructuredCoverLetter } from '@/types/companyPortfolio';
import { useUpdateCompanyPortfolio } from "@/hooks/useCompanyPortfolios";
import { toast } from "sonner";

interface CoverLetterEditorProps {
  portfolio: CompanyPortfolio;
}

export const CoverLetterEditor: React.FC<CoverLetterEditorProps> = ({ portfolio }) => {
  const updatePortfolio = useUpdateCompanyPortfolio();
  const [isEditing, setIsEditing] = useState(false);
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

  return (
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