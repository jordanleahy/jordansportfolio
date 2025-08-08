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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Subscription: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: status } = useSubscriptionStatus();
  const { data: tiers = [] } = useSubscriptionTiers();
  const isMobile = useIsMobile();

  const handleSelectPlan = async (tier: any) => {
    if (!user) {
      // Redirect non-authenticated users to auth page
      navigate('/auth');
      return;
    }

    try {
      if (tier?.price_cents === 0) {
        toast.success('Free plan selected. You can start using the app.');
        navigate('/stories');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { tier_id: tier.id },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      toast.error('Could not start checkout. Please try again.');
    }
  };

  const handleSelectFreePlan = async () => {
    if (!user) {
      // Redirect non-authenticated users to auth page
      navigate('/auth');
      return;
    }
    
    if (!tiers || tiers.length === 0) return;
    
    const freePlan = tiers.find(t => t.name === 'Free Plan' && t.price_cents === 0);
    if (freePlan) {
      toast.success('Free plan selected. You can start using the app.');
      navigate('/stories');
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
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm relative">
              {/* Subscription Status Badge */}
              {user && status?.subscription && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                    {status.subscription.tier?.name || 'Current Plan'}
                  </span>
                </div>
              )}
              
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
              tiers={tiers?.filter(tier => tier.price_cents > 0) || []}
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