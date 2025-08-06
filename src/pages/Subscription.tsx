import React from 'react';
import { Helmet } from 'react-helmet-async';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

const Subscription: React.FC = () => {
  const { data: status } = useSubscriptionStatus();

  return (
    <PageLayout>
      <Helmet>
        <title>Subscription - AI Content Platform</title>
        <meta name="description" content="Manage your subscription and monitor usage" />
      </Helmet>

      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and monitor your AI usage
          </p>
        </div>

        {/* Simple Subscription Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            {status?.subscription ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{status.subscription.tier?.name || 'Current Plan'}</h3>
                  <p className="text-muted-foreground">
                    ${((status.subscription.tier?.price_cents || 0) / 100).toFixed(2)}/month
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Status: {status.subscription.status}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold">No Active Subscription</h3>
                <p className="text-muted-foreground">
                  Subscribe to unlock AI features
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Subscription;