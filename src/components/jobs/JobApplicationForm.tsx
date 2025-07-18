import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobApplication, JobApplicationInput } from "@/types/jobApplication";

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
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof JobApplicationInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Saving..." : initialData ? "Update Application" : "Add Application"}
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