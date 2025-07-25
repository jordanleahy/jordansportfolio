
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function TextEditor({ value, onChange, multiline = false, placeholder, maxLength }: TextEditorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  if (multiline) {
    return (
      <Textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className="min-h-[80px] resize-none"
      />
    );
  }

  return (
    <Input
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={maxLength}
    />
  );
}
