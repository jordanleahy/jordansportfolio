import { Suspense } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { JobApplicationForm } from "@/components/jobs/JobApplicationForm";
import { JobApplicationsTable } from "@/components/jobs/JobApplicationsTable";
import { useOptimizedJobApplications, useOptimizedCreateJobApplication, useOptimizedUpdateJobApplication, useOptimizedDeleteJobApplication } from "@/hooks/useOptimizedJobApplications";
import { JobApplication, JobApplicationInput } from "@/types/jobApplication";
import { PageLayout } from "@/components/layout/PageLayout";
import { JobsSkeletonLoader } from "@/components/performance/SkeletonLoader";
import { useState } from "react";
export default function OptimizedJobs() {
  const {
    user,
    loading
  } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const {
    data: applications = [],
    isLoading: applicationsLoading
  } = useOptimizedJobApplications();
  const createMutation = useOptimizedCreateJobApplication();
  const updateMutation = useOptimizedUpdateJobApplication();
  const deleteMutation = useOptimizedDeleteJobApplication();
  const handleSubmit = async (data: JobApplicationInput) => {
    if (editingApplication) {
      await updateMutation.mutateAsync({
        id: editingApplication.id,
        ...data
      });
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
    return <PageLayout>
        <JobsSkeletonLoader />
      </PageLayout>;
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return <PageLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Job Applications</h1>
              <p className="text-muted-foreground">
                Track your job applications and stay organized in your job search.
              </p>
            </div>
            {!showForm && <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Application
              </Button>}
          </div>

          {showForm ? <Suspense fallback={<JobsSkeletonLoader />}>
              <JobApplicationForm onSubmit={handleSubmit} initialData={editingApplication || undefined} isLoading={createMutation.isPending || updateMutation.isPending} onCancel={handleCancel} />
            </Suspense> : <Card>
              <CardHeader>
                <CardTitle>Your Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<JobsSkeletonLoader />}>
                  <JobApplicationsTable applications={applications} onEdit={handleEdit} onDelete={handleDelete} isDeleting={deleteMutation.isPending} />
                </Suspense>
              </CardContent>
            </Card>}
        </div>
      </div>
    </PageLayout>;
}