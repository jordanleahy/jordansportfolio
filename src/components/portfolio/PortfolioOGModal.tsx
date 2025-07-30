import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { Badge } from '@/components/ui/badge';
import { Save, X, Eye } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { CompanyPortfolio } from '@/types/companyPortfolio';
import { useUpdateCompanyPortfolio } from '@/hooks/useCompanyPortfolios';
import { toast } from 'sonner';

interface PortfolioOGModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: CompanyPortfolio;
}

export const PortfolioOGModal: React.FC<PortfolioOGModalProps> = ({
  isOpen,
  onClose,
  portfolio
}) => {
  const updatePortfolio = useUpdateCompanyPortfolio();
  const { uploadFile, uploading } = useFileUpload({ bucket: 'images', folder: 'portfolio-og' });
  
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    og_title: portfolio.og_title || '',
    og_description: portfolio.og_description || '',
    og_image_url: portfolio.og_image_url || ''
  });

  const handleImageUpload = async (file: File) => {
    const url = await uploadFile(file);
    if (url) {
      setFormData(prev => ({ ...prev, og_image_url: url }));
    }
  };

  const handleSave = async () => {
    try {
      await updatePortfolio.mutateAsync({
        id: portfolio.id,
        og_title: formData.og_title || null,
        og_description: formData.og_description || null,
        og_image_url: formData.og_image_url || null
      });

      toast.success("OG metadata updated successfully!");
      onClose();
    } catch (error) {
      console.error('Error updating OG metadata:', error);
      toast.error("Failed to update OG metadata. Please try again.");
    }
  };

  const getDefaultTitle = () => `Cover Letter for ${portfolio.company_name} - Jordan Leahy`;
  const getDefaultDescription = () => `Personalized cover letter and portfolio for ${portfolio.company_name}. Healthcare technology leadership, product development expertise, and proven track record in digital health solutions.`;
  const getDisplayTitle = () => formData.og_title || getDefaultTitle();
  const getDisplayDescription = () => formData.og_description || getDefaultDescription();
  const getDisplayImage = () => formData.og_image_url || '/og-portfolio.png';

  const hasChanges = formData.og_title !== (portfolio.og_title || '') ||
                    formData.og_description !== (portfolio.og_description || '') ||
                    formData.og_image_url !== (portfolio.og_image_url || '');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Open Graph Metadata</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
          </div>

          {showPreview && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="text-sm text-muted-foreground mb-2">Social Media Preview:</div>
              <div className="bg-card border rounded-lg overflow-hidden max-w-md">
                {getDisplayImage() && (
                  <img 
                    src={getDisplayImage()} 
                    alt="OG Preview" 
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-3">
                  <div className="font-medium text-sm line-clamp-2 mb-1">
                    {getDisplayTitle()}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {getDisplayDescription()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    jordan-leahy.com
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                OG Title 
                <Badge variant="secondary" className="ml-2 text-xs">
                  60-90 chars optimal
                </Badge>
              </label>
              <Input
                value={formData.og_title}
                onChange={(e) => setFormData(prev => ({ ...prev, og_title: e.target.value }))}
                placeholder={getDefaultTitle()}
                maxLength={100}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {formData.og_title.length}/100 characters
                {!formData.og_title && (
                  <span className="ml-2 italic">Will use default if empty</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                OG Description
                <Badge variant="secondary" className="ml-2 text-xs">
                  155-300 chars optimal
                </Badge>
              </label>
              <Textarea
                value={formData.og_description}
                onChange={(e) => setFormData(prev => ({ ...prev, og_description: e.target.value }))}
                placeholder={getDefaultDescription()}
                maxLength={300}
                rows={3}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {formData.og_description.length}/300 characters
                {!formData.og_description && (
                  <span className="ml-2 italic">Will use default if empty</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                OG Image
                <Badge variant="secondary" className="ml-2 text-xs">
                  1200x630px recommended
                </Badge>
              </label>
              <FileUpload
                onFileSelect={handleImageUpload}
                accept="image/*"
                maxSize={5 * 1024 * 1024} // 5MB
                preview={true}
                currentFile={formData.og_image_url}
                label="Upload OG Image"
                description="Recommended size: 1200x630px, max 5MB. Will use default portfolio image if empty."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={updatePortfolio.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updatePortfolio.isPending || uploading}
            >
              <Save className="h-4 w-4 mr-1" />
              {updatePortfolio.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};