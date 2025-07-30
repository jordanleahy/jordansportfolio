import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { useFileUpload } from "@/hooks/useFileUpload";
import { JobApplication, JobApplicationInput } from "@/types/jobApplication";
import { toast } from "sonner";

interface JobApplicationFormProps {
  onSubmit: (data: JobApplicationInput) => void;
  initialData?: JobApplication;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function JobApplicationForm({ onSubmit, initialData, isLoading, onCancel }: JobApplicationFormProps) {
  const [formData, setFormData] = useState<JobApplicationInput>({
    company_name: initialData?.company_name || "",
    job_description: initialData?.job_description || "",
    job_description_link: initialData?.job_description_link || "",
    resume_link: initialData?.resume_link || "",
    cover_letter_link: initialData?.cover_letter_link || "",
    attachment_url: initialData?.attachment_url || "",
    attachment_filename: initialData?.attachment_filename || "",
    attachment_type: initialData?.attachment_type || "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedResume, setSelectedResume] = useState<File | null>(null);
  const [selectedCoverLetter, setSelectedCoverLetter] = useState<File | null>(null);
  const { uploadFile, uploading } = useFileUpload({ 
    bucket: 'job-applications', 
    folder: 'job-applications' 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalFormData = { ...formData };

    try {
      // Upload resume PDF if selected
      if (selectedResume) {
        const resumeUrl = await uploadFile(selectedResume);
        if (resumeUrl) {
          finalFormData.resume_link = resumeUrl;
        }
      }

      // Upload cover letter PDF if selected
      if (selectedCoverLetter) {
        const coverLetterUrl = await uploadFile(selectedCoverLetter);
        if (coverLetterUrl) {
          finalFormData.cover_letter_link = coverLetterUrl;
        }
      }

      // Upload general attachment if selected
      if (selectedFile) {
        const attachmentUrl = await uploadFile(selectedFile);
        if (attachmentUrl) {
          finalFormData = {
            ...finalFormData,
            attachment_url: attachmentUrl,
            attachment_filename: selectedFile.name,
            attachment_type: selectedFile.type,
          };
        }
      }
    } catch (error) {
      toast.error("Failed to upload files. Please try again.");
      return;
    }

    onSubmit(finalFormData);
  };

  const handleChange = (field: keyof JobApplicationInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Application" : "Add New Application"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name *</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => handleChange("company_name", e.target.value)}
              placeholder="Enter company name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_description">Job Description *</Label>
            <Textarea
              id="job_description"
              value={formData.job_description}
              onChange={(e) => handleChange("job_description", e.target.value)}
              placeholder="Enter job description or title"
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_description_link">Job Description Link</Label>
            <Input
              id="job_description_link"
              type="url"
              value={formData.job_description_link}
              onChange={(e) => handleChange("job_description_link", e.target.value)}
              placeholder="https://example.com/job-posting"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume_link">Resume Link</Label>
            <Input
              id="resume_link"
              type="url"
              value={formData.resume_link}
              onChange={(e) => handleChange("resume_link", e.target.value)}
              placeholder="https://example.com/your-resume.pdf"
            />
          </div>

          <FileUpload
            onFileSelect={setSelectedResume}
            accept="application/pdf"
            maxSize={10}
            label="Upload Resume PDF"
            description="Upload your resume as a PDF file"
            preview={false}
          />

          <div className="space-y-2">
            <Label htmlFor="cover_letter_link">Cover Letter Link</Label>
            <Input
              id="cover_letter_link"
              type="url"
              value={formData.cover_letter_link}
              onChange={(e) => handleChange("cover_letter_link", e.target.value)}
              placeholder="https://example.com/your-cover-letter.pdf"
            />
          </div>

          <FileUpload
            onFileSelect={setSelectedCoverLetter}
            accept="application/pdf"
            maxSize={10}
            label="Upload Cover Letter PDF"
            description="Upload your cover letter as a PDF file"
            preview={false}
          />

          <FileUpload
            onFileSelect={handleFileSelect}
            accept="image/*,video/*"
            maxSize={50}
            label="Upload Photo or Video"
            description="Add a photo or video to your job application"
            currentFile={formData.attachment_filename}
          />

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading || uploading} className="flex-1">
              {uploading ? "Uploading..." : isLoading ? "Saving..." : initialData ? "Update Application" : "Add Application"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}