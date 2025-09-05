import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { GlobalPromptManager } from '@/components/admin/GlobalPromptManager';
import { useBackgroundPromptEnsurance } from '@/hooks/useBackgroundPromptEnsurance';

const AdminPrompts: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();

  // Initialize background prompt ensurance for admin users
  useBackgroundPromptEnsurance({
    enabled: true,
    checkIntervalMinutes: 15, // More frequent checks for admin
    autoFixEnabled: true,
    maxConcurrentThemes: 2,
    aspectRatio: '1:1'
  });

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="container mx-auto py-8">
      <Helmet>
        <title>Prompt Management - Admin Dashboard</title>
        <meta name="description" content="Manage and ensure all social media posts have generated prompts" />
      </Helmet>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Prompt Management</h1>
        <p className="text-muted-foreground text-lg">
          Monitor and ensure all social media posts have generated image prompts
        </p>
      </div>

      <GlobalPromptManager />
    </div>
  );
};

export default AdminPrompts;