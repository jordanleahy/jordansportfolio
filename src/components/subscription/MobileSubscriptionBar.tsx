import React from 'react';
import { Crown, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MobileSubscriptionBarProps {
  isVisible: boolean;
  onUpgrade: () => void;
  onDismiss: () => void;
  currentUsage?: {
    percentage: number;
    feature: string;
  };
}

export const MobileSubscriptionBar: React.FC<MobileSubscriptionBarProps> = ({
  isVisible,
  onUpgrade,
  onDismiss,
  currentUsage,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-primary to-accent p-4 shadow-lg animate-slide-in-up">
      <div className="flex items-center justify-between gap-3">
        {/* Left content */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            {currentUsage ? (
              <>
                <div className="font-semibold text-white text-sm">
                  {currentUsage.feature} {currentUsage.percentage}% used
                </div>
                <div className="text-white/80 text-xs">
                  Upgrade for unlimited access
                </div>
              </>
            ) : (
              <>
                <div className="font-semibold text-white text-sm">
                  Unlock Premium Features
                </div>
                <div className="text-white/80 text-xs">
                  Get unlimited AI generations
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={onUpgrade}
            size="sm"
            className="bg-white text-primary hover:bg-white/90 font-medium h-8 px-3"
          >
            <span className="text-xs">Upgrade</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
          <Button
            onClick={onDismiss}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-white hover:bg-white/20"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Progress bar for usage */}
      {currentUsage && (
        <div className="mt-3">
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${Math.min(currentUsage.percentage, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
