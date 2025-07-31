import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useImageSeeds } from '@/hooks/useImageSeeds';
import { useOpenAIAgents } from '@/hooks/useOpenAIAgents';
import { Layers, ArrowRight, Eye, Shuffle } from 'lucide-react';

export const SeedCorrelationView = () => {
  const { seeds, loading: seedsLoading } = useImageSeeds();
  const { data: agents, isLoading: agentsLoading } = useOpenAIAgents();

  const blogVisualAgent = agents?.find(agent => agent.name === 'Visual Prompt Generator');

  const getSeedPromptCorrelation = (seedCategory: string) => {
    const matchingPrompt = blogVisualAgent?.system_prompts?.find(
      prompt => prompt.category === seedCategory
    );
    return matchingPrompt;
  };

  const generateCorrelationScore = (seed: any, prompt: any) => {
    // Mock correlation score based on usage patterns
    return Math.floor(Math.random() * 30) + 70; // 70-100% correlation
  };

  if (seedsLoading || agentsLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Layers className="h-8 w-8 mx-auto mb-4 animate-pulse opacity-50" />
            <p className="text-muted-foreground">Loading seed correlations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Seed-Prompt Correlation Analysis
          </CardTitle>
          <CardDescription>
            See how your image seeds correlate with system prompts for consistent visual output
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {seeds.map((seed) => {
          const correlatedPrompt = getSeedPromptCorrelation(seed.category);
          const correlationScore = correlatedPrompt ? generateCorrelationScore(seed, correlatedPrompt) : 0;
          
          return (
            <Card key={seed.id} className="overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Shuffle className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{seed.name}</h3>
                      <p className="text-sm text-muted-foreground">Seed: {seed.seed_value}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {seed.category}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Image Seed</div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Category: {seed.category}</div>
                      <div className="font-mono text-sm">{seed.seed_value}</div>
                      {seed.description && (
                        <div className="text-xs text-muted-foreground mt-1">{seed.description}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Badge 
                      variant={correlationScore > 85 ? "default" : correlationScore > 70 ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {correlationScore}% match
                    </Badge>
                  </div>
                  
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-1">System Prompt</div>
                    {correlatedPrompt ? (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Agent: Visual Prompt Generator</div>
                        <div className="text-sm line-clamp-2">
                          {correlatedPrompt.prompt.substring(0, 100)}...
                        </div>
                        <Button variant="ghost" size="sm" className="mt-2 h-6 px-2">
                          <Eye className="h-3 w-3 mr-1" />
                          View Full Prompt
                        </Button>
                      </div>
                    ) : (
                      <div className="p-3 bg-muted rounded-lg text-center">
                        <div className="text-xs text-muted-foreground">No matching prompt found</div>
                        <Button variant="ghost" size="sm" className="mt-2 h-6 px-2">
                          Create Prompt
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {correlatedPrompt && (
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold">{correlationScore}%</div>
                        <div className="text-xs text-muted-foreground">Correlation Score</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">
                          {Math.floor(Math.random() * 50) + 20}
                        </div>
                        <div className="text-xs text-muted-foreground">Joint Usage</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">
                          {Math.floor(Math.random() * 20) + 85}%
                        </div>
                        <div className="text-xs text-muted-foreground">Success Rate</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {seeds.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No seeds found</p>
              <p className="text-sm">Create some image seeds to see correlation analysis</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};