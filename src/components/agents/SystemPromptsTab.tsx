import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { SystemPrompt } from '@/types/openaiAgent';
import { CategoryPromptEditor } from './CategoryPromptEditor';

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

  const updatePromptCategory = (index: number, category: string) => {
    const newPrompts = [...systemPrompts];
    const oldCategory = newPrompts[index].category;
    newPrompts[index] = { ...newPrompts[index], category };
    
    // Update supported categories
    let newCategories = [...supportedCategories];
    
    // Add new category if not present
    if (!newCategories.includes(category)) {
      newCategories.push(category);
    }
    
    // Remove old category if no other prompts use it
    const oldCategoryStillUsed = newPrompts.some(p => p.category === oldCategory);
    if (!oldCategoryStillUsed) {
      newCategories = newCategories.filter(c => c !== oldCategory);
    }
    
    onChange(newPrompts, newCategories);
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


  return (
    <Card>
      <CardHeader>
        <CardTitle>System Prompts Configuration</CardTitle>
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
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Category:</span>
                    <Select 
                      value={prompt.category} 
                      onValueChange={(value) => updatePromptCategory(index, value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {getCategoryLabel(category)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  prompt={prompt.prompt}
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
          <h4 className="text-sm font-medium mb-2">Add Custom Prompt</h4>
          <CategoryPromptEditor
            category={selectedCategory}
            prompt=""
            isNew={true}
            onCategoryChange={setSelectedCategory}
            onSave={(category, prompt) => addNewPrompt(category, prompt)}
          />
        </div>

        {/* Quick Action: Update All Prompts */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Quick Actions</h4>
          <Button
            variant="outline"
            onClick={() => {
              const updatedPrompts = systemPrompts.map(prompt => ({
                ...prompt,
                prompt: prompt.prompt.includes('Do not include any title, heading, or descriptive text') 
                  ? prompt.prompt 
                  : prompt.prompt + '\n\n**CRITICAL: Do not include any title, heading, or descriptive text within the image. Focus entirely on visual elements only.**'
              }));
              onChange(updatedPrompts, supportedCategories);
            }}
            className="w-full"
          >
            Add "No Text in Image" Rule to All Prompts
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
