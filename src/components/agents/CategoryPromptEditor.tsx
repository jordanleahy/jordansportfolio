import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';
import { DEFAULT_CATEGORIES, getCategoryLabel } from '@/constants/categoryConstants';
import Editor from '@monaco-editor/react';
import { useTheme } from 'next-themes';

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
  const { theme } = useTheme();

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
          <Select value={localCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category type" />
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
      )}
      
      <div>
        <Label htmlFor="prompt">System Prompt</Label>
        <div className="border border-input rounded-md overflow-hidden">
          <Editor
            height="200px"
            defaultLanguage="markdown"
            value={localPrompt}
            onChange={(value) => handlePromptChange(value || '')}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              folding: false,
              lineDecorationsWidth: 10,
              lineNumbersMinChars: 3,
              padding: { top: 12, bottom: 12 },
              contextmenu: false,
              placeholder: 'Enter the system prompt for this category...'
            }}
          />
        </div>
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