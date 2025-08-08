import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar,
  User,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Database,
  Settings,
  FileText
} from "lucide-react";
import { ApiUsageRecord } from "@/types/apiUsage";
import { 
  formatCurrency, 
  formatTokens, 
  getCostColorClass,
  getModelDisplayName,
  getFunctionDisplayName
} from "@/utils/costCalculator";
import { format } from "date-fns";

interface UsageDetailModalProps {
  record: ApiUsageRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UsageDetailModal = ({ record, open, onOpenChange }: UsageDetailModalProps) => {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>API Request Details</span>
            <Badge variant={record.success ? "default" : "destructive"}>
              {record.success ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {record.success ? 'Success' : 'Failed'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Timestamp</span>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  {format(new Date(record.created_at), 'MMMM dd, yyyy HH:mm:ss')}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">User</span>
                </div>
                <div className="ml-6">
                  <p className="text-sm">{record.user_name || 'Unknown User'}</p>
                  <p className="text-xs text-muted-foreground">{record.user_email}</p>
                  <p className="text-xs text-muted-foreground">ID: {record.user_id}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Function</span>
                </div>
                <div className="ml-6">
                  <p className="text-sm">{getFunctionDisplayName(record.function_name)}</p>
                  <p className="text-xs text-muted-foreground">{record.function_name}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Model & Type</span>
                </div>
                <div className="ml-6 space-y-1">
                  <Badge variant="secondary">{getModelDisplayName(record.model_used)}</Badge>
                  <Badge variant="outline">{record.request_type.replace('_', ' ')}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Usage Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {record.total_tokens && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Token Usage</span>
                  <div className="space-y-1">
                    <p className="text-sm">Total: {formatTokens(record.total_tokens)}</p>
                    {record.prompt_tokens && (
                      <p className="text-xs text-muted-foreground">
                        Input: {formatTokens(record.prompt_tokens)}
                      </p>
                    )}
                    {record.completion_tokens && (
                      <p className="text-xs text-muted-foreground">
                        Output: {formatTokens(record.completion_tokens)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {record.image_size && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Image Details</span>
                  <div className="space-y-1">
                    <p className="text-sm">Size: {record.image_size}</p>
                    {record.image_quality && (
                      <p className="text-xs text-muted-foreground">
                        Quality: {record.image_quality}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Cost</span>
                </div>
                <div className="ml-6 space-y-1">
                  <p className={`text-lg font-bold ${getCostColorClass(record.estimated_cost)}`}>
                    Estimated: {formatCurrency(record.estimated_cost)}
                  </p>
                  {record.actual_cost !== undefined && (
                    <p className="text-sm text-muted-foreground">
                      Actual: {formatCurrency(record.actual_cost)}
                    </p>
                  )}
                </div>
              </div>

              {record.response_time_ms && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Response Time</span>
                  </div>
                  <p className="text-lg font-bold">
                    {(record.response_time_ms / 1000).toFixed(2)}s
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Request Metadata */}
          {record.request_metadata && Object.keys(record.request_metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Request Metadata</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
                  {JSON.stringify(record.request_metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Error Information */}
          {!record.success && record.error_message && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span>Error Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                  <p className="text-sm text-destructive font-medium mb-2">Error Message:</p>
                  <p className="text-sm">{record.error_message}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Technical Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Request ID:</span>
                  <span className="font-mono text-xs">{record.id}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Function Name:</span>
                  <span className="font-mono text-xs">{record.function_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model Used:</span>
                  <span className="font-mono text-xs">{record.model_used}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Request Type:</span>
                  <span className="font-mono text-xs">{record.request_type}</span>
                </div>
                {record.openai_request_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">OpenAI Request ID:</span>
                    <span className="font-mono text-xs">{record.openai_request_id}</span>
                  </div>
                )}
                {record.request_metadata && (record.request_metadata as any).correlation_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Correlation ID:</span>
                    <span className="font-mono text-xs">{(record.request_metadata as any).correlation_id}</span>
                  </div>
                )}
                {record.tokens_used && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tokens Used:</span>
                    <span className="font-mono text-xs">{record.tokens_used}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};