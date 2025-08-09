import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface WorkReportDatePickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  className?: string;
  buttonClassName?: string;
  placeholder?: string;
}

export const WorkReportDatePicker: React.FC<WorkReportDatePickerProps> = ({
  selectedDate,
  onDateSelect,
  className = "",
  buttonClassName = "",
  placeholder = "Pick a date"
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            buttonClassName,
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {selectedDate ? format(selectedDate, "MMM d, yyyy") : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        align="start"
        // Mobile optimization - ensure proper z-index and touch handling
        style={{ zIndex: 9999 }}
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onDateSelect(date)}
          disabled={(date) => date > new Date()}
          initialFocus
          // Mobile-optimized calendar with better touch targets
          className="p-3 touch-manipulation"
          classNames={{
            day: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent [&:has([aria-selected])]:text-accent-foreground first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 hover:bg-accent hover:text-accent-foreground",
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
            nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 touch-manipulation",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            caption_dropdowns: "flex justify-center gap-1"
          }}
        />
      </PopoverContent>
    </Popover>
  );
};