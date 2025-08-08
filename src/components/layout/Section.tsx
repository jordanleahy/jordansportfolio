import React from 'react';
import { cn } from '@/lib/utils';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl';
}

export const Section: React.FC<SectionProps> = ({
  children,
  className,
  maxWidth = '4xl',
  ...props
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
  } as const;

  return (
    <section
      {...props}
      className={cn('container mx-auto px-4', maxWidthClasses[maxWidth], className)}
    >
      {children}
    </section>
  );
};

export default Section;
