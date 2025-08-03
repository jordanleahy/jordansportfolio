import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ActionButtonProps {
  icon: React.ReactNode;
  loadingIcon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
  variant?: 'ghost' | 'outline' | 'default' | 'destructive' | 'secondary' | 'link';
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  loadingIcon = <Loader2 className="h-4 w-4 animate-spin" />,
  onClick,
  disabled = false,
  loading = false,
  title,
  variant = 'ghost',
  size = 'sm'
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
    >
      {loading ? loadingIcon : icon}
    </Button>
  );
};