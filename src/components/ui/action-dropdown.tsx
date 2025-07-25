import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

interface ActionDropdownProps {
  actions: ActionItem[];
  triggerVariant?: 'outline' | 'ghost' | 'default';
  triggerSize?: 'sm' | 'default' | 'lg';
  align?: 'start' | 'center' | 'end';
}

export const ActionDropdown: React.FC<ActionDropdownProps> = ({
  actions,
  triggerVariant = 'ghost',
  triggerSize = 'sm',
  align = 'end'
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {actions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={action.onClick}
            disabled={action.disabled}
            className={action.variant === 'destructive' ? 'text-destructive focus:text-destructive' : ''}
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};