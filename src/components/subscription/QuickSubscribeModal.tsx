import React from 'react';
import { X, Shield, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SubscriptionTier } from '@/hooks/useSubscriptionStatus';

interface QuickSubscribeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tier: SubscriptionTier;
  onSubscribe: (tierId: string) => Promise<void>;
  isLoading?: boolean;
}

export const QuickSubscribeModal: React.FC<QuickSubscribeModalProps> = ({
  isOpen,
  onOpenChange,
  tier,
  onSubscribe,
  isLoading = false,
}) => {
  const handleSubscribe = async () => {
    await onSubscribe(tier.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[95vw] mx-auto p-0 overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-primary to-accent p-6 text-primary-foreground">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Star className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-left">
                    Upgrade to {tier.name}
                  </DialogTitle>
                  <Badge variant="secondary" className="text-xs mt-1 bg-white/20 text-white border-white/30">
                    Limited Time Offer
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Pricing highlight */}
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-foreground">
                ${(tier.price_cents / 100).toFixed(0)}
              </span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Start your premium journey today
            </p>
          </div>

          {/* Key benefits */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                <Zap className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <div className="font-medium text-foreground">
                  {tier.max_image_generations} AI Image Generations
                </div>
                <div className="text-sm text-muted-foreground">
                  Create stunning visuals with AI
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                <Star className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <div className="font-medium text-foreground">
                  {tier.max_image_generations} Credits
                </div>
                <div className="text-sm text-muted-foreground">
                  Use for any AI generation (images, text, etc.)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                <Shield className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <div className="font-medium text-foreground">
                  Unlimited Features
                </div>
                <div className="text-sm text-muted-foreground">
                  Access to all AI models and capabilities
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-4">
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
                `Get ${tier.name} - $${(tier.price_cents / 100).toFixed(0)}/month`
              )}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                ✅ Cancel anytime • 30-day money-back guarantee
              </p>
              <p className="text-xs text-muted-foreground">
                🔒 Secure payment with Stripe
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};