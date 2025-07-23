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
import { useToast } from "@/hooks/use-toast";
import { Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  companyName: string;
}

export const ResumeModal: React.FC<ResumeModalProps> = ({
  isOpen,
  onClose,
  jobId,
  companyName
}) => {
  const [resumeText, setResumeText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load existing resume text when modal opens
  useEffect(() => {
    if (isOpen && jobId) {
      const fetchJobResume = async () => {
        const { data, error } = await supabase
          .from('vendor_jobs')
          .select('resume_text')
          .eq('id', jobId)
          .single();
        
        if (error) {
          console.error('Error fetching job resume:', error);
        } else {
          setResumeText((data as any)?.resume_text || '');
        }
      };
      
      fetchJobResume();
    }
  }, [isOpen, jobId]);

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
      const { error } = await supabase
        .from('vendor_jobs')
        .update({ resume_text: resumeText.trim() } as any)
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Resume text saved successfully",
      });

      // Invalidate vendor job queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['vendor-jobs'] });

      onClose();
    } catch (error: any) {
      console.error('Error saving resume:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save resume text",
        variant: "destructive"
      });
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
            Paste your resume text below. This will be stored for this vendor for future job applications.
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