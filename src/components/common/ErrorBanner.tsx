import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const ErrorBanner = ({ message, onDismiss, onRetry, className = "" }: ErrorBannerProps) => {
  return (
    <div className={`flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg ${className}`}>
      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-destructive font-medium">{message}</p>
      </div>
      <div className="flex items-center gap-2">
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="h-8 px-3 text-xs"
          >
            Retry
          </Button>
        )}
        {onDismiss && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};