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
        </div>

        <div className="space-y-6">
          {/* Free Plan Highlight Card */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">FREE</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Start with 5 Free Credits</h3>
                  <p className="text-green-600 text-sm">Try our AI generation tools at no cost</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-800">$0</div>
                <div className="text-green-600 text-sm">/month</div>
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-sm text-green-700">
              <span>✓ 5 Credits per month</span>
              <span>✓ Image Generation</span>
              <span>✓ Text Generation</span>
            </div>
          </div>

          {isMobile ? (
            <PlanCarousel 
              tiers={tiers}
              currentTier={status?.subscription?.tier?.id}
              onSelectPlan={handleSelectPlan}
            />
          ) : (
            <SubscriptionPlans />
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Subscription;