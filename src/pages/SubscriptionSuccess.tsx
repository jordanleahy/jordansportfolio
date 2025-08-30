import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { supabase } from '@/integrations/supabase/client';

const SubscriptionSuccess: React.FC = () => {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id') || undefined;
  const navigate = useNavigate();
  const { data, isLoading } = useSubscriptionStatus();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // After returning from Stripe, sync subscription into DB
    (async () => {
      try {
        setSyncing(true);
        const result = await supabase.functions.invoke('check-subscription');
        
        if (result.error) {
          console.error('Subscription sync failed:', result.error);
        }
      } catch (e) {
        console.error('Subscription sync error:', e);
      } finally {
        setSyncing(false);
      }
    })();
  }, [sessionId]);

  const handleManageBilling = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (e) {
      console.error('Billing portal error', e);
    }
  };

  const debugStripeSession = async () => {
    console.log('SessionId from URL:', sessionId);
    let actualSessionId = sessionId;
    
    if (!actualSessionId) {
      actualSessionId = prompt('Please enter your Stripe session ID (starts with cs_):');
      if (!actualSessionId) return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('debug-stripe-session', {
        body: { session_id: actualSessionId }
      });
      if (error) throw error;
      console.log('Debug result:', data);
      alert(`Success! Price ID: ${data.price_id}\nUpdated Starter tier mapping!`);
      // Refresh subscription status
      window.location.reload();
    } catch (e) {
      console.error('Debug error:', e);
      alert('Debug failed: ' + e.message);
    }
  };

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <Helmet>
        <title>Subscription Success | Story Ship</title>
        <meta name="description" content="Subscription successful. Your plan is now active." />
        <link rel="canonical" href="/subscription-success" />
      </Helmet>

      <Card className="max-w-xl w-full">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Subscription successful</h1>
          <p className="text-muted-foreground">
            {syncing || isLoading
              ? 'Finalizing your account...'
              : data?.subscription?.tier?.name
                ? `You are now on the ${data.subscription.tier.name} plan.`
                : 'Your subscription is now active.'}
          </p>
          {sessionId && (
            <p className="text-xs text-muted-foreground">Session ID: {sessionId}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button variant="secondary" onClick={() => navigate('/subscription')}>View Plans</Button>
            <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
            <Button variant="outline" onClick={handleManageBilling}>Manage Billing</Button>
            <Button variant="destructive" size="sm" onClick={debugStripeSession}>
              Fix Plan Mapping
            </Button>
          </div>

          <div className="pt-2">
            <Link to="/" className="text-sm text-primary underline">Return to Home</Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default SubscriptionSuccess;
