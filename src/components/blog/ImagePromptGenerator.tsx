import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePromptGeneration } from '@/hooks/usePromptGeneration';
import { useEnhancedPrompts } from '@/hooks/useEnhancedPrompts';
import { Badge } from '@/components/ui/badge';
import { Copy, Heart, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ImagePromptGeneratorProps {
  onPromptGenerated: (prompt: string) => void;
}

export const ImagePromptGenerator: React.FC<ImagePromptGeneratorProps> = ({ onPromptGenerated }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  
  const { generateAndCachePrompt, useGeneratedPrompt, isGenerating } = usePromptGeneration();
  const { data: cachedPrompts } = useEnhancedPrompts({
    category: 'blog_visual',
    prompt_type: 'image_generation',
  });
  const { toast } = useToast();

  const handleGeneratePrompt = async () => {
    if (!jobTitle || !companyName) {
      toast({
        title: "Missing Information",
        description: "Please provide both job title and company name.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await generateAndCachePrompt.mutateAsync({
        functionName: 'generate-hero-job-visual',
        parameters: {
          jobTitle,
          companyName,
          jobDescription,
        },
        category: 'blog_visual',
        promptType: 'image_generation',
        sourceTable: 'blog_posts',
      });

      onPromptGenerated(result.generatedPrompt);
    } catch (error) {
      console.error('Error generating prompt:', error);
    }
  };

  const handleUseExistingPrompt = async (promptId: string, promptText: string) => {
    try {
      await useGeneratedPrompt.mutateAsync({
        promptId,
        context: {
          source: 'blog_editor',
          action: 'reuse_existing_prompt',
        },
      });

      onPromptGenerated(promptText);
      
      toast({
        title: "Prompt Applied",
        description: "Selected prompt has been applied to the editor.",
      });
    } catch (error) {
      console.error('Error logging prompt usage:', error);
      // Still apply the prompt even if logging fails
      onPromptGenerated(promptText);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Prompt copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      {/* Generate New Prompt Section */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Hero Job Visual Prompt</CardTitle>
          <CardDescription>
            Create a cinematic, hero-style image prompt for job opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Google, Microsoft, Apple"
              />
            </div>
            <div>
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="jobDescription">Job Description (Optional)</Label>
            <Textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Brief description of the role and responsibilities..."
              rows={3}
            />
          </div>
          
          <Button 
            onClick={handleGeneratePrompt} 
            disabled={isGenerating || !jobTitle || !companyName}
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate Hero Job Visual Prompt'}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Prompts Library */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Prompt Library</CardTitle>
            <CardDescription>
              Previously generated prompts you can reuse
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/prompt-library" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Library
            </a>
          </Button>
        </CardHeader>
        <CardContent>
          {cachedPrompts && cachedPrompts.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {cachedPrompts.slice(0, 5).map((prompt) => (
                <div key={prompt.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm line-clamp-1">{prompt.cache_key}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(prompt.updated_at), 'MMM d, yyyy')}
                        {prompt.usage_count !== undefined && (
                          <span className="ml-2">• Used {prompt.usage_count} times</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {prompt.is_favorite && <Heart className="h-3 w-3 fill-red-500 text-red-500" />}
                      <Badge variant="secondary" className="text-xs">
                        {prompt.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {prompt.prompt_text}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => handleUseExistingPrompt(prompt.id, prompt.prompt_text)}
                      className="h-7 text-xs"
                    >
                      Use This Prompt
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(prompt.prompt_text)}
                      className="h-7 text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              ))}
              
              {cachedPrompts.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="/prompt-library" target="_blank" rel="noopener noreferrer">
                      View All {cachedPrompts.length} Prompts
                    </a>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">No prompts in your library yet</p>
              <p className="text-sm text-muted-foreground">
                Generate your first prompt above to start building your library
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
