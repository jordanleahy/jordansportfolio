import React from 'react';
import { X, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { SubscriptionTier } from '@/hooks/useSubscriptionStatus';

interface MobileCheckoutSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tier: SubscriptionTier;
  onSubscribe: (tierId: string) => Promise<void>;
  isLoading?: boolean;
}

export const MobileCheckoutSheet: React.FC<MobileCheckoutSheetProps> = ({
  isOpen,
  onOpenChange,
  tier,
  onSubscribe,
  isLoading = false,
}) => {
  const handleSubscribe = async () => {
    await onSubscribe(tier.id);
  };

  const features = [
    `${tier.max_image_generations} Credits per month`,
    'Image Generation (Any model)',
    'Text Generation (Any model)',
    'Priority support',
    'Advanced features access',
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] rounded-t-xl border-0 bg-card p-0 overflow-y-auto"
      >
        <div className="sticky top-0 z-10 bg-card border-b border-border">
          <SheetHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                  <Star className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <SheetTitle className="text-xl font-bold text-left">
                    {tier.name}
                  </SheetTitle>
                  <Badge variant="secondary" className="text-xs">
                    Most Popular
                  </Badge>
                </div>
              </div>
              <SheetClose asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>
        </div>

        <div className="px-6 pb-6 space-y-6">
          {/* Pricing */}
          <div className="text-center py-4">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-foreground">
                ${(tier.price_cents / 100).toFixed(0)}
              </span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Billed monthly • Cancel anytime
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">What's included:</h3>
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-accent-foreground" />
                  </div>
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="pt-4 space-y-4">
            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Processing...
                </div>
              ) : (
                `Subscribe to ${tier.name}`
              )}
            </Button>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Secure checkout powered by Stripe
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                30-day money-back guarantee
              </p>
            </div>
          </div>

          {/* Trust signals */}
          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm font-medium text-foreground">🔒</div>
                <div className="text-xs text-muted-foreground">Secure</div>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">⚡</div>
                <div className="text-xs text-muted-foreground">Instant</div>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">✨</div>
                <div className="text-xs text-muted-foreground">Premium</div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};