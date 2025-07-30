import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ExternalLink, Edit, Trash2, FileText, Building2, Paperclip, Image, Video, CalendarIcon } from "lucide-react";
import { JobApplication } from "@/types/jobApplication";
import { formatDistanceToNow, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useCompanyPortfolios } from "@/hooks/useCompanyPortfolios";
import { useOptimizedUpdateJobApplication } from "@/hooks/useOptimizedJobApplications";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createPersonalizedPortfolio } from "@/services/landingPageService";
import { cn } from "@/lib/utils";

interface JobApplicationsTableProps {
  applications: JobApplication[];
  onEdit: (application: JobApplication) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function JobApplicationsTable({ applications, onEdit, onDelete, isDeleting }: JobApplicationsTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [creatingPortfolio, setCreatingPortfolio] = useState<string | null>(null);
  const navigate = useNavigate();
  const { data: portfolios } = useCompanyPortfolios();
  const updateJobApplication = useOptimizedUpdateJobApplication();
  const { toast } = useToast();
  const { user } = useAuth();

  const getAttachmentIcon = (attachmentType?: string) => {
    if (!attachmentType) return <Paperclip className="h-3 w-3" />;
    if (attachmentType.startsWith('image/')) return <Image className="h-3 w-3" />;
    if (attachmentType.startsWith('video/')) return <Video className="h-3 w-3" />;
    return <Paperclip className="h-3 w-3" />;
  };

  const getAttachmentLabel = (attachmentType?: string) => {
    if (!attachmentType) return "File";
    if (attachmentType.startsWith('image/')) return "Image";
    if (attachmentType.startsWith('video/')) return "Video";
    return "File";
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    setDeleteId(null);
  };

  const handleCreatePortfolio = async (application: JobApplication) => {
    console.log('🎯 Starting portfolio creation for:', application.company_name);
    console.log('🎯 Application data:', {
      id: application.id,
      company_name: application.company_name,
      user_id: application.user_id,
      created_at: application.created_at
    });
    console.log('🎯 User authenticated:', !!user);
    console.log('🎯 User ID:', user?.id);
    console.log('🎯 Application user_id:', application.user_id);
    console.log('🎯 User IDs match:', user?.id === application.user_id);

    // Check authentication first
    if (!user) {
      console.error('🎯 User not authenticated');
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a personalized portfolio.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    const companySlug = application.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
    console.log('🎯 Creating portfolio with slug:', companySlug);
    
    setCreatingPortfolio(application.id);
    try {
      await createPersonalizedPortfolio(application, companySlug);
      
      console.log('🎯 Portfolio created successfully');
      toast({
        title: "Success",
        description: "Personalized landing page created successfully!",
      });
      
      // Wait a bit longer to ensure database transaction is committed and cache is updated
      setTimeout(() => {
        console.log('🎯 Navigating to portfolio:', `/portfolio/${companySlug}`);
        navigate(`/portfolio/${companySlug}`);
      }, 500); // Increased delay
    } catch (error: any) {
      console.error("Detailed error creating portfolio:", error);
      
      let errorMessage = "Failed to create personalized landing page. Please try again.";
      let errorTitle = "Error";

      // Handle specific error types
      if (error?.message?.includes('Invalid Refresh Token') || error?.message?.includes('refresh_token_not_found')) {
        errorTitle = "Session Expired";
        errorMessage = "Your session has expired. Please sign in again to continue.";
        // Redirect to auth page after a short delay
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      } else if (error?.message?.includes('User not authenticated')) {
        errorTitle = "Authentication Required";
        errorMessage = "Please sign in to create a personalized portfolio.";
        navigate('/auth');
      } else if (error?.message?.includes('OpenAI')) {
        errorTitle = "AI Service Error";
        errorMessage = "There was an issue with the AI content generation. Please try again later.";
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        errorTitle = "Network Error";
        errorMessage = "Please check your internet connection and try again.";
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreatingPortfolio(null);
    }
  };

  const handleViewPortfolio = (application: JobApplication) => {
    const companySlug = application.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
    const existingPortfolio = portfolios?.find(p => p.company_slug === companySlug);
    
    if (existingPortfolio) {
      navigate(`/portfolio/${companySlug}`);
    } else {
      toast({
        title: "No portfolio found",
        description: "Create a portfolio first using the portfolio button.",
        variant: "default",
      });
    }
  };

  const hasExistingPortfolio = (application: JobApplication) => {
    const companySlug = application.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
    return portfolios?.some(p => p.company_slug === companySlug) || false;
  };

  const handleSubmittedDateChange = (applicationId: string, date: Date | undefined) => {
    if (!date) return;
    
    updateJobApplication.mutate({
      id: applicationId,
      submitted: date.toISOString(),
    });
  };

  if (applications.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No job applications found. Add your first application to get started!
      </div>
    );
  }

  return (
    <div>
      {/* Mobile Cards View */}
      <div className="block md:hidden space-y-4">
        {applications.map((application) => (
          <Card key={application.id} className="w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">{application.company_name}</CardTitle>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {application.job_description}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Links Row */}
              <div className="flex flex-wrap gap-2">
                {application.job_description_link ? (
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href={application.job_description_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Job Link
                    </a>
                  </Button>
                ) : null}
                {application.resume_link ? (
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href={application.resume_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Resume
                    </a>
                  </Button>
                ) : null}
                {application.cover_letter_link ? (
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href={application.cover_letter_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Cover Letter
                    </a>
                  </Button>
                ) : null}
                {application.attachment_url ? (
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href={application.attachment_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      {getAttachmentIcon(application.attachment_type)}
                      {getAttachmentLabel(application.attachment_type)}
                    </a>
                  </Button>
                ) : null}
              </div>
              
              {/* Applied Date */}
              <div className="text-sm text-muted-foreground">
                Applied {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
              </div>
              
              {/* Submitted Date */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Submitted:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] justify-start text-left font-normal",
                        !application.submitted && "text-muted-foreground"
                      )}
                      size="sm"
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {application.submitted ? format(new Date(application.submitted), "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={application.submitted ? new Date(application.submitted) : undefined}
                      onSelect={(date) => handleSubmittedDateChange(application.id, date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Actions Row */}
              <div className="flex justify-between items-center pt-2 border-t">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(application)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewPortfolio(application)}
                  >
                    <Building2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCreatePortfolio(application)}
                    disabled={creatingPortfolio === application.id || hasExistingPortfolio(application)}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Job Description</TableHead>
              <TableHead>Job Link</TableHead>
              <TableHead>Resume</TableHead>
              <TableHead>Cover Letter</TableHead>
              <TableHead>Attachment</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.id}>
                <TableCell className="font-medium">
                  {application.company_name}
                </TableCell>
                <TableCell className="w-48">
                  <div className="break-words leading-tight line-clamp-4">
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
                  {application.attachment_url ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="p-1 h-auto"
                    >
                      <a 
                        href={application.attachment_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                        title={application.attachment_filename}
                      >
                        {getAttachmentIcon(application.attachment_type)}
                        <span className="sr-only">View {getAttachmentLabel(application.attachment_type)}</span>
                      </a>
                    </Button>
                  ) : (
                    <Badge variant="secondary">No file</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
                  </span>
                </TableCell>
                <TableCell>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[140px] justify-start text-left font-normal",
                          !application.submitted && "text-muted-foreground"
                        )}
                        size="sm"
                      >
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {application.submitted ? format(new Date(application.submitted), "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={application.submitted ? new Date(application.submitted) : undefined}
                        onSelect={(date) => handleSubmittedDateChange(application.id, date)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
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
                      onClick={() => handleViewPortfolio(application)}
                      className="p-1 h-auto"
                    >
                      <Building2 className="h-3 w-3" />
                      <span className="sr-only">View Portfolio</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCreatePortfolio(application)}
                      disabled={creatingPortfolio === application.id || hasExistingPortfolio(application)}
                      className="p-1 h-auto"
                    >
                      <FileText className="h-3 w-3" />
                      <span className="sr-only">
                        {creatingPortfolio === application.id ? 'Creating Portfolio' : 'Create Portfolio'}
                      </span>
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
    </div>
  );
}
