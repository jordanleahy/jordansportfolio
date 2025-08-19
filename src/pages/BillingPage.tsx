import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Info } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionTiers, useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Helmet } from 'react-helmet-async';

const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const { data: tiers } = useSubscriptionTiers();
  const navigate = useNavigate();
  const { data: subStatus } = useSubscriptionStatus();
  const { data: currentTier } = useSubscriptionTier();
  
  const isCurrentlyStarter = currentTier === 'starter';
  const isCurrentlyFree = currentTier === 'free' || !currentTier;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDowngrading, setIsDowngrading] = useState(false);
  const [downgradeScheduled, setDowngradeScheduled] = useState(false);

  const handleDowngrade = async () => {
    try {
      setIsDowngrading(true);
      const { data, error } = await supabase.functions.invoke('downgrade-subscription');
      if (error) throw error;
      setDowngradeScheduled(true);
      toast.success('Downgrade scheduled. Your plan will end at period close.');
    } catch (e) {
      console.error(e);
      toast.error('Could not schedule downgrade. Please try again.');
    } finally {
      setIsDowngrading(false);
      setConfirmOpen(false);
    }
  };

  // Derive daily limits from active tiers
  const freeTier = tiers?.find((t) => t.name?.toLowerCase()?.startsWith('free'));
  const starterTier = tiers?.find((t) => t.name?.toLowerCase() === 'starter');
  const freeDaily = freeTier?.max_gpt_images ?? 1;
  const starterDaily = starterTier?.max_gpt_images ?? 1;

  const startStarterCheckout = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    const starter = tiers?.find((t) => t.name?.toLowerCase() === 'starter');
    if (!starter) {
      // Fallback: take user to plans page to choose
      navigate('/subscription');
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { tier_id: starter.id },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (e) {
      console.error('Checkout error:', e);
      toast.error('Could not start checkout. Please try again.');
    }
  };

  return (
    <AppLayout>
      <Helmet>
        <title>Plans & Billing - Story Ship</title>
        <meta name="description" content="Manage your subscription plans and billing settings" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Plans & Billing</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
          {/* Free Plan */}
          <Card className="relative">
            {isCurrentlyFree && (
              <span className="absolute top-3 right-3 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-medium px-2 py-1">
                Current Plan
              </span>
            )}
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Free</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Exploring what is possible with Story Ship
                  </p>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">$0</span>
                  <span className="text-sm text-muted-foreground">per month</span>
                </div>
                
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {freeDaily} free images (3/day max)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Starter Plan */}
          <Card className="relative">
            {isCurrentlyStarter && (
              <span className="absolute top-3 right-3 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-medium px-2 py-1">
                Current Plan
              </span>
            )}
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Starter</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Designed for those ready to start shipping stories today,
                  </p>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">$25</span>
                  <span className="text-sm text-muted-foreground">per month</span>
                </div>
                
                {isCurrentlyStarter ? (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setConfirmOpen(true)}
                    disabled={isDowngrading || downgradeScheduled}
                  >
                    {downgradeScheduled ? 'Downgrade Scheduled' : (isDowngrading ? 'Downgrading...' : 'Downgrade')}
                  </Button>
                ) : (
                  <Button className="w-full" onClick={startStarterCheckout}>
                    Subscribe Now
                  </Button>
                )}
                
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-medium text-foreground">Everything in Free, plus:</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm text-foreground">100 monthly images</span>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Downgrade to Free?</AlertDialogTitle>
              <AlertDialogDescription>
                Your current plan will remain active until the end of this billing period. You can re-subscribe anytime.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDowngrading}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDowngrade} disabled={isDowngrading}>
                {isDowngrading ? 'Scheduling…' : 'Confirm Downgrade'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default BillingPage;