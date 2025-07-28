import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save } from 'lucide-react';
import { getCategoryLabel } from '@/constants/categoryConstants';

interface CategoryPromptEditorProps {
  category?: string;
  prompt: string;
  isNew?: boolean;
  onChange?: (prompt: string) => void;
  onSave?: (category: string, prompt: string) => void;
}

export const CategoryPromptEditor = ({
  category = 'cdi',
  prompt,
  isNew = false,
  onChange,
  onSave
}: CategoryPromptEditorProps) => {
  const [localPrompt, setLocalPrompt] = useState(prompt);

  const handlePromptChange = (value: string) => {
    setLocalPrompt(value);
    onChange?.(value);
  };

  const handleSave = () => {
    if (localPrompt.trim()) {
      onSave?.(category, localPrompt.trim());
      setLocalPrompt('');
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="category">Category</Label>
        <Badge variant="secondary" className="mt-1">
          {getCategoryLabel(category)}
        </Badge>
      </div>
      
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
          disabled={!localPrompt.trim()}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Add Prompt
        </Button>
      )}
    </div>
  );
};