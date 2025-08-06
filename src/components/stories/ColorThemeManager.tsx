import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Copy, Edit, Palette, Plus } from 'lucide-react';
import { useColorThemes, useCreateColorTheme, useUpdateColorTheme, useDeleteColorTheme } from '@/hooks/useColorThemes';
import { useAuth } from '@/contexts/AuthContext';
import { CreateColorTheme, ColorTheme, VISUAL_STYLES } from '@/types/colorTheme';
import { useToast } from '@/hooks/use-toast';
import { colorThemeService } from '@/services/colorThemeService';

import type { ColorThemeManagerProps } from '@/types/stories/ui';

export const ColorThemeManager: React.FC<ColorThemeManagerProps> = ({ trigger, isOpen: externalIsOpen, onClose: externalOnClose }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnClose ? (open: boolean) => {
    if (!open) externalOnClose();
  } : setInternalIsOpen;
  const [editingTheme, setEditingTheme] = useState<ColorTheme | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { data: themes = [], isLoading, refetch } = useColorThemes();
  const createTheme = useCreateColorTheme();
  const updateTheme = useUpdateColorTheme();
  const deleteTheme = useDeleteColorTheme();
  const { toast } = useToast();
  const { user } = useAuth();

  // Real-time theme updates handled at app level

  const [formData, setFormData] = useState<CreateColorTheme>({
    name: '',
    slug: '',
    description: '',
    primary_color: '#2563eb',
    secondary_color: '#0891b2',
    accent_color: '#16a34a',
    background_color: '#ffffff',
    text_color: '#1f2937',
    border_color: '#e5e7eb',
    color_instructions: 'Use professional colors with good contrast',
    visual_style: 'modern'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      primary_color: '#2563eb',
      secondary_color: '#0891b2',
      accent_color: '#16a34a',
      background_color: '#ffffff',
      text_color: '#1f2937',
      border_color: '#e5e7eb',
      color_instructions: 'Use professional colors with good contrast',
      visual_style: 'modern'
    });
    setEditingTheme(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTheme) {
      await updateTheme.mutateAsync({ id: editingTheme.id, ...formData });
    } else {
      await createTheme.mutateAsync(formData);
    }
    
    setIsFormOpen(false);
    resetForm();
  };

  const handleEdit = (theme: ColorTheme) => {
    setFormData({
      name: theme.name,
      slug: theme.slug,
      description: theme.description || '',
      primary_color: theme.primary_color,
      secondary_color: theme.secondary_color,
      accent_color: theme.accent_color,
      background_color: theme.background_color,
      text_color: theme.text_color,
      border_color: theme.border_color,
      color_instructions: theme.color_instructions,
      visual_style: theme.visual_style
    });
    setEditingTheme(theme);
    setIsFormOpen(true);
  };

  const handleDuplicate = async (theme: ColorTheme) => {
    try {
      const newName = `${theme.name} Copy`;
      await colorThemeService.duplicateColorTheme(theme.id, newName);
      refetch();
      toast({
        title: "Theme duplicated",
        description: `Successfully created "${newName}"`,
      });
    } catch (error: unknown) {
      toast({
        title: "Error duplicating theme",
        description: error instanceof Error ? error.message : "Failed to duplicate theme",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (theme: ColorTheme) => {
    if (theme.is_system) {
      toast({
        title: "Cannot delete system theme",
        description: "System themes cannot be deleted.",
        variant: "destructive"
      });
      return;
    }
    
    if (confirm(`Are you sure you want to delete "${theme.name}"?`)) {
      await deleteTheme.mutateAsync(theme.id);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Palette className="h-4 w-4 mr-2" />
            Manage Themes
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Color Theme Manager</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Your Color Themes</h3>
            <Button 
              onClick={() => setIsFormOpen(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Theme
            </Button>
          </div>

          {/* Theme Form */}
          {isFormOpen && (
            <Card>
              <CardHeader>
                <CardTitle>{editingTheme ? 'Edit Theme' : 'Create New Theme'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Theme Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setFormData(prev => ({ 
                            ...prev, 
                            name,
                            slug: generateSlug(name)
                          }));
                        }}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="primary_color">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          id="primary_color"
                          value={formData.primary_color}
                          onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.primary_color}
                          onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="secondary_color">Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          id="secondary_color"
                          value={formData.secondary_color}
                          onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.secondary_color}
                          onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="accent_color">Accent Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          id="accent_color"
                          value={formData.accent_color}
                          onChange={(e) => setFormData(prev => ({ ...prev, accent_color: e.target.value }))}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.accent_color}
                          onChange={(e) => setFormData(prev => ({ ...prev, accent_color: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="background_color">Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          id="background_color"
                          value={formData.background_color}
                          onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.background_color}
                          onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="text_color">Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          id="text_color"
                          value={formData.text_color}
                          onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.text_color}
                          onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="border_color">Border Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          id="border_color"
                          value={formData.border_color}
                          onChange={(e) => setFormData(prev => ({ ...prev, border_color: e.target.value }))}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.border_color}
                          onChange={(e) => setFormData(prev => ({ ...prev, border_color: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="visual_style">Visual Style</Label>
                    <Select 
                      value={formData.visual_style} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, visual_style: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(VISUAL_STYLES).map((style) => (
                          <SelectItem key={style} value={style}>
                            {style.charAt(0).toUpperCase() + style.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="color_instructions">Color Instructions</Label>
                    <Textarea
                      id="color_instructions"
                      value={formData.color_instructions}
                      onChange={(e) => setFormData(prev => ({ ...prev, color_instructions: e.target.value }))}
                      placeholder="Describe how these colors should be used in AI-generated content..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={createTheme.isPending || updateTheme.isPending}>
                      {editingTheme ? 'Update Theme' : 'Create Theme'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => {
                      setIsFormOpen(false);
                      resetForm();
                    }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Theme List */}
          <div className="grid gap-4">
            {isLoading ? (
              <p>Loading themes...</p>
            ) : (
              themes.map((theme) => (
                <Card key={theme.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{theme.name}</h4>
                          {theme.is_system && <Badge variant="secondary">System</Badge>}
                          {theme.is_default && <Badge variant="default">Default</Badge>}
                        </div>
                        {theme.description && (
                          <p className="text-sm text-muted-foreground mb-3">{theme.description}</p>
                        )}
                        
                        {/* Color Preview */}
                        <div className="flex gap-1 mb-2">
                          <div 
                            className="w-6 h-6 rounded border border-border" 
                            style={{ backgroundColor: theme.primary_color }}
                            title={`Primary: ${theme.primary_color}`}
                          />
                          <div 
                            className="w-6 h-6 rounded border border-border" 
                            style={{ backgroundColor: theme.secondary_color }}
                            title={`Secondary: ${theme.secondary_color}`}
                          />
                          <div 
                            className="w-6 h-6 rounded border border-border" 
                            style={{ backgroundColor: theme.accent_color }}
                            title={`Accent: ${theme.accent_color}`}
                          />
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Style: {theme.visual_style} • Created: {new Date(theme.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex gap-1 ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDuplicate(theme)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {!theme.is_system && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(theme)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(theme)}
                              disabled={deleteTheme.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};