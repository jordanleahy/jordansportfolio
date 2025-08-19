import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { AccountForm } from '@/components/forms/AccountForm';
import AppLayout from '@/components/layout/AppLayout';
import { Helmet } from 'react-helmet-async';

const AccountPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <AppLayout>
      <Helmet>
        <title>Account Settings - Story Ship</title>
        <meta name="description" content="Manage your account information and profile settings" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
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
      </div>
    </AppLayout>
  );
};

export default AccountPage;