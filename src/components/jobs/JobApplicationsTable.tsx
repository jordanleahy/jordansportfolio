import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Edit, Trash2, FileText } from "lucide-react";
import { JobApplication } from "@/types/jobApplication";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useCreateCompanyPortfolio } from "@/hooks/useCompanyPortfolios";

interface JobApplicationsTableProps {
  applications: JobApplication[];
  onEdit: (application: JobApplication) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function JobApplicationsTable({ applications, onEdit, onDelete, isDeleting }: JobApplicationsTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();
  const createPortfolio = useCreateCompanyPortfolio();

  const handleDelete = (id: string) => {
    onDelete(id);
    setDeleteId(null);
  };

  const handleCreatePortfolio = async (application: JobApplication) => {
    const companySlug = application.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
    
    try {
      await createPortfolio.mutateAsync({
        job_application_id: application.id,
        company_name: application.company_name,
        company_slug: companySlug,
        status: 'draft'
      });
      
      navigate(`/${companySlug}`);
    } catch (error) {
      console.error("Error creating portfolio:", error);
    }
  };

  if (applications.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No job applications found. Add your first application to get started!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Job Description</TableHead>
            <TableHead>Job Link</TableHead>
            <TableHead>Resume</TableHead>
            <TableHead>Cover Letter</TableHead>
            <TableHead>Applied</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((application) => (
            <TableRow key={application.id}>
              <TableCell className="font-medium">
                {application.company_name}
              </TableCell>
              <TableCell className="max-w-xs">
                <div className="truncate" title={application.job_description}>
                  {application.job_description}
                </div>
              </TableCell>
              <TableCell>
                {application.job_description_link ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="p-1 h-auto"
                  >
                    <a 
                      href={application.job_description_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="sr-only">View Job Posting</span>
                    </a>
                  </Button>
                ) : (
                  <Badge variant="secondary">No link</Badge>
                )}
              </TableCell>
              <TableCell>
                {application.resume_link ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="p-1 h-auto"
                  >
                    <a 
                      href={application.resume_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="sr-only">View Resume</span>
                    </a>
                  </Button>
                ) : (
                  <Badge variant="secondary">No link</Badge>
                )}
              </TableCell>
              <TableCell>
                {application.cover_letter_link ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="p-1 h-auto"
                  >
                    <a 
                      href={application.cover_letter_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="sr-only">View Cover Letter</span>
                    </a>
                  </Button>
                ) : (
                  <Badge variant="secondary">No link</Badge>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(application)}
                    className="p-1 h-auto"
                  >
                    <Edit className="h-3 w-3" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCreatePortfolio(application)}
                    disabled={createPortfolio.isPending}
                    className="p-1 h-auto"
                  >
                    <FileText className="h-3 w-3" />
                    <span className="sr-only">Create Portfolio</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(application.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Application</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete your application to {application.company_name}? 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(application.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}