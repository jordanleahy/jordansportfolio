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
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Subscription: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: status } = useSubscriptionStatus();
  const { data: tiers = [] } = useSubscriptionTiers();
  const isMobile = useIsMobile();

  const handleSelectPlan = (tier: any) => {
    if (!user) {
      // Redirect non-authenticated users to auth page
      navigate('/auth');
      return;
    }
    // Navigate to mobile checkout or trigger subscription for authenticated users
    console.log('Selected plan:', tier);
  };

  const handleSelectFreePlan = async () => {
    if (!user) {
      // Redirect non-authenticated users to auth page
      navigate('/auth');
      return;
    }
    
    if (!tiers || tiers.length === 0) return;
    
    const freePlan = tiers.find(tier => tier.name === 'Free Plan' && tier.price_cents === 0);
    if (freePlan) {
      handleSelectPlan(freePlan);
    }
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
          <h1 className="text-3xl font-bold">
            {user ? 'Manage Subscription' : 'Choose Your Plan'}
          </h1>
          {!user && (
            <p className="text-muted-foreground mt-2">
              Select a plan to get started with our AI content platform
            </p>
          )}
        </div>

        <div className="space-y-6">
          {/* Free Plan Card */}
          <div className="max-w-sm mx-auto">
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-bold text-foreground mb-4">Free Plan</h3>
              
              <div className="mb-6">
                <span className="text-3xl font-bold text-foreground">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 text-accent">✓</div>
                  <span className="text-foreground">5 Credits</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 text-accent">✓</div>
                  <span className="text-foreground">Image Generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 text-accent">✓</div>
                  <span className="text-foreground">Text Generation</span>
                </div>
              </div>

              <button 
                onClick={handleSelectFreePlan}
                className="w-full bg-muted text-foreground py-3 px-4 rounded-lg font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-2">
                {user ? 'Choose Free Plan' : 'Get Started Free'} →
              </button>
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