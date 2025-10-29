import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRealtimeColorUpdates } from '@/hooks/useRealtimeColorUpdates';
import { cn } from '@/lib/utils';
import { 
  Eye, 
  EyeOff, 
  Save, 
  RotateCcw, 
  Undo2, 
  AlertTriangle,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

interface ColorProperty {
  key: string;
  label: string;
  description: string;
  category: 'primary' | 'secondary' | 'accent' | 'neutral';
}

const COLOR_PROPERTIES: ColorProperty[] = [
  {
    key: '--primary',
    label: 'Primary',
    description: 'Main brand color for buttons, links, and emphasis',
    category: 'primary'
  },
  {
    key: '--secondary',
    label: 'Secondary',
    description: 'Supporting color for secondary actions and elements',
    category: 'secondary'
  },
  {
    key: '--accent',
    label: 'Accent',
    description: 'Highlight color for call-to-action and emphasis',
    category: 'accent'
  },
  {
    key: '--background',
    label: 'Background',
    description: 'Main background color for the application',
    category: 'neutral'
  },
  {
    key: '--foreground',
    label: 'Foreground',
    description: 'Primary text color',
    category: 'neutral'
  },
  {
    key: '--border',
    label: 'Border',
    description: 'Color for borders and dividers',
    category: 'neutral'
  },
];

interface ColorPickerRealtimeProps {
  className?: string;
  showAdvanced?: boolean;
  allowCollaboration?: boolean;
}

export function ColorPickerRealtime({ 
  className,
  showAdvanced = false,
  allowCollaboration = true 
}: ColorPickerRealtimeProps) {
  const [localColors, setLocalColors] = useState<Record<string, string>>({});
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  
  const {
    isPreviewMode,
    previewColors,
    lastChangeUser,
    previewColor,
    applyPreviewColors,
    revertPreview,
    rollbackColors,
    isValidColor,
  } = useRealtimeColorUpdates({
    enabled: true,
    allowPreview: true,
    debounceMs: 300,
    onColorChange: (event) => {
      console.log('🎨 Color change detected:', event);
      if (event.preview) {
        toast.info(`Previewing ${event.property} color change`);
      }
    },
    onConflict: (event) => {
      console.log('⚠️ Color conflict detected:', event);
      setActiveUsers(prev => [...new Set([...prev, event.user_id])]);
    },
  });

  // Get current color value from DOM
  const getCurrentColor = (property: string): string => {
    const root = document.documentElement;
    const value = getComputedStyle(root).getPropertyValue(property);
    return value ? value.trim() : '';
  };

  // Initialize local colors with current DOM values
  useEffect(() => {
    const initialColors: Record<string, string> = {};
    COLOR_PROPERTIES.forEach(({ key }) => {
      initialColors[key] = getCurrentColor(key);
    });
    setLocalColors(initialColors);
  }, []);

  // Handle color input change
  const handleColorChange = (property: string, value: string) => {
    setLocalColors(prev => ({
      ...prev,
      [property]: value
    }));
    
    // Auto-preview if valid color
    if (isValidColor(value)) {
      previewColor(property, value);
    }
  };

  // Get the effective color (preview or applied)
  const getEffectiveColor = (property: string): string => {
    return previewColors[property] || localColors[property] || getCurrentColor(property);
  };

  // Category-based grouping
  const groupedProperties = COLOR_PROPERTIES.reduce((acc, prop) => {
    if (!acc[prop.category]) acc[prop.category] = [];
    acc[prop.category].push(prop);
    return acc;
  }, {} as Record<string, ColorProperty[]>);

  return (
    <Card className={cn('w-full max-w-2xl', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Real-time Color Editor</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Collaborate on color changes with live preview
            </p>
          </div>
          
          {allowCollaboration && activeUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">
                {activeUsers.length} active user{activeUsers.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-2 text-sm">
          {isPreviewMode && (
            <Badge variant="outline" className="bg-info/10 text-info border-info/20">
              <Eye className="h-3 w-3 mr-1" />
              Preview Mode
            </Badge>
          )}
          
          {lastChangeUser && lastChangeUser !== 'current-user' && (
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              Updated by {lastChangeUser}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Color Controls by Category */}
        {Object.entries(groupedProperties).map(([category, properties]) => (
          <div key={category}>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              {category} Colors
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              {properties.map(({ key, label, description }) => {
                const currentColor = getEffectiveColor(key);
                const isPreviewingThis = key in previewColors;
                
                return (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="text-sm font-medium">
                      {label}
                      {isPreviewingThis && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Preview
                        </Badge>
                      )}
                    </Label>
                    
                    <div className="flex gap-2">
                      {/* Color Preview */}
                      <div 
                        className="w-10 h-10 rounded border border-border flex-shrink-0"
                        style={{ backgroundColor: currentColor }}
                        title={`Current: ${currentColor}`}
                      />
                      
                      {/* Color Input */}
                      <div className="flex-1">
                        <Input
                          id={key}
                          type="text"
                          value={localColors[key] || ''}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          placeholder="hsl(210 11% 15%) or #2F2F32"
                          className={cn(
                            "font-mono text-sm",
                            isPreviewingThis && "border-blue-500 ring-1 ring-blue-500",
                            localColors[key] && !isValidColor(localColors[key]) && "border-red-500"
                          )}
                        />
                        
                        {description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {description}
                          </p>
                        )}
                        
                        {localColors[key] && !isValidColor(localColors[key]) && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Invalid color format
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {category !== 'neutral' && <Separator className="mt-4" />}
          </div>
        ))}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={rollbackColors}
              className="flex items-center gap-2"
            >
              <Undo2 className="h-4 w-4" />
              Rollback
            </Button>
          </div>

          <div className="flex gap-2">
            {isPreviewMode && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={revertPreview}
                  className="flex items-center gap-2"
                >
                  <EyeOff className="h-4 w-4" />
                  Cancel
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={applyPreviewColors}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Apply Changes
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="pt-4 border-t">
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                Advanced Options
              </summary>
              
              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <strong>Current CSS Variables:</strong>
                  <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
                    {COLOR_PROPERTIES.map(({ key }) => 
                      `${key}: ${getCurrentColor(key)};`
                    ).join('\n')}
                  </pre>
                </div>
              </div>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}