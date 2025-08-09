import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  User, 
  CreditCard,
  Check,
  Info,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { useSubscriptionTiers } from '@/hooks/useSubscriptionStatus';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { AccountForm } from '@/components/forms/AccountForm';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, closeSettings } = useModal();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('billing');
  const { data: tiers } = useSubscriptionTiers();
  const navigate = useNavigate();

  // Derive daily limits from active tiers
  const freeTier = tiers?.find((t) => t.name?.toLowerCase()?.startsWith('free'));
  const starterTier = tiers?.find((t) => t.name?.toLowerCase() === 'starter');
  const freeDaily = freeTier?.max_gpt_images ?? 1;
  const starterDaily = starterTier?.max_gpt_images ?? 1;

  const startStarterCheckout = async () => {
    if (!user) {
      closeSettings();
      navigate('/auth');
      return;
    }
    const starter = tiers?.find((t) => t.name?.toLowerCase() === 'starter');
    if (!starter) {
      // Fallback: take user to plans page to choose
      closeSettings();
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
        closeSettings();
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (e) {
      console.error('Checkout error:', e);
      toast.error('Could not start checkout. Please try again.');
    }
  };

  return (
    <Dialog open={isSettingsOpen} onOpenChange={closeSettings}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <VisuallyHidden>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your account settings and subscription plans</DialogDescription>
        </VisuallyHidden>
        <div className="flex h-[80vh]">
          {/* Sidebar */}
          <div className="w-64 bg-muted/30 border-r border-border p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Workspace</h3>
                <button
                  onClick={() => setActiveSection('billing')}
                  className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm ${
                    activeSection === 'billing' 
                      ? 'bg-background text-foreground font-medium' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  Plans & Billing
                </button>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Account</h3>
                <button
                  onClick={() => setActiveSection('account')}
                  className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm ${
                    activeSection === 'account' 
                      ? 'bg-background text-foreground font-medium' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  <User className="h-4 w-4" />
                  Account
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8 overflow-y-auto">
            {activeSection === 'billing' && (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-foreground">Plans & Billing</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
                  {/* Free Plan */}
                  <Card className="relative">
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
                              {freeDaily} daily image (up to 30/month)
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Starter Plan */}
                  <Card className="relative">
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
                        
        <Button className="w-full" onClick={startStarterCheckout}>
                          Subscribe Now
                        </Button>
                        
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
                            
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-foreground">
                                {starterDaily} daily credit (up to 30/month)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {activeSection === 'account' && (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-foreground">Account</h1>
                </div>

                <div className="max-w-2xl">
                  <Card>
                    <CardContent className="p-6">
                      <AccountForm user={user} />
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};