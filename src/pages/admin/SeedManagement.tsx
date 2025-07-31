import { PageLayout } from '@/components/layout/PageLayout';
import { SystemPromptManager } from '@/components/admin/SystemPromptManager';
import { SeedCorrelationView } from '@/components/admin/SeedCorrelationView';
import { PromptPerformanceMetrics } from '@/components/admin/PromptPerformanceMetrics';
import { FinetuningInsights } from '@/components/admin/FinetuningInsights';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Layers, TrendingUp, Zap } from 'lucide-react';

const SeedManagementPage = () => {
  return (
    <PageLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Seed Analytics Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Tony Stark-style command center for system prompts and image seeds
          </p>
        </div>

        <Tabs defaultValue="prompts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="prompts" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              System Prompts
            </TabsTrigger>
            <TabsTrigger value="correlation" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Seed Correlation
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Fine-tuning
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prompts">
            <SystemPromptManager />
          </TabsContent>

          <TabsContent value="correlation">
            <SeedCorrelationView />
          </TabsContent>

          <TabsContent value="performance">
            <PromptPerformanceMetrics />
          </TabsContent>

          <TabsContent value="insights">
            <FinetuningInsights />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default SeedManagementPage;