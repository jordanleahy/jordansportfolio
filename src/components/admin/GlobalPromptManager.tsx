import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useGlobalPromptEnsurance } from '@/hooks/useGlobalPromptEnsurance';
import { Scan, Play, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export const GlobalPromptManager: React.FC = () => {
  const { 
    status, 
    scanMissingPrompts, 
    ensureAllPrompts, 
    getMissingPromptsSummary,
    isProcessing 
  } = useGlobalPromptEnsurance();

  const [missingStats, setMissingStats] = useState<any[]>([]);
  const [forceRegenerate, setForceRegenerate] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');

  // Auto-scan on component mount
  useEffect(() => {
    handleScan();
  }, []);

  const handleScan = async () => {
    const stats = await getMissingPromptsSummary();
    setMissingStats(stats);
  };

  const handleEnsureAll = async () => {
    await ensureAllPrompts({
      aspectRatio,
      forceRegenerate,
      maxConcurrentThemes: 2
    });
    // Refresh stats after processing
    setTimeout(handleScan, 1000);
  };

  const getStatusBadge = () => {
    if (isProcessing) {
      return <Badge variant="secondary" className="bg-info/10 text-info">Processing</Badge>;
    }
    if (status.postsMissing === 0) {
      return <Badge variant="default" className="bg-success/10 text-success">Complete</Badge>;
    }
    return <Badge variant="destructive">Missing Prompts</Badge>;
  };

  const completionPercentage = status.totalPosts > 0 
    ? Math.round((status.postsWithPrompts / status.totalPosts) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Global Prompt Status
              </CardTitle>
              <CardDescription>
                Monitor and ensure all social media posts have generated prompts
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completion Progress</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{status.totalThemes}</div>
              <div className="text-sm text-muted-foreground">Total Themes</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{status.totalPosts}</div>
              <div className="text-sm text-muted-foreground">Total Posts</div>
            </div>
            <div className="text-center p-3 bg-success/10 rounded-lg">
              <div className="text-2xl font-bold text-success">{status.postsWithPrompts}</div>
              <div className="text-sm text-muted-foreground">With Prompts</div>
            </div>
            <div className="text-center p-3 bg-destructive/10 rounded-lg">
              <div className="text-2xl font-bold text-destructive">{status.postsMissing}</div>
              <div className="text-sm text-muted-foreground">Missing</div>
            </div>
          </div>

          {/* Current Processing */}
          {isProcessing && (
            <div className="p-4 bg-info/10 rounded-lg border border-info/20">
              <div className="flex items-center gap-2 text-info">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="font-medium">Processing...</span>
              </div>
              {status.currentTheme && (
                <div className="text-sm text-blue-600 mt-1">
                  Current: {status.currentTheme}
                </div>
              )}
              <div className="text-sm text-blue-600">
                Themes processed: {status.themesProcessed} / {status.totalThemes}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controls Card */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Scan for missing prompts and automatically generate them
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Options */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="force-regenerate" 
                checked={forceRegenerate}
                onCheckedChange={setForceRegenerate}
              />
              <Label htmlFor="force-regenerate">Force regenerate existing</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="aspect-ratio">Aspect Ratio:</Label>
              <select 
                id="aspect-ratio"
                value={aspectRatio} 
                onChange={(e) => setAspectRatio(e.target.value)}
                className="px-3 py-1 border rounded-md"
              >
                <option value="1:1">Square (1:1)</option>
                <option value="16:9">Landscape (16:9)</option>
                <option value="9:16">Portrait (9:16)</option>
                <option value="4:3">Standard (4:3)</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleScan} 
              variant="outline"
              disabled={isProcessing}
            >
              <Scan className="h-4 w-4 mr-2" />
              Scan Missing
            </Button>
            
            <Button 
              onClick={handleEnsureAll}
              disabled={isProcessing || status.postsMissing === 0}
              className="bg-primary hover:bg-primary/90"
            >
              <Play className="h-4 w-4 mr-2" />
              {isProcessing ? 'Processing...' : `Generate ${status.postsMissing} Missing`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Missing Prompts by Theme */}
      {missingStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Themes with Missing Prompts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {missingStats.map((stat) => (
                <div 
                  key={stat.themeId} 
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <div className="font-medium">{stat.themeName}</div>
                    <div className="text-sm text-muted-foreground">
                      {stat.postsWithoutPrompts} of {stat.totalPosts} missing prompts
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {stat.postsWithoutPrompts} missing
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};