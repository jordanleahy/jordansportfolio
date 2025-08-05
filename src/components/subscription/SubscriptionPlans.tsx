import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscriptionTiers, useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/costCalculator';
import { Zap, Image, Type, Check, Crown } from 'lucide-react';
import { toast } from 'sonner';

export const SubscriptionPlans: React.FC = () => {
  const { data: tiers, isLoading: tiersLoading } = useSubscriptionTiers();
  const { data: status, refetch: refetchStatus } = useSubscriptionStatus();

  const handleSubscribe = async (tierId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { tier_id: tierId }
      });

      if (error) {
        throw error;
      }

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      
      // Refresh status after a delay to check for updates
      setTimeout(() => {
        refetchStatus();
      }, 2000);

    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to create subscription. Please try again.');
    }
  };

  const handleManageBilling = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription');

      if (error) {
        throw error;
      }

      // Open customer portal in a new tab
      window.open(data.url, '_blank');

    } catch (error) {
      console.error('Billing management error:', error);
      toast.error('Failed to open billing portal. Please try again.');
    }
  };

  if (tiersLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-6 bg-muted rounded animate-pulse" />
                <div className="h-8 bg-muted rounded animate-pulse" />
                <div className="h-20 bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!tiers || tiers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No subscription plans available</p>
        </CardContent>
      </Card>
    );
  }

  const currentTierId = status?.subscription?.tier_id;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground mt-2">
          Unlock powerful AI features with our affordable subscription plans
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        {tiers.map((tier, index) => (
          <Card 
            key={tier.id} 
            className={`relative ${currentTierId === tier.id ? 'ring-2 ring-primary' : ''} ${index === 0 ? 'border-primary' : ''}`}
          >
            {index === 0 && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                  <Crown className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            {currentTierId === tier.id && (
              <div className="absolute -top-3 right-4">
                <Badge variant="secondary">Current Plan</Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">{tier.name}</CardTitle>
              <div className="text-3xl font-bold">
                {formatCurrency(tier.price_cents / 100)}
                <span className="text-sm font-normal text-muted-foreground">/{tier.billing_interval}</span>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Features List */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {tier.max_image_generations} AI image generations
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {tier.max_dalle_images} DALL-E 3 premium images
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Type className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {tier.max_text_generations} text generations
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">Priority support</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">Cancel anytime</span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  {currentTierId === tier.id ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleManageBilling}
                    >
                      Manage Billing
                    </Button>
                  ) : (
                    <Button 
                      className="w-full"
                      onClick={() => handleSubscribe(tier.id)}
                      variant={index === 0 ? "default" : "outline"}
                    >
                      Subscribe Now
                    </Button>
                  )}
                </div>

                {/* Value Proposition */}
                {index === 0 && (
                  <div className="pt-2 text-center">
                    <p className="text-xs text-muted-foreground">
                      Best value • 400%+ profit margin for you
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ or additional info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>All plans include access to our full feature set. Upgrade or downgrade anytime.</p>
      </div>
    </div>
  );
};