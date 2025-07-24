import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAdminComparisons, useDeleteComparison } from '@/hooks/useComparisons';
import { DeleteComparisonModal } from '@/components/admin/DeleteComparisonModal';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const AdminComparisons: React.FC = () => {
  const navigate = useNavigate();
  const { data: comparisons, isLoading, refetch } = useAdminComparisons();
  const deleteComparison = useDeleteComparison();
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; comparison: any | null }>({
    isOpen: false,
    comparison: null
  });

  // Set up real-time subscription to refresh data when comparisons are created/updated
  useEffect(() => {
    const channel = supabase
      .channel('admin-comparisons-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comparisons'
        },
        () => {
          // Refetch data when any comparison changes
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const handleDeleteClick = (comparison: any) => {
    setDeleteModal({ isOpen: true, comparison });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.comparison) return;
    
    try {
      await deleteComparison.mutateAsync(deleteModal.comparison.id);
      toast.success('Comparison deleted successfully');
      setDeleteModal({ isOpen: false, comparison: null });
    } catch (error) {
      toast.error('Failed to delete comparison');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, comparison: null });
  };

  return (
    <AppLayout>
      <Helmet>
        <title>Admin - Comparisons</title>
        <meta name="description" content="Manage comparison pages" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manage Comparisons</h1>
            <p className="text-muted-foreground mt-2">Create and manage dynamic comparison pages</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button 
              onClick={() => navigate('/admin/comparisons/new')}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Comparison
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-6 bg-muted rounded w-20 mb-3"></div>
                  <div className="flex gap-2">
                    <div className="h-9 bg-muted rounded w-16"></div>
                    <div className="h-9 bg-muted rounded w-16"></div>
                    <div className="h-9 bg-muted rounded w-16"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {comparisons?.map((comparison) => (
              <Card key={comparison.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg leading-tight">{comparison.title}</CardTitle>
                    <Badge variant={comparison.status === 'published' ? 'default' : 'secondary'}>
                      {comparison.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {comparison.meta_description.substring(0, 100)}...
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-muted-foreground mb-4">
                    Updated {formatDistanceToNow(new Date(comparison.updated_at))} ago
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/comparison/${comparison.slug}`)}
                      className="gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/comparisons/${comparison.id}/edit`)}
                      className="gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(comparison)}
                      className="gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && (!comparisons || comparisons.length === 0) && (
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-semibold mb-2">No comparisons yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first comparison to get started
              </p>
              <Button onClick={() => navigate('/admin/comparisons/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Comparison
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <DeleteComparisonModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        comparisonTitle={deleteModal.comparison?.title || ''}
        isDeleting={deleteComparison.isPending}
      />
    </AppLayout>
  );
};