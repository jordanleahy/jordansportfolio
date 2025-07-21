import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Save, 
  X,
  Briefcase
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useVendorJobs, useCreateVendorJob, useUpdateVendorJob, useDeleteVendorJob, type VendorJob } from "@/hooks/useVendorJobs";
import { useUserRole } from "@/hooks/useUserRole";

interface ProductJobsCardProps {
  vendorId: string;
}

interface JobFormData {
  job_url: string;
  job_description: string;
}

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const ProductJobsCard: React.FC<ProductJobsCardProps> = ({ vendorId }) => {
  const { isAdmin } = useUserRole();
  const { data: jobs = [], isLoading } = useVendorJobs(vendorId);
  const createJobMutation = useCreateVendorJob();
  const updateJobMutation = useUpdateVendorJob();
  const deleteJobMutation = useDeleteVendorJob();

  const [isAddingJob, setIsAddingJob] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [formData, setFormData] = useState<JobFormData>({
    job_url: "",
    job_description: "",
  });
  const [errors, setErrors] = useState<Partial<JobFormData>>({});

  // Only show to admins
  if (!isAdmin) {
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<JobFormData> = {};

    if (!formData.job_url.trim()) {
      newErrors.job_url = "Job URL is required";
    } else if (!isValidUrl(formData.job_url)) {
      newErrors.job_url = "Please enter a valid URL";
    }

    if (!formData.job_description.trim()) {
      newErrors.job_description = "Job description is required";
    } else if (formData.job_description.length < 10) {
      newErrors.job_description = "Description must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingJobId) {
        await updateJobMutation.mutateAsync({
          id: editingJobId,
          ...formData,
        });
        setEditingJobId(null);
      } else {
        await createJobMutation.mutateAsync({
          vendor_id: vendorId,
          ...formData,
        });
        setIsAddingJob(false);
      }
      
      setFormData({ job_url: "", job_description: "" });
      setErrors({});
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handleCancel = () => {
    setIsAddingJob(false);
    setEditingJobId(null);
    setFormData({ job_url: "", job_description: "" });
    setErrors({});
  };

  const startEditing = (job: VendorJob) => {
    setEditingJobId(job.id);
    setFormData({
      job_url: job.job_url,
      job_description: job.job_description,
    });
    setErrors({});
  };

  const handleDelete = async (jobId: string) => {
    try {
      await deleteJobMutation.mutateAsync(jobId);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <CardTitle>Product Jobs</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
            </Badge>
          </div>
          {!isAddingJob && !editingJobId && (
            <Button
              onClick={() => setIsAddingJob(true)}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Job
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add/Edit Form */}
        {(isAddingJob || editingJobId) && (
          <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Job URL</label>
              <Input
                placeholder="https://company.com/careers/job-posting"
                value={formData.job_url}
                onChange={(e) => setFormData({ ...formData, job_url: e.target.value })}
                className={errors.job_url ? "border-destructive" : ""}
              />
              {errors.job_url && (
                <p className="text-sm text-destructive">{errors.job_url}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Job Description</label>
              <Textarea
                placeholder="Brief description of the job position..."
                value={formData.job_description}
                onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                className={errors.job_description ? "border-destructive" : ""}
                rows={3}
              />
              {errors.job_description && (
                <p className="text-sm text-destructive">{errors.job_description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.job_description.length} characters
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                size="sm"
                disabled={createJobMutation.isPending || updateJobMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingJobId ? 'Update' : 'Save'}
              </Button>
              <Button
                onClick={handleCancel}
                size="sm"
                variant="outline"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Jobs List */}
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No job postings yet. Add the first one!
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-3 border rounded-lg bg-card space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <a
                        href={job.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        View Job Posting
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {job.job_description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing(job)}
                      disabled={editingJobId === job.id}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Job Posting</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this job posting? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(job.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};