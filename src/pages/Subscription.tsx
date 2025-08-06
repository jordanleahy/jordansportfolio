import React from 'react';
import { Helmet } from 'react-helmet-async';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UsageDashboard } from '@/components/subscription/UsageDashboard';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, BarChart3, Settings, Smartphone } from 'lucide-react';
import { PlanCarousel } from '@/components/subscription/PlanCarousel';
import { MobilePlanComparison } from '@/components/subscription/MobilePlanComparison';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSubscriptionTiers } from '@/hooks/useSubscriptionStatus';

const Subscription: React.FC = () => {
  const { data: status } = useSubscriptionStatus();
  const { data: tiers = [] } = useSubscriptionTiers();
  const isMobile = useIsMobile();

  const handleSelectPlan = (tier: any) => {
    // Navigate to mobile checkout or trigger subscription
    console.log('Selected plan:', tier);
  };

  return (
    <PageLayout>
      <Helmet>
        <title>Subscription - AI Content Platform</title>
        <meta name="description" content="Manage your subscription and monitor usage" />
      </Helmet>

      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and monitor your AI usage
          </p>
        </div>

        <Tabs defaultValue="usage" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {isMobile ? 'Usage' : 'Usage & Billing'}
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {isMobile ? 'Plans' : 'Plans & Pricing'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usage">
            <UsageDashboard />
          </TabsContent>

          <TabsContent value="plans">
            {isMobile ? (
              <div className="space-y-6">
                <PlanCarousel 
                  tiers={tiers}
                  currentTier={status?.subscription?.tier?.id}
                  onSelectPlan={handleSelectPlan}
                />
                <MobilePlanComparison 
                  tiers={tiers}
                  currentTier={status?.subscription?.tier?.id}
                  onSelectPlan={handleSelectPlan}
                />
              </div>
            ) : (
              <SubscriptionPlans />
            )}
          </TabsContent>

        </Tabs>
      </div>
    </PageLayout>
  );
};

export default Subscription;