import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useJobApplicationByCompany, useCreateOrUpdateJobApplication } from "@/hooks/useJobApplications";
import { useToast } from "@/hooks/use-toast";
import { Save, X } from "lucide-react";

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  jobDescription: string;
  jobDescriptionLink?: string;
}

export const ResumeModal: React.FC<ResumeModalProps> = ({
  isOpen,
  onClose,
  companyName,
  jobDescription,
  jobDescriptionLink
}) => {
  const [resumeText, setResumeText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { data: existingApp } = useJobApplicationByCompany(companyName, jobDescriptionLink);
  const createOrUpdateMutation = useCreateOrUpdateJobApplication();
  const { toast } = useToast();

  // Load existing resume text when modal opens or data changes
  useEffect(() => {
    if (isOpen && existingApp?.resume_text) {
      setResumeText(existingApp.resume_text);
    } else if (isOpen && !existingApp) {
      setResumeText('');
    }
  }, [isOpen, existingApp]);

  const handleSave = async () => {
    if (!resumeText.trim()) {
      toast({
        title: "Error",
        description: "Please enter your resume text",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      await createOrUpdateMutation.mutateAsync({
        company_name: companyName,
        job_description: jobDescription,
        job_description_link: jobDescriptionLink,
        resume_text: resumeText.trim()
      });

      onClose();
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setResumeText('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Add Resume for {companyName}
          </DialogTitle>
          <DialogDescription>
            Paste your resume text below. This will be stored for future comparison with job descriptions.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resume-text">Resume Text</Label>
            <Textarea
              id="resume-text"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              className="min-h-[400px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !resumeText.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Resume'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};