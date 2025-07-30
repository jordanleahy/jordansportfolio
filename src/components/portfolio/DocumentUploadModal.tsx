import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useUpdateJobApplication } from "@/hooks/useJobApplications";
import { toast } from "sonner";
import { FileText, Upload } from "lucide-react";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobApplicationId?: string;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  jobApplicationId
}) => {
  const [selectedResume, setSelectedResume] = useState<File | null>(null);
  const [selectedCoverLetter, setSelectedCoverLetter] = useState<File | null>(null);
  
  const { uploadFile, uploading } = useFileUpload({ 
    bucket: 'job-applications', 
    folder: 'job-applications' 
  });
  
  const updateJobApplication = useUpdateJobApplication();

  const handleUpload = async () => {
    if (!jobApplicationId) {
      toast.error("No job application found to update");
      return;
    }

    if (!selectedResume && !selectedCoverLetter) {
      toast.error("Please select at least one file to upload");
      return;
    }

    try {
      const updateData: any = {};

      // Upload resume if selected
      if (selectedResume) {
        const resumeUrl = await uploadFile(selectedResume);
        if (resumeUrl) {
          updateData.resume_link = resumeUrl;
        }
      }

      // Upload cover letter if selected
      if (selectedCoverLetter) {
        const coverLetterUrl = await uploadFile(selectedCoverLetter);
        if (coverLetterUrl) {
          updateData.cover_letter_link = coverLetterUrl;
        }
      }

      // Update job application with new file URLs
      await updateJobApplication.mutateAsync({
        id: jobApplicationId,
        ...updateData
      });

      toast.success("Documents uploaded successfully!");
      onClose();
      setSelectedResume(null);
      setSelectedCoverLetter(null);
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error("Failed to upload documents. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Upload Documents
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <FileUpload
            onFileSelect={setSelectedResume}
            accept="application/pdf"
            maxSize={10}
            label="Upload Resume PDF"
            description="Upload your resume as a PDF file"
            preview={false}
          />

          <FileUpload
            onFileSelect={setSelectedCoverLetter}
            accept="application/pdf"
            maxSize={10}
            label="Upload Cover Letter PDF"
            description="Upload your cover letter as a PDF file"
            preview={false}
          />

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleUpload}
              disabled={uploading || updateJobApplication.isPending || (!selectedResume && !selectedCoverLetter)}
              className="flex-1"
            >
              {uploading || updateJobApplication.isPending ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Documents
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};