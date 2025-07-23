import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X } from 'lucide-react';
import { type Vendor } from '@/types/vendor';
import { useVendorEdit } from '@/hooks/useVendorEdit';
import { TextEditor } from './editors/TextEditor';
import { ArrayEditor } from './editors/ArrayEditor';
import { SelectEditor } from './editors/SelectEditor';
import { CompetitorSelector } from './editors/CompetitorSelector';

export interface FieldConfig {
  key: keyof Vendor;
  type: 'text' | 'multiline' | 'array' | 'select' | 'number';
  label?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  maxItems?: number;
  maxLength?: number;
}

export interface SectionConfig {
  title: string;
  fields: FieldConfig[];
  description?: string;
  badge?: string;
  actionButton?: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    condition?: boolean;
  };
  actionButtons?: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    condition?: boolean;
  }[];
}

interface EditableSectionProps {
  vendor: Vendor;
  config: SectionConfig;
  onSave?: () => void;
  canEdit: boolean;
}

export function EditableSection({ vendor, config, onSave, canEdit }: EditableSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const {
    editData,
    hasChanges,
    isSaving,
    updateField,
    saveDraft,
    publishChanges,
  } = useVendorEdit({ vendor, onSave });

  const startEdit = () => {
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    const success = await publishChanges();
    if (success) {
      setIsEditing(false);
    }
  };

  const renderField = (field: FieldConfig) => {
    const value = editData[field.key];
    
    if (isEditing) {
      switch (field.type) {
        case 'text':
          return (
            <TextEditor
              value={typeof value === 'string' ? value : String(value || '')}
              onChange={(newValue) => updateField(field.key, newValue)}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
            />
          );
        
        case 'multiline':
          return (
            <TextEditor
              value={typeof value === 'string' ? value : String(value || '')}
              onChange={(newValue) => updateField(field.key, newValue)}
              placeholder={field.placeholder}
              multiline
              maxLength={field.maxLength}
            />
          );
        
        case 'array':
          // Use specialized competitor selector for competitors field
          if (field.key === 'competitors') {
            return (
              <CompetitorSelector
                value={Array.isArray(value) ? value : []}
                onChange={(newValue) => updateField(field.key, newValue)}
                maxItems={field.maxItems}
              />
            );
          }
          return (
            <ArrayEditor
              value={Array.isArray(value) ? value : []}
              onChange={(newValue) => updateField(field.key, newValue)}
              placeholder={field.placeholder}
              maxItems={field.maxItems}
            />
          );
        
        case 'select':
          return (
            <SelectEditor
              value={typeof value === 'string' ? value : ''}
              onChange={(newValue) => updateField(field.key, newValue)}
              options={field.options || []}
              placeholder={field.placeholder}
            />
          );
        
        case 'number':
          return (
            <TextEditor
              value={typeof value === 'number' ? value.toString() : ''}
              onChange={(newValue) => updateField(field.key, newValue ? parseInt(newValue) : null)}
              placeholder={field.placeholder}
            />
          );
        
        default:
          return null;
      }
    }

    // View mode rendering
    switch (field.type) {
      case 'text':
      case 'multiline':
        // Check if the value is a URL and make it clickable
        const isUrl = value && typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
        
        if (isUrl) {
          return (
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              {value}
            </a>
          );
        }
        
        return (
          <div className="text-sm text-muted-foreground">
            {typeof value === 'string' ? value : 'Not provided'}
          </div>
        );
      
      case 'array':
        if (!Array.isArray(value) || value.length === 0) {
          return <div className="text-sm text-muted-foreground">None specified</div>;
        }
        return (
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {value.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        );
      
      case 'select':
      case 'number':
        return (
          <div className="text-sm text-muted-foreground">
            {value ? String(value) : 'Not provided'}
          </div>
        );
      
      default:
        return null;
    }
  };

  // Get action buttons - support both single and multiple buttons
  const actionButtons = config.actionButtons || (config.actionButton ? [config.actionButton] : []);
  const visibleActionButtons = actionButtons.filter(button => button.condition !== false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              {config.title}
              {config.badge && (
                <Badge variant="secondary" className="text-xs">
                  {config.badge}
                </Badge>
              )}
            </CardTitle>
            {config.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {config.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {visibleActionButtons.map((button, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={button.onClick}
              >
                {button.icon && (
                  <button.icon className="mr-2 h-4 w-4" />
                )}
                {button.label}
              </Button>
            ))}
            
            {canEdit && (
              <>
                {isEditing ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelEdit}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={!hasChanges || isSaving}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={startEdit}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {config.fields.map((field) => (
          <div key={field.key}>
            {field.label && (
              <div className="font-medium text-sm mb-2">{field.label}</div>
            )}
            {renderField(field)}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
