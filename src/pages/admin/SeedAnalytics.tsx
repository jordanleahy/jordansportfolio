import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SystemPromptManager } from '@/components/admin/SystemPromptManager';

import { PromptPerformanceMetrics } from '@/components/admin/PromptPerformanceMetrics';
import { FinetuningInsights } from '@/components/admin/FinetuningInsights';
import { 
  Activity, 
  Brain, 
  Target, 
  TrendingUp, 
  Layers,
  Settings,
  BarChart3,
  Zap
} from 'lucide-react';

const SeedAnalytics = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <PageLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Seed Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Mission control for AI content generation - system prompts, seeds, and fine-tuning intelligence
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Live Monitoring
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              AI Optimization
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active System Prompts</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +2 from last week
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Managed Seeds</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                Across 5 categories
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.2%</div>
              <p className="text-xs text-muted-foreground">
                +5.1% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Optimization Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87</div>
              <p className="text-xs text-muted-foreground">
                Excellent performance
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Main Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="prompts" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              System Prompts
            </TabsTrigger>
            <TabsTrigger value="correlation" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Seed Correlation
            </TabsTrigger>
            <TabsTrigger value="finetuning" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Fine-tuning
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PromptPerformanceMetrics />
              <FinetuningInsights />
            </div>
          </TabsContent>

          <TabsContent value="prompts" className="space-y-4">
            <SystemPromptManager />
          </TabsContent>

          <TabsContent value="correlation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Seed Correlation Analysis
                </CardTitle>
                <CardDescription>
                  Seed analysis has been simplified - seeds are now stored directly on posts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Seed system has been simplified</p>
                  <p className="text-sm">Seeds are now managed directly on individual posts for better control</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finetuning" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Fine-tuning Intelligence
                </CardTitle>
                <CardDescription>
                  Advanced analytics and optimization recommendations for your AI pipeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Fine-tuning analytics coming soon...</p>
                  <p className="text-sm">Track prompt performance, A/B test variations, and optimize for better results</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default SeedAnalytics;