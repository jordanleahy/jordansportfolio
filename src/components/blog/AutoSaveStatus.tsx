
import { memo } from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

interface AutoSaveStatusProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  className?: string;
}

export const AutoSaveStatus = memo(({ status, lastSaved, className = '' }: AutoSaveStatusProps) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'saving':
        return (
          <span className="flex items-center gap-1 text-muted-foreground text-sm">
            <Loader2 className="h-3 w-3 animate-spin" />
            Auto-saving...
          </span>
        );
      case 'saved':
        return (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <Check className="h-3 w-3" />
            Saved {lastSaved ? `at ${lastSaved.toLocaleTimeString()}` : ''}
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-red-600 text-sm">
            <AlertCircle className="h-3 w-3" />
            Save failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      {getStatusDisplay()}
    </div>
  );
});

AutoSaveStatus.displayName = 'AutoSaveStatus';
