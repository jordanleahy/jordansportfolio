import React, { useState } from 'react';
import { Check, X, Star, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SubscriptionTier } from '@/hooks/useSubscriptionStatus';
import type { MobilePlanComparisonProps } from '@/types/stories/ui';

const featureComparison = [
  { label: 'Credits per Month', key: 'max_gpt_images' },
  { label: 'Premium GPT-image-1', key: 'gpt_image_1' },
  { label: 'High Quality Generation', key: 'high_quality' },
  { label: 'Priority Support', key: 'priority_support' },
  { label: 'Advanced Features', key: 'advanced_features' },
  { label: 'API Access', key: 'api_access' },
];

export const MobilePlanComparison: React.FC<MobilePlanComparisonProps> = ({
  tiers,
  currentTier,
  onSelectPlan,
  isLoading = false,
}) => {
  const [selectedTier, setSelectedTier] = useState<string>(tiers[0]?.id || '');

  const isCurrentPlan = (tierId: string) => currentTier === tierId;
  const isPopular = (tier: SubscriptionTier) => tier.name === 'Premium';

  const getFeatureValue = (tier: SubscriptionTier, featureKey: string) => {
    switch (featureKey) {
      case 'max_gpt_images':
        return tier.max_gpt_images;
      case 'gpt_image_1':
        return true; // All plans include GPT-image-1
      case 'high_quality':
        return true; // All plans include high quality generation
      case 'priority_support':
        return tier.name !== 'Free';
      case 'advanced_features':
        return tier.name === 'Premium' || tier.name === 'Enterprise';
      case 'api_access':
        return tier.name === 'Enterprise';
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Plan selector tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
        {tiers.slice(0, 2).map((tier) => (
          <button
            key={tier.id}
            onClick={() => setSelectedTier(tier.id)}
            className={`relative p-3 rounded-md text-sm font-medium transition-all ${
              selectedTier === tier.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isPopular(tier) && (
              <div className="absolute -top-1 -right-1">
                <Badge className="h-5 px-1.5 text-xs bg-primary text-primary-foreground">
                  <Star className="h-2.5 w-2.5" />
                </Badge>
              </div>
            )}
            {tier.name}
          </button>
        ))}
      </div>

      {/* Selected plan details */}
      {tiers.map((tier) => {
        if (tier.id !== selectedTier) return null;

        return (
          <Card key={tier.id} className="border-2 border-primary bg-primary/5">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
                    {isCurrentPlan(tier.id) && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-foreground">
                      ${(tier.price_cents / 100).toFixed(0)}
                    </span>
                    <span className="text-muted-foreground text-sm">/month</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                  {isPopular(tier) ? (
                    <Crown className="h-6 w-6 text-primary-foreground" />
                  ) : (
                    <Star className="h-6 w-6 text-primary-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Feature comparison */}
              <div className="space-y-3">
                {featureComparison.map((feature) => {
                  const value = getFeatureValue(tier, feature.key);
                  const hasFeature = typeof value === 'number' ? value > 0 : value;

                  return (
                    <div key={feature.key} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{feature.label}</span>
                      <div className="flex items-center gap-2">
                        {typeof value === 'number' ? (
                          <span className="text-sm font-medium text-foreground">
                            {value.toLocaleString()}
                          </span>
                        ) : hasFeature ? (
                          <Check className="h-4 w-4 text-accent" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => onSelectPlan(tier)}
                disabled={isLoading || isCurrentPlan(tier.id)}
                className={`w-full h-11 font-medium mt-4 ${
                  isCurrentPlan(tier.id)
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
              >
                {isCurrentPlan(tier.id) ? (
                  'Current Plan'
                ) : isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Processing...
                  </div>
                ) : (
                  `Upgrade to ${tier.name}`
                )}
              </Button>

              {!isCurrentPlan(tier.id) && (
                <div className="text-center mt-3">
                  <p className="text-xs text-muted-foreground">
                    Cancel anytime • 30-day money-back guarantee
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};