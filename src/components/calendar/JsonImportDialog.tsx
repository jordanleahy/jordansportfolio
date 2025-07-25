import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Eye, Download, Copy } from 'lucide-react';
import { socialMediaService } from '@/services/socialMediaService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface JsonImportDialogProps {
  onImportComplete: () => void;
}

interface ImportData {
  category: string;
  posts: Array<{
    day: number;
    title: string;
    description: string;
    theme?: string;
    status?: 'draft' | 'scheduled' | 'published';
  }>;
}

export function JsonImportDialog({ onImportComplete }: JsonImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ImportData | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const validateJson = (jsonString: string): { isValid: boolean; data?: ImportData; errors: string[] } => {
    const errors: string[] = [];
    
    try {
      const data = JSON.parse(jsonString) as ImportData;
      
      // Validate structure
      if (!data.category || typeof data.category !== 'string') {
        errors.push('Missing or invalid "category" field');
      }
      
      if (!data.posts || !Array.isArray(data.posts)) {
        errors.push('Missing or invalid "posts" array');
      } else {
        data.posts.forEach((post, index) => {
          if (!post.title || typeof post.title !== 'string') {
            errors.push(`Post ${index + 1}: Missing or invalid "title"`);
          }
          if (!post.description || typeof post.description !== 'string') {
            errors.push(`Post ${index + 1}: Missing or invalid "description"`);
          }
          if (post.day && (typeof post.day !== 'number' || post.day < 1)) {
            errors.push(`Post ${index + 1}: Invalid "day" value`);
          }
          if (post.status && !['draft', 'scheduled', 'published'].includes(post.status)) {
            errors.push(`Post ${index + 1}: Invalid "status" value`);
          }
        });
      }
      
      return { isValid: errors.length === 0, data: errors.length === 0 ? data : undefined, errors };
    } catch (e) {
      return { isValid: false, errors: ['Invalid JSON format'] };
    }
  };

  const handlePreview = () => {
    console.log('handlePreview called with jsonInput:', jsonInput);
    const validation = validateJson(jsonInput);
    console.log('validation result:', validation);
    setErrors(validation.errors);
    
    if (validation.isValid && validation.data) {
      console.log('Setting preview data:', validation.data);
      setPreviewData(validation.data);
    } else {
      console.log('Validation failed or no data');
      setPreviewData(null);
    }
  };

  const handleImport = async () => {
    if (!previewData) return;
    
    setIsLoading(true);
    try {
      await socialMediaService.bulkImportPosts(previewData.category, previewData.posts);
      
      toast({
        title: "Import Successful",
        description: `Imported ${previewData.posts.length} posts to ${previewData.category} category.`,
      });
      
      setOpen(false);
      setJsonInput('');
      setPreviewData(null);
      setErrors([]);
      onImportComplete();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import posts. Please check your data and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setJsonInput(content);
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid JSON file.",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    const template = {
      category: "forms",
      posts: [
        {
          day: 1,
          title: "Example Post Title",
          description: "This is an example description for your post. Make sure it's detailed and informative.",
          theme: "Forms",
          status: "draft"
        },
        {
          day: 2,
          title: "Another Example Post",
          description: "Another example description showing the format for your content.",
          theme: "Forms",
          status: "draft"
        }
      ]
    };
    
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'social-media-template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyJsonSchema = async () => {
    const schema = `{
  "category": "string (required)",
  "theme": "string (optional)", 
  "description": "string (optional)",
  "posts": [
    {
      "day": "number (optional)",
      "title": "string (required)",
      "description": "string (required)",
      "theme": "string (optional)",
      "status": "draft | scheduled | published (optional, defaults to draft)"
    }
  ]
}`;

    try {
      await navigator.clipboard.writeText(schema);
      toast({
        title: "Schema Copied",
        description: "JSON schema has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy schema to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import Content
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import JSON Content</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="input" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="input">Input & Validation</TabsTrigger>
            <TabsTrigger value="preview">Preview & Import</TabsTrigger>
          </TabsList>
          
          <TabsContent value="input" className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                <Download className="h-4 w-4" />
                Download Template
              </Button>
              <Button variant="outline" onClick={copyJsonSchema} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy JSON Schema
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Upload JSON File
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="json-input">JSON Content</Label>
              <Textarea
                id="json-input"
                placeholder="Paste your JSON content here..."
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="min-h-[300px] font-mono"
              />
            </div>
            
            {errors.length > 0 && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Validation Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-sm text-destructive">{error}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            
            <Button onClick={handlePreview} disabled={!jsonInput.trim()} className="gap-2">
              <Eye className="h-4 w-4" />
              Validate & Preview
            </Button>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            {previewData ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Import Preview</CardTitle>
                    <CardDescription>
                      Category: <strong>{previewData.category}</strong> | 
                      Posts: <strong>{previewData.posts.length}</strong>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                      {previewData.posts.map((post, index) => (
                        <Card key={index} className="p-3">
                          <div className="space-y-1">
                            <div className="font-medium">
                              {post.day ? `Day ${post.day}: ` : ''}{post.title}
                            </div>
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {post.description}
                            </div>
                            <div className="flex gap-2 text-xs">
                              {post.theme && <span className="bg-secondary px-2 py-1 rounded">{post.theme}</span>}
                              <span className="bg-secondary px-2 py-1 rounded">{post.status || 'draft'}</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex gap-2">
                  <Button onClick={handleImport} disabled={isLoading} className="flex-1">
                    {isLoading ? 'Importing...' : 'Import Posts'}
                  </Button>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">
                    No valid data to preview. Please validate your JSON in the Input tab.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}