import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Copy, RefreshCw, Sparkles, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SOCIAL_MEDIA_PLATFORMS } from '@/constants/agentConstants';

interface SocialMediaResult {
  platform: string;
  hook?: string;
  content: string;
  hashtags: string[];
  cta: string;
  engagement_question?: string;
  visual_suggestions?: string;
  story_ideas?: string;
  hook_tweet?: string;
  thread?: string[];
  engagement_hook?: string;
  standalone_option?: string;
  generated_at: string;
}

interface SocialMediaGeneratorProps {
  blogPostId: string;
}

export const SocialMediaGenerator: React.FC<SocialMediaGeneratorProps> = ({ blogPostId }) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin']);
  const [customContext, setCustomContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<SocialMediaResult[]>([]);
  const [regeneratingPlatform, setRegeneratingPlatform] = useState<string | null>(null);
  const [agentExists, setAgentExists] = useState<boolean>(false);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);

  const platforms = [
    { key: 'linkedin', ...SOCIAL_MEDIA_PLATFORMS.LINKEDIN },
    { key: 'instagram', ...SOCIAL_MEDIA_PLATFORMS.INSTAGRAM },
    { key: 'twitter_x', ...SOCIAL_MEDIA_PLATFORMS.TWITTER_X },
  ];

  // Check if Social Media Agent exists
  useEffect(() => {
    const checkAgent = async () => {
      try {
        const { data, error } = await supabase
          .from('openai_agents')
          .select('id')
          .eq('name', 'Social Media Agent')
          .maybeSingle();
        
        if (!error && data) {
          setAgentExists(true);
        }
      } catch (error) {
        console.error('Error checking agent:', error);
      }
    };
    
    checkAgent();
  }, []);

  const createAgent = async () => {
    setIsCreatingAgent(true);
    try {
      const { data, error } = await supabase.rpc('insert_social_media_agent');
      
      if (error) {
        throw error;
      }
      
      if (data.startsWith('SUCCESS:')) {
        setAgentExists(true);
        toast({
          title: "Agent created successfully!",
          description: "Social Media Agent is now ready to use."
        });
      } else {
        throw new Error(data);
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        title: "Failed to create agent",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingAgent(false);
    }
  };

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const generateContent = async (platformsToGenerate: string[] = selectedPlatforms) => {
    if (platformsToGenerate.length === 0) {
      toast({
        title: "No platforms selected",
        description: "Please select at least one platform to generate content for.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('social-media-agent', {
        body: {
          blog_post_id: blogPostId,
          platforms: platformsToGenerate,
          custom_context: customContext || undefined
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate social media content');
      }

      // Update results, replacing any existing results for the same platforms
      setResults(prev => {
        const newResults = [...prev];
        data.results.forEach((newResult: SocialMediaResult) => {
          const existingIndex = newResults.findIndex(r => r.platform === newResult.platform);
          if (existingIndex >= 0) {
            newResults[existingIndex] = newResult;
          } else {
            newResults.push(newResult);
          }
        });
        return newResults;
      });

      toast({
        title: "Content generated successfully!",
        description: `Generated ${data.results.length} social media post(s).`
      });

    } catch (error) {
      console.error('Error generating social media content:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate social media content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateForPlatform = async (platform: string) => {
    setRegeneratingPlatform(platform);
    await generateContent([platform]);
    setRegeneratingPlatform(null);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard.`
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatContentForCopy = (result: SocialMediaResult) => {
    let formatted = '';
    
    if (result.hook) {
      formatted += `${result.hook}\n\n`;
    }
    if (result.hook_tweet) {
      formatted += `${result.hook_tweet}\n\n`;
    }
    
    formatted += result.content;
    
    if (result.thread && result.thread.length > 0) {
      formatted += '\n\n' + result.thread.join('\n\n');
    }
    
    if (result.hashtags && result.hashtags.length > 0) {
      formatted += '\n\n' + result.hashtags.join(' ');
    }
    
    if (result.cta) {
      formatted += '\n\n' + result.cta;
    }
    
    return formatted;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Social Media Generator
        </CardTitle>
        <CardDescription>
          Generate platform-specific social media content to promote your blog post
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Agent Setup Check */}
        {!agentExists && (
          <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-orange-800">Setup Required</h4>
                <p className="text-sm text-orange-700">
                  Social Media Agent needs to be created first.
                </p>
              </div>
              <Button 
                onClick={createAgent}
                disabled={isCreatingAgent}
                variant="outline"
                size="sm"
              >
                {isCreatingAgent ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Agent'
                )}
              </Button>
            </div>
          </div>
        )}

        {agentExists && (
          <>
            {/* Platform Selection */}
        <div className="space-y-3">
          <h4 className="font-medium">Select Platforms</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {platforms.map(platform => (
              <div key={platform.key} className="flex items-center space-x-2 p-3 border rounded-lg">
                <Checkbox
                  id={platform.key}
                  checked={selectedPlatforms.includes(platform.key)}
                  onCheckedChange={() => handlePlatformToggle(platform.key)}
                />
                <label htmlFor={platform.key} className="flex-1 cursor-pointer">
                  <div className="font-medium">{platform.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {platform.tone} • {platform.maxLength} chars
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Context */}
        <div className="space-y-2">
          <h4 className="font-medium">Additional Context (Optional)</h4>
          <Textarea
            placeholder="Add any specific messaging, calls-to-action, or context you'd like to include..."
            value={customContext}
            onChange={(e) => setCustomContext(e.target.value)}
            rows={3}
          />
        </div>

        {/* Generate Button */}
        <Button 
          onClick={() => generateContent()}
          disabled={isGenerating || selectedPlatforms.length === 0}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating Content...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Social Media Posts
            </>
          )}
        </Button>
        </>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Generated Content
            </h4>
            
            <Tabs defaultValue={results[0]?.platform} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                {platforms.map(platform => {
                  const result = results.find(r => r.platform === platform.key);
                  return (
                    <TabsTrigger 
                      key={platform.key} 
                      value={platform.key}
                      disabled={!result}
                      className="relative"
                    >
                      {platform.name}
                      {result && (
                        <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                          ✓
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {platforms.map(platform => {
                const result = results.find(r => r.platform === platform.key);
                if (!result) return null;

                return (
                  <TabsContent key={platform.key} value={platform.key} className="space-y-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{platform.name} Post</CardTitle>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => regenerateForPlatform(platform.key)}
                              disabled={regeneratingPlatform === platform.key}
                            >
                              {regeneratingPlatform === platform.key ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(formatContentForCopy(result), `${platform.name} post`)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Hook/Opening */}
                        {(result.hook || result.hook_tweet) && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm">Opening Hook</h5>
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="whitespace-pre-wrap">{result.hook || result.hook_tweet}</p>
                            </div>
                          </div>
                        )}

                        {/* Main Content */}
                        <div className="space-y-2">
                          <h5 className="font-medium text-sm">Main Content</h5>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="whitespace-pre-wrap">{result.content}</p>
                          </div>
                        </div>

                        {/* Thread (for X/Twitter) */}
                        {result.thread && result.thread.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm">Thread</h5>
                            <div className="space-y-2">
                              {result.thread.map((tweet, index) => (
                                <div key={index} className="p-3 bg-muted rounded-lg">
                                  <p className="whitespace-pre-wrap">{tweet}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Hashtags */}
                        {result.hashtags && result.hashtags.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm">Hashtags</h5>
                            <div className="flex flex-wrap gap-1">
                              {result.hashtags.map((tag, index) => (
                                <Badge key={index} variant="secondary">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Call to Action */}
                        {result.cta && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm">Call to Action</h5>
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="whitespace-pre-wrap">{result.cta}</p>
                            </div>
                          </div>
                        )}

                        {/* Additional Elements */}
                        {result.visual_suggestions && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm">Visual Suggestions</h5>
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="whitespace-pre-wrap">{result.visual_suggestions}</p>
                            </div>
                          </div>
                        )}

                        {(result.engagement_question || result.engagement_hook) && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm">Engagement Hook</h5>
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="whitespace-pre-wrap">{result.engagement_question || result.engagement_hook}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};