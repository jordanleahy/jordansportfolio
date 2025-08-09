import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface ContextualActionMenuProps {
  isOpen: boolean;
  coordinates: { x: number; y: number };
  onClose: () => void;
  actions: Array<{
    title: string;
    style: 'default' | 'destructive' | 'cancel';
    onPress: () => void;
  }>;
}

export function ContextualActionMenu({ 
  isOpen, 
  coordinates, 
  onClose, 
  actions 
}: ContextualActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    // Auto-dismiss after 8 seconds
    if (isOpen) {
      const timeout = setTimeout(() => {
        onClose();
      }, 8000);
      
      return () => clearTimeout(timeout);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate position to keep menu within viewport
  const getMenuPosition = () => {
    const menuWidth = 280;
    const menuHeight = actions.length * 60 + 20; // Estimate based on action count
    const padding = 16;
    
    let x = coordinates.x;
    let y = coordinates.y;
    
    // Adjust if menu would go off right edge
    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding;
    }
    
    // Adjust if menu would go off left edge
    if (x < padding) {
      x = padding;
    }
    
    // Adjust if menu would go off bottom edge
    if (y + menuHeight > window.innerHeight - padding) {
      y = coordinates.y - menuHeight;
    }
    
    // Adjust if menu would go off top edge
    if (y < padding) {
      y = padding;
    }
    
    return { x, y };
  };

  const position = getMenuPosition();

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
        style={{ pointerEvents: 'auto' }}
      />
      
      {/* Menu */}
      <div
        ref={menuRef}
        className={cn(
          "fixed z-50 min-w-[280px] rounded-xl bg-white/95 backdrop-blur-md shadow-xl border border-border/50",
          "animate-scale-in origin-top-left",
          "dark:bg-card/95"
        )}
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <div className="p-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onPress();
                onClose();
              }}
              className={cn(
                "w-full px-4 py-3 text-left rounded-lg font-medium transition-colors",
                "hover:bg-muted active:bg-muted/80",
                "focus:outline-none focus:ring-2 focus:ring-primary/20",
                action.style === 'destructive' && "text-destructive hover:bg-destructive/10",
                action.style === 'cancel' && "text-muted-foreground",
                action.style === 'default' && "text-foreground"
              )}
            >
              {action.title}
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body
  );
}
