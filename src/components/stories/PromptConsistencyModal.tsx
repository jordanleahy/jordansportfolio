import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, XCircle, Lightbulb } from "lucide-react";
import { ConsistencyReport, ConsistencyIssue } from "@/hooks/usePromptConsistencyAnalysis";

interface PromptConsistencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ConsistencyReport | null;
  isLoading: boolean;
}

const getSeverityIcon = (severity: ConsistencyIssue['severity']) => {
  switch (severity) {
    case 'high':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'medium':
      return <AlertCircle className="h-4 w-4 text-warning" />;
    case 'low':
      return <CheckCircle className="h-4 w-4 text-success" />;
  }
};

const getSeverityColor = (severity: ConsistencyIssue['severity']) => {
  switch (severity) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'outline';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-success';
  if (score >= 80) return 'text-success';
  if (score >= 70) return 'text-warning';
  if (score >= 60) return 'text-warning';
  return 'text-destructive';
};

const getScoreStatus = (score: number) => {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Moderate';
  if (score >= 60) return 'Poor';
  return 'Very Poor';
};

export const PromptConsistencyModal = ({
  isOpen,
  onClose,
  report,
  isLoading,
}: PromptConsistencyModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prompt Consistency Analysis</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Analyzing prompt consistency...</span>
          </div>
        )}

        {report && !isLoading && (
          <div className="space-y-6">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Consistency Score
                  <span className={`font-bold ${getScoreColor(report.consistencyScore)}`}>
                    {report.consistencyScore}/100
                  </span>
                </CardTitle>
                <CardDescription>
                  {getScoreStatus(report.consistencyScore)} consistency across {report.totalPosts} posts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={report.consistencyScore} className="mb-4" />
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>{report.summary}</AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Issues Breakdown */}
            {report.issues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Identified Issues ({report.issues.length})</CardTitle>
                  <CardDescription>
                    Issues that may affect visual consistency across your posts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.issues.map((issue, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(issue.severity)}
                          <Badge variant={getSeverityColor(issue.severity)} className="capitalize">
                            {issue.type}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {issue.severity} severity
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-1">Issue Description</h4>
                        <p className="text-sm text-muted-foreground">{issue.description}</p>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-1">Affected Posts</h4>
                        <div className="flex flex-wrap gap-1">
                          {issue.affectedPosts.map((postId) => (
                            <Badge key={postId} variant="outline" className="text-xs">
                              {postId.slice(-6)}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="bg-muted/30 rounded p-3">
                        <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
                          <Lightbulb className="h-3 w-3" />
                          Suggestion
                        </h4>
                        <p className="text-sm text-muted-foreground">{issue.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {report.issues.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                    <h3 className="font-medium text-lg mb-2">No Issues Found!</h3>
                    <p className="text-muted-foreground">
                      Your prompts show excellent consistency across all analyzed dimensions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};