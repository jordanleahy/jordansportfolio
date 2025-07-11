import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionContainerProps {
  children: ReactNode;
  sectionIndex: number;
  className?: string;
}

export const SectionContainer = ({ children, sectionIndex, className }: SectionContainerProps) => {
  const isAlternate = sectionIndex % 2 === 1;
  
  return (
    <section className={cn(
      "py-16 px-4",
      isAlternate && "bg-muted/30",
      className
    )}>
      <div className="max-w-4xl mx-auto">
        {children}
      </div>
    </section>
  );
};