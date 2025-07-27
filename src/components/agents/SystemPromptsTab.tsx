import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { SystemPrompt } from '@/types/openaiAgent';
import { CategoryPromptEditor } from './CategoryPromptEditor';
import { PromptPresetSelector } from './PromptPresetSelector';
import { DEFAULT_CATEGORIES, getCategoryLabel } from '@/constants/categoryConstants';

interface SystemPromptsTabProps {
  systemPrompts: SystemPrompt[];
  supportedCategories: string[];
  onChange: (prompts: SystemPrompt[], categories: string[]) => void;
}

export const SystemPromptsTab = ({ 
  systemPrompts, 
  supportedCategories, 
  onChange 
}: SystemPromptsTabProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const addNewPrompt = (category: string, prompt: string) => {
    const newPrompts = [...systemPrompts, { category, prompt }];
    const newCategories = supportedCategories.includes(category) 
      ? supportedCategories 
      : [...supportedCategories, category];
    
    onChange(newPrompts, newCategories);
    setSelectedCategory('');
  };

  const updatePrompt = (index: number, prompt: string) => {
    const newPrompts = [...systemPrompts];
    newPrompts[index] = { ...newPrompts[index], prompt };
    onChange(newPrompts, supportedCategories);
  };

  // Get available categories that don't already have prompts
  const getAvailableCategories = () => {
    const usedCategories = systemPrompts.map(p => p.category);
    return DEFAULT_CATEGORIES.filter(cat => !usedCategories.includes(cat));
  };

  const removePrompt = (index: number) => {
    const newPrompts = systemPrompts.filter((_, i) => i !== index);
    const removedCategory = systemPrompts[index].category;
    
    // Remove category if no other prompts use it
    const newCategories = newPrompts.some(p => p.category === removedCategory)
      ? supportedCategories
      : supportedCategories.filter(c => c !== removedCategory);
    
    onChange(newPrompts, newCategories);
  };

  const loadPreset = (category: string, prompt: string) => {
    const existingIndex = systemPrompts.findIndex(p => p.category === category);
    
    if (existingIndex >= 0) {
      // Update existing prompt
      updatePrompt(existingIndex, prompt);
    } else {
      // Add new prompt
      addNewPrompt(category, prompt);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          System Prompts Configuration
          <PromptPresetSelector onLoadPreset={loadPreset} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Supported Categories Display */}
        <div>
          <h4 className="text-sm font-medium mb-2">Supported Categories</h4>
          <div className="flex flex-wrap gap-2">
            {supportedCategories.length > 0 ? (
              supportedCategories.map((category) => (
                <Badge key={category} variant="secondary">
                  {getCategoryLabel(category)}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No categories configured</p>
            )}
          </div>
        </div>

        {/* Existing Prompts */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Category-Specific Prompts</h4>
          {systemPrompts.length > 0 ? (
            systemPrompts.map((prompt, index) => (
              <div key={`${prompt.category}-${index}`} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Category:</span>
                    <Badge variant="secondary" className="text-sm">
                      {getCategoryLabel(prompt.category)}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePrompt(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CategoryPromptEditor
                  category={prompt.category}
                  prompt={prompt.prompt}
                  isNew={false}
                  onChange={(newPrompt) => updatePrompt(index, newPrompt)}
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No system prompts configured. Use the preset selector above to get started.
            </p>
          )}
        </div>

        {/* Add New Prompt */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Add New Category Prompt</h4>
          <CategoryPromptEditor
            category={selectedCategory}
            prompt=""
            isNew={true}
            availableCategories={getAvailableCategories()}
            onCategoryChange={setSelectedCategory}
            onSave={(category, prompt) => addNewPrompt(category, prompt)}
          />
        </div>
      </CardContent>
    </Card>
  );
};
