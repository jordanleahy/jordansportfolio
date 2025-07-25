import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X, Eye } from 'lucide-react';
import { useState } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { type Vendor } from '@/types/vendor';

interface OGMetadataCardProps {
  vendor: Vendor;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onUpdateField: <K extends keyof Vendor>(field: K, value: Vendor[K]) => void;
  editData: Vendor;
  isSaving: boolean;
  hasChanges: boolean;
  canEdit: boolean;
}

export function OGMetadataCard({
  vendor,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onUpdateField,
  editData,
  isSaving,
  hasChanges,
  canEdit
}: OGMetadataCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const { uploadFile, uploading } = useFileUpload({ bucket: 'images', folder: 'vendor-og' });

  const handleImageUpload = async (file: File) => {
    const url = await uploadFile(file);
    if (url) {
      onUpdateField('og_image_url', url);
    }
  };

  const getOGTitle = () => editData.og_title || `${vendor.company_name} - ${vendor.company_type} Company`;
  const getOGDescription = () => editData.og_description || vendor.description.slice(0, 155) + '...';
  const getOGImage = () => editData.og_image_url || '/og-default.png';

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg">Open Graph Metadata</CardTitle>
          <CardDescription>
            Control how this vendor appears when shared on social media
          </CardDescription>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {showPreview ? 'Hide' : 'Preview'}
            </Button>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={onSave}
                  disabled={!hasChanges || isSaving}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {showPreview && (
          <div className="mb-6 p-4 border rounded-lg bg-muted/30">
            <div className="text-sm text-muted-foreground mb-2">Social Media Preview:</div>
            <div className="bg-card border rounded-lg overflow-hidden max-w-md">
              {getOGImage() && (
                <img 
                  src={getOGImage()} 
                  alt="OG Preview" 
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-3">
                <div className="font-medium text-sm line-clamp-2 mb-1">
                  {getOGTitle()}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {getOGDescription()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {vendor.website_url || 'yourwebsite.com'}
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
            {isEditing ? (
              <Input
                value={editData.og_title || ''}
                onChange={(e) => onUpdateField('og_title', e.target.value)}
                placeholder={`${vendor.company_name} - ${vendor.company_type} Company`}
                maxLength={100}
              />
            ) : (
              <div className="p-2 bg-muted/30 rounded text-sm">
                {vendor.og_title || (
                  <span className="text-muted-foreground italic">
                    Auto-generated: {getOGTitle()}
                  </span>
                )}
              </div>
            )}
            {isEditing && (
              <div className="text-xs text-muted-foreground mt-1">
                {(editData.og_title || '').length}/100 characters
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              OG Description
              <Badge variant="secondary" className="ml-2 text-xs">
                155-300 chars optimal
              </Badge>
            </label>
            {isEditing ? (
              <Textarea
                value={editData.og_description || ''}
                onChange={(e) => onUpdateField('og_description', e.target.value)}
                placeholder={vendor.description.slice(0, 155) + '...'}
                maxLength={300}
                rows={3}
              />
            ) : (
              <div className="p-2 bg-muted/30 rounded text-sm">
                {vendor.og_description || (
                  <span className="text-muted-foreground italic">
                    Auto-generated: {getOGDescription()}
                  </span>
                )}
              </div>
            )}
            {isEditing && (
              <div className="text-xs text-muted-foreground mt-1">
                {(editData.og_description || '').length}/300 characters
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              OG Image
              <Badge variant="secondary" className="ml-2 text-xs">
                1200x630px recommended
              </Badge>
            </label>
            {isEditing ? (
              <FileUpload
                onFileSelect={handleImageUpload}
                accept="image/*"
                maxSize={5 * 1024 * 1024} // 5MB
                preview={true}
                currentFile={editData.og_image_url}
                label="Upload OG Image"
                description="Recommended size: 1200x630px, max 5MB"
              />
            ) : (
              <div className="space-y-2">
                {vendor.og_image_url ? (
                  <div className="border rounded-lg overflow-hidden max-w-sm">
                    <img 
                      src={vendor.og_image_url} 
                      alt="OG Image" 
                      className="w-full h-32 object-cover"
                    />
                  </div>
                ) : (
                  <div className="p-2 bg-muted/30 rounded text-sm text-muted-foreground italic">
                    Using default OG image
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}