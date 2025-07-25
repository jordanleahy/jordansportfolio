import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';

interface CategoryPromptEditorProps {
  category?: string;
  prompt: string;
  isNew?: boolean;
  onCategoryChange?: (category: string) => void;
  onChange?: (prompt: string) => void;
  onSave?: (category: string, prompt: string) => void;
}

export const CategoryPromptEditor = ({
  category = '',
  prompt,
  isNew = false,
  onCategoryChange,
  onChange,
  onSave
}: CategoryPromptEditorProps) => {
  const [localCategory, setLocalCategory] = useState(category);
  const [localPrompt, setLocalPrompt] = useState(prompt);

  const handleCategoryChange = (value: string) => {
    setLocalCategory(value);
    onCategoryChange?.(value);
  };

  const handlePromptChange = (value: string) => {
    setLocalPrompt(value);
    onChange?.(value);
  };

  const handleSave = () => {
    if (localCategory.trim() && localPrompt.trim()) {
      onSave?.(localCategory.trim(), localPrompt.trim());
      setLocalCategory('');
      setLocalPrompt('');
    }
  };

  return (
    <div className="space-y-3">
      {isNew && (
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={localCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            placeholder="e.g., healthcare, contracts, design"
          />
        </div>
      )}
      
      <div>
        <Label htmlFor="prompt">System Prompt</Label>
        <Textarea
          id="prompt"
          value={localPrompt}
          onChange={(e) => handlePromptChange(e.target.value)}
          placeholder="Enter the system prompt for this category..."
          rows={8}
          className="font-mono text-sm"
        />
      </div>
      
      {isNew && (
        <Button 
          onClick={handleSave} 
          disabled={!localCategory.trim() || !localPrompt.trim()}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Add Prompt
        </Button>
      )}
    </div>
  );
};