
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
  Briefcase,
  Image,
  Eye,
  FileText
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { Vendor } from "@/types/vendor";
import { JobVisualPrompt } from "@/components/jobs/JobVisualPrompt";
import { useCompanyPortfolio } from "@/hooks/useCompanyPortfolios";
import { ResumeModal } from "@/components/jobs/ResumeModal";

interface ProductJobsCardProps {
  vendorId: string;
  vendor: Vendor;
}

interface JobFormData {
  job_title: string;
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

export const ProductJobsCard: React.FC<ProductJobsCardProps> = ({ vendorId, vendor }) => {
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: jobs = [], isLoading } = useVendorJobs(vendorId);
  const createJobMutation = useCreateVendorJob();
  const updateJobMutation = useUpdateVendorJob();
  const deleteJobMutation = useDeleteVendorJob();

  // Generate company slug (same logic as in handleCreateCoverLetter)
  const companySlug = vendor.company_name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  // Check if cover page exists for this company
  const { data: existingPortfolio } = useCompanyPortfolio(companySlug);

  const [isAddingJob, setIsAddingJob] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [formData, setFormData] = useState<JobFormData>({
    job_title: "",
    job_url: "",
    job_description: "",
  });
  const [errors, setErrors] = useState<Partial<JobFormData>>({});
  const [visualPromptJob, setVisualPromptJob] = useState<VendorJob | null>(null);
  const [resumeModalJob, setResumeModalJob] = useState<VendorJob | null>(null);

  // Only show to admins
  if (!isAdmin) {
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<JobFormData> = {};

    if (!formData.job_title.trim()) {
      newErrors.job_title = "Job title is required";
    } else if (formData.job_title.length < 3) {
      newErrors.job_title = "Job title must be at least 3 characters";
    }

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
      
      setFormData({ job_title: "", job_url: "", job_description: "" });
      setErrors({});
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handleCancel = () => {
    setIsAddingJob(false);
    setEditingJobId(null);
    setFormData({ job_title: "", job_url: "", job_description: "" });
    setErrors({});
  };

  const startEditing = (job: VendorJob) => {
    setEditingJobId(job.id);
    setFormData({
      job_title: job.job_title || "",
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

  const handleCreateCoverLetter = async (job: VendorJob) => {
    if (!vendor) {
      toast({
        title: "Error",
        description: "Company information not available",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Generating Cover Letter",
        description: "Creating personalized cover letter...",
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to generate cover letters",
          variant: "destructive"
        });
        return;
      }

      // Create job application
      const { data: jobApp, error: jobError } = await supabase
        .from('job_applications')
        .insert({
          company_name: vendor.company_name,
          job_description: job.job_description,
          job_description_link: job.job_url,
          user_id: user.id
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Generate company slug
      const companySlug = vendor.company_name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Call the cover-letter-agent function  
      const { data, error } = await supabase.functions.invoke("cover-letter-agent", {
        body: { 
          jobDescription: job.job_description,
          companyName: vendor.company_name,
          roleType: 'product_manager', // Default to product manager, could be made configurable
          userId: user.id
        },
      });

      if (error || !data?.success) {
        throw new Error(error?.message || 'Failed to generate cover letter');
      }

      // Create portfolio record
      const { error: portfolioError } = await supabase
        .from("company_portfolios")
        .upsert({
          job_application_id: jobApp.id,
          company_name: vendor.company_name,
          company_slug: companySlug,
          generated_content: { cover_letter: data.coverLetter },
          cover_letter: JSON.stringify(data.coverLetter),
          status: 'completed',
          user_id: user.id
        }, {
          onConflict: 'user_id,company_slug'
        });

      if (portfolioError) throw portfolioError;

      toast({
        title: "Success!",
        description: "Cover letter generated successfully",
      });

      // Navigate to the portfolio page
      navigate(`/portfolio/${companySlug}`);

    } catch (error: any) {
      console.error('Error generating cover letter:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate cover letter",
        variant: "destructive"
      });
    }
  };

  const handleViewCoverPage = () => {
    const portfolioUrl = `/portfolio/${companySlug}`;
    window.open(portfolioUrl, '_blank');
  };

  const handleOpenVisualPrompt = (job: VendorJob) => {
    setVisualPromptJob(job);
  };

  const handleOpenResumeModal = (job: VendorJob) => {
    setResumeModalJob(job);
  };

  return (
    <>
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
                className="md:px-3 px-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden md:inline ml-2">Add Job</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add/Edit Form */}
          {(isAddingJob || editingJobId) && (
            <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Title</label>
                <Input
                  placeholder="e.g., Product Lead Engineer"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  className={errors.job_title ? "border-destructive" : ""}
                />
                {errors.job_title && (
                  <p className="text-sm text-destructive">{errors.job_title}</p>
                )}
              </div>

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
                  className="md:px-3 px-2"
                >
                  <Save className="h-4 w-4" />
                  <span className="hidden md:inline ml-2">{editingJobId ? 'Update' : 'Save'}</span>
                </Button>
                <Button
                  onClick={handleCancel}
                  size="sm"
                  variant="outline"
                  className="md:px-3 px-2"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden md:inline ml-2">Cancel</span>
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
                  className="border rounded-lg bg-card space-y-4"
                >
                  {/* Header with View link */}
                  <div className="p-4 border-b bg-muted/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={job.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:underline flex items-center gap-1"
                      >
                        View {job.job_title || "Job Posting"}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    
                    <div className="flex items-center justify-start gap-1 md:gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreateCoverLetter(job)}
                        className="text-primary border-primary hover:bg-primary/10 md:px-3 px-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden md:inline ml-2">Create Cover Page</span>
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenResumeModal(job)}
                        className="text-primary border-primary hover:bg-primary/10 md:px-3 px-2"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="hidden md:inline ml-2">Add Resume</span>
                      </Button>
                      
                      {existingPortfolio && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleViewCoverPage}
                          className="text-primary border-primary hover:bg-primary/10 md:px-3 px-2"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden md:inline ml-2">View</span>
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenVisualPrompt(job)}
                        className="md:px-3 px-2"
                      >
                        <Image className="h-4 w-4" />
                        <span className="hidden md:inline ml-2">Visual</span>
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(job)}
                        disabled={editingJobId === job.id}
                        className="md:px-3 px-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span className="hidden md:inline ml-2">Edit</span>
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive md:px-3 px-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden md:inline ml-2">Delete</span>
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

                  {/* Job content */}
                  <div className="p-4 pt-0">
                    <div className="space-y-2">
                      {job.job_title && (
                        <h4 className="font-medium text-foreground">{job.job_title}</h4>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {job.job_description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Visual Prompt Modal */}
      {visualPromptJob && (
        <JobVisualPrompt
          isOpen={!!visualPromptJob}
          onClose={() => setVisualPromptJob(null)}
          jobTitle={visualPromptJob.job_title}
          jobDescription={visualPromptJob.job_description}
          companyName={vendor.company_name}
          vendorId={vendorId}
        />
      )}

      {/* Resume Modal */}
      {resumeModalJob && (
        <ResumeModal
          isOpen={!!resumeModalJob}
          onClose={() => setResumeModalJob(null)}
          jobId={resumeModalJob.id}
          companyName={vendor.company_name}
        />
      )}
    </>
  );
};
