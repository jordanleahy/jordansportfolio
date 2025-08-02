import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Eye, Download, Copy } from 'lucide-react';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface JsonImportDialogProps {
  onImportComplete: () => void;
}

interface ImportData {
  category: string;
  theme?: string;
  description?: string;
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
      console.log('🔍 IMPORT DEBUG: Starting import process for category:', previewData.category);
      
      // Check if posts exist for this category
      console.log('📊 CHECKING: Existing posts for category:', previewData.category);
      const { data: existingPosts, error: postsQueryError } = await supabase
        .from('social_media_posts')
        .select('id')
        .eq('category', previewData.category)
        .limit(1);
      
      if (postsQueryError) {
        console.error('❌ POSTS QUERY ERROR:', postsQueryError);
      }
      
      // Check if a system prompt exists for this category
      console.log('🤖 CHECKING: Existing system prompts for category:', previewData.category);
      const { data: existingSystemPrompts, error: promptsQueryError } = await supabase
        .from('system_prompts')
        .select('id')
        .eq('category', previewData.category)
        .limit(1);
      
      if (promptsQueryError) {
        console.error('❌ SYSTEM PROMPTS QUERY ERROR:', promptsQueryError);
      }
      
      const hasExistingPosts = existingPosts && existingPosts.length > 0;
      const hasSystemPrompt = existingSystemPrompts && existingSystemPrompts.length > 0;
      const needsSystemPrompt = !hasSystemPrompt;
      
      console.log('🎯 IMPORT DECISION MATRIX:', {
        category: previewData.category,
        hasExistingPosts,
        hasSystemPrompt,
        needsSystemPrompt,
        postsToImport: previewData.posts.length
      });
      
      // Import the posts
      console.log('📥 IMPORTING: Posts for category:', previewData.category);
      await optimizedSocialMediaService.bulkImportPosts(previewData.category, previewData.posts);
      console.log('✅ POSTS IMPORTED: Successfully imported', previewData.posts.length, 'posts');
      
      // Generate system prompt if one doesn't exist for this category
      if (needsSystemPrompt) {
        const statusMessage = hasExistingPosts 
          ? `Category "${previewData.category}" has posts but no system prompt. Generating...`
          : `New category "${previewData.category}" detected. Generating system prompt...`;
        
        console.log('🤖 SYSTEM PROMPT GENERATION:', statusMessage);
        
        try {
          console.log('🚀 CALLING: invoke-system-prompt-agent edge function');
          const { data: invokeData, error: invokeError } = await supabase.functions.invoke('invoke-system-prompt-agent', {
            body: {
              category: previewData.category,
              theme: previewData.theme || previewData.category,
              description: previewData.description || `Generated content for ${previewData.category} category`,
              sample_posts: previewData.posts.slice(0, 3), // Send first 3 posts as samples
              user_id: (await supabase.auth.getUser()).data.user?.id
            }
          });

          console.log('📡 EDGE FUNCTION RESPONSE:', { invokeData, invokeError });

          if (invokeError) {
            console.error('❌ SYSTEM PROMPT GENERATION ERROR:', invokeError);
            toast({
              title: "Import Successful, System Prompt Failed",
              description: `Imported ${previewData.posts.length} posts but failed to generate system prompt: ${invokeError.message}`,
              variant: "destructive",
            });
          } else {
            console.log('✅ SYSTEM PROMPT GENERATED:', invokeData);
            const promptMessage = hasExistingPosts
              ? `Imported ${previewData.posts.length} posts and generated missing system prompt for "${previewData.category}".`
              : `Imported ${previewData.posts.length} posts and generated system prompt for new category "${previewData.category}".`;
            
            toast({
              title: "Import & Prompt Generation Successful",
              description: promptMessage,
            });
          }
        } catch (promptError) {
          console.error('💥 SYSTEM PROMPT GENERATION EXCEPTION:', promptError);
          toast({
            title: "Import Successful, System Prompt Failed",
            description: `Imported ${previewData.posts.length} posts but system prompt generation failed: ${promptError.message}`,
            variant: "destructive",
          });
        }
      } else {
        console.log('ℹ️  SYSTEM PROMPT EXISTS: Skipping generation for category:', previewData.category);
        toast({
          title: "Import Successful",
          description: `Imported ${previewData.posts.length} posts to existing ${previewData.category} category (system prompt already exists).`,
        });
      }
      
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