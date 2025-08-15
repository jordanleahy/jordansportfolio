import React, { useState } from 'react';
import { Star, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SubscriptionTier } from '@/hooks/useSubscriptionStatus';
import type { PlanCarouselProps } from '@/types/stories/ui';

export const PlanCarousel: React.FC<PlanCarouselProps> = ({
  tiers,
  currentTier,
  onSelectPlan,
  isLoading = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);


  const isCurrentPlan = (tierId: string) => currentTier === tierId;
  const isPopular = (tier: SubscriptionTier) => tier.name === 'Premium';

  return (
    <div className="w-full space-y-4">
      {/* Carousel Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-semibold text-foreground">Choose Your Plan</h2>
        <div className="flex gap-1">
          {tiers.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative overflow-hidden">
        <div 
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {tiers.map((tier, index) => (
            <div key={tier.id} className="w-full flex-shrink-0 px-1">
              <Card 
                className={`relative border-2 transition-all duration-200 ${
                  isCurrentPlan(tier.id) 
                    ? 'border-accent bg-accent/5' 
                    : isPopular(tier)
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-accent/50'
                }`}
              >
                {isPopular(tier) && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground font-medium px-3">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                {isCurrentPlan(tier.id) && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="secondary" className="font-medium">
                      {tier.name.toLowerCase().includes('free') || tier.name.toLowerCase().includes('starter') ? 'Your Plan' : 'Current Plan'}
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">
                        ${(tier.price_cents / 100).toFixed(0)}
                      </span>
                      <span className="text-muted-foreground text-sm">/month</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Key Features */}
                  <div className="space-y-3">
                     <div className="flex items-center gap-2">
                       <Check className="h-4 w-4 text-accent" />
                       <span className="text-sm text-foreground">
                         {tier.max_gpt_images_monthly || 130} Monthly Credits
                       </span>
                     </div>
                     <div className="flex items-center gap-2">
                       <Check className="h-4 w-4 text-accent" />
                       <span className="text-sm text-foreground">High Quality Generation</span>
                     </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-accent" />
                      <span className="text-sm text-foreground">Priority Support</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => onSelectPlan(tier)}
                    disabled={isLoading || isCurrentPlan(tier.id)}
                    className={`w-full h-11 font-medium ${
                      isCurrentPlan(tier.id)
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : isPopular(tier)
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                    }`}
                  >
                    {isCurrentPlan(tier.id) ? (
                      'Current Plan'
                    ) : (
                      <div className="flex items-center gap-2">
                        Choose {tier.name}
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};