
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
      className={`transition-colors h-full flex flex-col ${
        isEditing 
          ? 'ring-2 ring-primary bg-muted/20' 
          : 'cursor-pointer hover:bg-muted/50'
      }`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="min-w-0 flex-1">
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
                <div className="font-semibold truncate">{vendor.company_name}</div>
                <div className="text-sm text-muted-foreground font-normal truncate">
                  {vendor.headquarters}
                </div>
                {vendor.category && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {VENDOR_CATEGORIES[vendor.category].title.replace(' Companies', '')}
                  </Badge>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
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
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3 flex-1 flex flex-col" onClick={(e) => isEditing && e.stopPropagation()}>
        <div className="flex-1">
          <div className="text-sm font-medium mb-1">Description</div>
          {isEditing ? (
            <TextEditor
              value={editData.description}
              onChange={(value) => updateField('description', value)}
              multiline
              placeholder="Company description"
              maxLength={1000}
            />
          ) : (
            <div className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {vendor.description}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="font-medium mb-1">Type</div>
            {isEditing ? (
              <SelectEditor
                value={editData.company_type}
                onChange={(value) => updateField('company_type', value)}
                options={COMPANY_TYPE_OPTIONS}
                placeholder="Select type"
              />
            ) : (
              <div className="text-muted-foreground text-xs">
                {vendor.company_type}
              </div>
            )}
          </div>
          <div>
            <div className="font-medium mb-1">Founded</div>
            {isEditing ? (
              <TextEditor
                value={editData.founding_year?.toString() || ''}
                onChange={(value) => updateField('founding_year', value ? parseInt(value) : null)}
                placeholder="Year"
              />
            ) : (
              <div className="text-muted-foreground text-xs">
                {vendor.founding_year || 'N/A'}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="font-medium mb-1 text-sm">Funding</div>
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
            <div className="text-xs text-muted-foreground">
              {vendor.total_funding || 'Not disclosed'}
              {vendor.funding_stage && (
                <div className="text-xs mt-1">{vendor.funding_stage}</div>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="font-medium mb-1 text-sm">Core Services</div>
          {isEditing ? (
            <ArrayEditor
              value={editData.core_services}
              onChange={(value) => updateField('core_services', value)}
              placeholder="Add service"
              maxItems={8}
            />
          ) : (
            <ul className="text-xs text-muted-foreground space-y-1">
              {vendor.core_services.map((service, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{service}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="font-medium mb-1 text-sm">Target Customers</div>
          {isEditing ? (
            <ArrayEditor
              value={editData.customers}
              onChange={(value) => updateField('customers', value)}
              placeholder="Add customer type"
              maxItems={6}
            />
          ) : (
            <ul className="text-xs text-muted-foreground space-y-1">
              {vendor.customers.map((customer, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{customer}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="font-medium mb-1 text-sm">Specialties</div>
          {isEditing ? (
            <ArrayEditor
              value={editData.specialties}
              onChange={(value) => updateField('specialties', value)}
              placeholder="Add specialty"
              maxItems={6}
            />
          ) : (
            <ul className="text-xs text-muted-foreground space-y-1">
              {vendor.specialties.map((specialty, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{specialty}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
