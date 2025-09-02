import React from 'react';
import { Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RunButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const RunButton: React.FC<RunButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className="relative min-w-[120px] bg-accent hover:bg-accent/90 text-accent-foreground font-medium"
      size="lg"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Play className="mr-2 h-4 w-4" />
          Run
        </>
      )}
    </Button>
  );
};