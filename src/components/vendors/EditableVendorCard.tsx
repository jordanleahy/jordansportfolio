
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Building, Edit, Save, X, Upload } from 'lucide-react';
import { type Vendor } from '@/types/vendor';
import { useVendorEdit } from '@/hooks/useVendorEdit';
import { TextEditor } from './editors/TextEditor';
import { ArrayEditor } from './editors/ArrayEditor';
import { SelectEditor } from './editors/SelectEditor';
import { Badge } from '@/components/ui/badge';
import { VENDOR_CATEGORIES, type VendorCategory } from '@/types/vendor';

interface EditableVendorCardProps {
  vendor: Vendor & { category?: VendorCategory };
  onVendorClick?: (vendor: Vendor) => void;
  onDeleteClick?: (vendor: Vendor) => void;
  onSave?: () => void;
  canEdit: boolean;
}

const COMPANY_TYPE_OPTIONS = [
  { value: 'Public', label: 'Public' },
  { value: 'Private', label: 'Private' },
  { value: 'Startup', label: 'Startup' },
  { value: 'Subsidiary', label: 'Subsidiary' },
];

export function EditableVendorCard({ 
  vendor, 
  onVendorClick, 
  onDeleteClick, 
  onSave,
  canEdit 
}: EditableVendorCardProps) {
  const {
    isEditing,
    editData,
    hasChanges,
    isSaving,
    startEdit,
    cancelEdit,
    updateField,
    saveDraft,
    publishChanges,
  } = useVendorEdit({ vendor, onSave });

  const handleCardClick = () => {
    if (!isEditing && onVendorClick) {
      onVendorClick(vendor);
    }
  };

  const handleSaveDraft = async () => {
    await saveDraft();
  };

  const handlePublish = async () => {
    await publishChanges();
  };

  return (
    <Card 
      className={`transition-all duration-200 h-full flex flex-col ${
        isEditing 
          ? 'ring-2 ring-primary bg-muted/20' 
          : 'cursor-pointer hover:shadow-lg hover:border-primary/30'
      }`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-4 flex-shrink-0 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            {isEditing ? (
              <div className="space-y-2">
                <TextEditor
                  value={editData.company_name}
                  onChange={(value) => updateField('company_name', value)}
                  placeholder="Company name"
                />
                <TextEditor
                  value={editData.headquarters}
                  onChange={(value) => updateField('headquarters', value)}
                  placeholder="Headquarters"
                />
              </div>
            ) : (
              <>
                <CardTitle className="text-xl font-bold leading-tight">
                  {vendor.company_name}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{vendor.headquarters}</span>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelEdit();
                  }}
                  className="h-8 w-8 p-0"
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveDraft();
                  }}
                  disabled={!hasChanges || isSaving}
                  className="h-8 w-8 p-0"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePublish();
                  }}
                  disabled={!hasChanges || isSaving}
                  className="h-8 px-3"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Publish
                </Button>
              </>
            ) : (
              <>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit();
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {vendor.website_url && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(vendor.website_url, '_blank');
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Category Badge & Company Type */}
        {!isEditing && (
          <div className="flex items-center gap-2 flex-wrap">
            {vendor.category && (
              <Badge variant="secondary" className="text-xs font-medium">
                {VENDOR_CATEGORIES[vendor.category].title.replace(' Companies', '')}
              </Badge>
            )}
            {vendor.company_type && (
              <Badge variant="outline" className="text-xs">
                {vendor.company_type}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-5 flex-1 flex flex-col" onClick={(e) => isEditing && e.stopPropagation()}>
        {/* Description - Primary content */}
        <div>
          {isEditing ? (
            <TextEditor
              value={editData.description}
              onChange={(value) => updateField('description', value)}
              multiline
              placeholder="Company description"
              maxLength={1000}
            />
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {vendor.description}
            </p>
          )}
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 gap-4 py-3 border-y">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Founded</div>
            {isEditing ? (
              <TextEditor
                value={editData.founding_year?.toString() || ''}
                onChange={(value) => updateField('founding_year', value ? parseInt(value) : null)}
                placeholder="Year"
              />
            ) : (
              <div className="text-base font-semibold">
                {vendor.founding_year || 'N/A'}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Funding</div>
            {isEditing ? (
              <div className="space-y-2">
                <TextEditor
                  value={editData.total_funding || ''}
                  onChange={(value) => updateField('total_funding', value)}
                  placeholder="Total funding"
                />
                <TextEditor
                  value={editData.funding_stage || ''}
                  onChange={(value) => updateField('funding_stage', value)}
                  placeholder="Funding stage"
                />
              </div>
            ) : (
              <div className="text-base font-semibold truncate">
                {vendor.total_funding || 'N/A'}
              </div>
            )}
          </div>
        </div>

        {/* Core Services - Highlight */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Core Services
          </div>
          {isEditing ? (
            <ArrayEditor
              value={editData.core_services}
              onChange={(value) => updateField('core_services', value)}
              placeholder="Add service"
              maxItems={8}
            />
          ) : (
            <div className="space-y-1.5">
              {vendor.core_services.slice(0, 3).map((service, idx) => (
                <div key={idx} className="flex items-start text-sm">
                  <span className="text-primary mr-2 mt-0.5">•</span>
                  <span>{service}</span>
                </div>
              ))}
              {vendor.core_services.length > 3 && (
                <div className="text-xs text-muted-foreground ml-4">
                  +{vendor.core_services.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>

        {/* Secondary Info - Collapsed */}
        <div className="pt-2 space-y-3 text-xs">
          <div>
            <div className="font-medium text-muted-foreground mb-1.5">Target Customers</div>
            {isEditing ? (
              <ArrayEditor
                value={editData.customers}
                onChange={(value) => updateField('customers', value)}
                placeholder="Add customer type"
                maxItems={6}
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {vendor.customers.slice(0, 3).map((customer, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs font-normal">
                    {customer}
                  </Badge>
                ))}
                {vendor.customers.length > 3 && (
                  <Badge variant="outline" className="text-xs font-normal">
                    +{vendor.customers.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="font-medium text-muted-foreground mb-1.5">Specialties</div>
            {isEditing ? (
              <ArrayEditor
                value={editData.specialties}
                onChange={(value) => updateField('specialties', value)}
                placeholder="Add specialty"
                maxItems={6}
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {vendor.specialties.slice(0, 3).map((specialty, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs font-normal">
                    {specialty}
                  </Badge>
                ))}
                {vendor.specialties.length > 3 && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    +{vendor.specialties.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
