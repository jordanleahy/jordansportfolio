import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { SystemPrompt } from '@/types/openaiAgent';
import { CategoryPromptEditor } from './CategoryPromptEditor';
import { GenerateSystemPromptButton } from './GenerateSystemPromptButton';

import { DEFAULT_CATEGORIES, getCategoryLabel } from '@/constants/categoryConstants';

interface SystemPromptsTabProps {
  agentId?: string;
  systemPrompts: SystemPrompt[];
  supportedCategories: string[];
  onChange: (prompts: SystemPrompt[], categories: string[]) => void;
}

export const SystemPromptsTab = ({ 
  agentId,
  systemPrompts, 
  supportedCategories, 
  onChange 
}: SystemPromptsTabProps) => {

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

        {/* Category System Prompts */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Category-Specific Prompts</h4>
          {supportedCategories.length > 0 ? (
            supportedCategories.map((category) => {
              const existingPrompt = systemPrompts.find(p => p.category === category);
              const promptIndex = systemPrompts.findIndex(p => p.category === category);
              
              return (
                <div key={category} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">Category:</span>
                      <Badge variant="outline" className="w-48 justify-start">
                        {getCategoryLabel(category)}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      {agentId && (
                        <GenerateSystemPromptButton
                          agentId={agentId}
                          category={category}
                          onSuccess={() => {
                            // Force a page refresh to show the updated prompt
                            window.location.reload();
                          }}
                        />
                      )}
                      {existingPrompt && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePrompt(promptIndex)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {existingPrompt ? (
                    <CategoryPromptEditor
                      prompt={existingPrompt.prompt}
                      onChange={(newPrompt) => updatePrompt(promptIndex, newPrompt)}
                    />
                  ) : (
                    <div className="text-sm text-muted-foreground italic p-4 border-2 border-dashed rounded-md">
                      No system prompt generated yet. Click "Generate Rich Prompt" to create one.
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">
              No categories configured. Add supported categories to create system prompts.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
