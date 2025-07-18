import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { JobApplicationForm } from "@/components/jobs/JobApplicationForm";
import { JobApplicationsTable } from "@/components/jobs/JobApplicationsTable";
import { 
  useJobApplications, 
  useCreateJobApplication, 
  useUpdateJobApplication, 
  useDeleteJobApplication 
} from "@/hooks/useJobApplications";
import { JobApplication, JobApplicationInput } from "@/types/jobApplication";
import { PageLayout } from "@/components/layout/PageLayout";

export default function Jobs() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);

  const { data: applications = [], isLoading: applicationsLoading } = useJobApplications();
  const createMutation = useCreateJobApplication();
  const updateMutation = useUpdateJobApplication();
  const deleteMutation = useDeleteJobApplication();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (data: JobApplicationInput) => {
    if (editingApplication) {
      await updateMutation.mutateAsync({ id: editingApplication.id, ...data });
      setEditingApplication(null);
    } else {
      await createMutation.mutateAsync(data);
    }
    setShowForm(false);
  };

  const handleEdit = (application: JobApplication) => {
    setEditingApplication(application);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingApplication(null);
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <PageLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-1">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.email?.split('@')[0] || 'User'}
                </p>
                <h1 className="text-3xl font-bold tracking-tight">Job Applications</h1>
              </div>
              <p className="text-muted-foreground">
                Track your job applications and stay organized in your job search.
              </p>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Application
              </Button>
            )}
          </div>

          {showForm ? (
            <JobApplicationForm
              onSubmit={handleSubmit}
              initialData={editingApplication || undefined}
              isLoading={createMutation.isPending || updateMutation.isPending}
              onCancel={handleCancel}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Your Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {applicationsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <JobApplicationsTable
                    applications={applications}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isDeleting={deleteMutation.isPending}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
}