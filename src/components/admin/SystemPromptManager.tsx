import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useOpenAIAgents } from '@/hooks/useOpenAIAgents';
import { Brain, Edit, Eye, TrendingUp, Clock, Target } from 'lucide-react';
import type { OpenAIAgent } from '@/types/openaiAgent';
import { OptimizedMonacoEditor } from '@/components/ui/optimized-monaco-editor';

export const SystemPromptManager = () => {
  const { data: agents, isLoading: loading } = useOpenAIAgents();
  const [selectedAgent, setSelectedAgent] = useState<OpenAIAgent | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<any | null>(null);
  const [editingPrompt, setEditingPrompt] = useState(false);

  const blogVisualAgent = agents?.find(agent => agent.name === 'Visual Prompt Generator');

  const getPromptMetrics = (category: string) => {
    // Mock metrics - in real implementation, this would come from API usage tracking
    const mockMetrics = {
      usageCount: Math.floor(Math.random() * 100) + 20,
      successRate: Math.floor(Math.random() * 20) + 80,
      avgResponseTime: Math.floor(Math.random() * 1000) + 500,
      lastUsed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    };
    return mockMetrics;
  };

  const PromptCard = ({ prompt, agent }: { prompt: any; agent: OpenAIAgent }) => {
    const metrics = getPromptMetrics(prompt.category);
    
    return (
      <Card className="group hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {prompt.category}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {metrics.usageCount} uses
              </Badge>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedPrompt(prompt)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      System Prompt: {prompt.category}
                    </DialogTitle>
                    <DialogDescription>
                      View and analyze system prompt performance
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{metrics.successRate}%</div>
                          <p className="text-xs text-muted-foreground">Success Rate</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{metrics.avgResponseTime}ms</div>
                          <p className="text-xs text-muted-foreground">Avg Response</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{metrics.usageCount}</div>
                          <p className="text-xs text-muted-foreground">Total Uses</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">System Prompt</Label>
                      <div className="mt-2 border border-input rounded-md overflow-hidden">
                        <OptimizedMonacoEditor
                          height="200px"
                          language="markdown"
                          value={prompt.prompt}
                          readOnly={true}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Last used: {metrics.lastUsed.toLocaleDateString()}
                      </div>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Prompt
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground line-clamp-3">
              {prompt.prompt.substring(0, 150)}...
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {metrics.successRate}% success
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {metrics.usageCount} uses
                </div>
              </div>
              <Badge 
                variant={metrics.successRate > 90 ? "default" : metrics.successRate > 75 ? "secondary" : "destructive"}
                className="text-xs"
              >
                {metrics.successRate > 90 ? "Excellent" : metrics.successRate > 75 ? "Good" : "Needs Attention"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Brain className="h-8 w-8 mx-auto mb-4 animate-pulse opacity-50" />
            <p className="text-muted-foreground">Loading system prompts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">

      {blogVisualAgent && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Visual Prompt Generator</h3>
            <Badge variant="outline">{blogVisualAgent.status}</Badge>
          </div>
          
          <div className="text-center py-8 text-muted-foreground">
            <p>System prompts are now managed in the dedicated table.</p>
            <p className="text-sm">Use the System Prompt Viewer to view and edit prompts.</p>
          </div>
        </div>
      )}

      {(!agents || agents.length === 0) && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No agents found</p>
              <p className="text-sm">System prompts will appear here once agents are configured</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};