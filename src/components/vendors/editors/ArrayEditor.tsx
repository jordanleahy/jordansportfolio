
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';

interface ArrayEditorProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxItems?: number;
}

export function ArrayEditor({ value, onChange, placeholder = "Add item", maxItems = 10 }: ArrayEditorProps) {
  const [newItem, setNewItem] = useState('');

  const handleAddItem = () => {
    if (newItem.trim() && value.length < maxItems) {
      onChange([...value, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemoveItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex-shrink-0">•</span>
          <span className="text-xs flex-1">{item}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleRemoveItem(index)}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
      
      {value.length < maxItems && (
        <div className="flex items-center gap-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="text-xs"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAddItem}
            disabled={!newItem.trim()}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
