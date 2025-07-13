import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { format, subDays, startOfQuarter, endOfQuarter, subQuarters, addQuarters, getQuarter, getYear } from "date-fns";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  dateRange: {
    from: Date;
    to: Date;
  };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onDateRangeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState(dateRange);

  const getCurrentQuarter = () => {
    const now = new Date();
    return {
      quarter: getQuarter(now),
      year: getYear(now)
    };
  };

  const getQuarterLabel = (date: Date) => {
    return `Q${getQuarter(date)} ${getYear(date)}`;
  };

  const presets = [
    {
      label: "Current Quarter",
      value: {
        from: startOfQuarter(new Date()),
        to: endOfQuarter(new Date()),
      },
    },
    {
      label: "Previous Quarter",
      value: {
        from: startOfQuarter(subQuarters(new Date(), 1)),
        to: endOfQuarter(subQuarters(new Date(), 1)),
      },
    },
    {
      label: "Last 2 Quarters",
      value: {
        from: startOfQuarter(subQuarters(new Date(), 1)),
        to: endOfQuarter(new Date()),
      },
    },
    {
      label: "Last 4 Quarters",
      value: {
        from: startOfQuarter(subQuarters(new Date(), 3)),
        to: endOfQuarter(new Date()),
      },
    },
    {
      label: "Q1 2024",
      value: {
        from: new Date(2024, 0, 1),
        to: new Date(2024, 2, 31),
      },
    },
    {
      label: "Q2 2024",
      value: {
        from: new Date(2024, 3, 1),
        to: new Date(2024, 5, 30),
      },
    },
    {
      label: "Q3 2024",
      value: {
        from: new Date(2024, 6, 1),
        to: new Date(2024, 8, 30),
      },
    },
    {
      label: "Q4 2024",
      value: {
        from: new Date(2024, 9, 1),
        to: new Date(2024, 11, 31),
      },
    },
  ];

  const handlePresetClick = (preset: any) => {
    setTempRange(preset.value);
    onDateRangeChange(preset.value);
    setIsOpen(false);
  };

  const handleApplyCustomRange = () => {
    onDateRangeChange(tempRange);
    setIsOpen(false);
  };

  const formatDateRange = () => {
    // Check if it's a single quarter
    const fromQuarter = startOfQuarter(dateRange.from);
    const toQuarter = endOfQuarter(dateRange.from);
    
    if (dateRange.from.getTime() === fromQuarter.getTime() && 
        dateRange.to.getTime() === toQuarter.getTime()) {
      return getQuarterLabel(dateRange.from);
    }
    
    // Check if it spans multiple quarters but ends at quarter boundaries
    const fromQuarterStart = startOfQuarter(dateRange.from);
    const toQuarterEnd = endOfQuarter(dateRange.to);
    
    if (dateRange.from.getTime() === fromQuarterStart.getTime() && 
        dateRange.to.getTime() === toQuarterEnd.getTime()) {
      return `${getQuarterLabel(dateRange.from)} - ${getQuarterLabel(dateRange.to)}`;
    }
    
    // Default format for custom ranges
    const from = format(dateRange.from, "MMM d, yyyy");
    const to = format(dateRange.to, "MMM d, yyyy");
    return `${from} - ${to}`;
  };

  const isPresetActive = (preset: any) => {
    return (
      preset.value.from.getTime() === dateRange.from.getTime() &&
      preset.value.to.getTime() === dateRange.to.getTime()
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-fit justify-start text-left">
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{formatDateRange()}</span>
          <span className="sm:hidden">Date Range</span>
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-background border shadow-lg z-50" align="end">
        <div className="flex">
          {/* Presets */}
          <div className="border-r">
            <div className="p-3">
              <h4 className="font-medium text-sm mb-2">Quarterly Periods</h4>
              <div className="space-y-1">
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant={isPresetActive(preset) ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start h-8"
                    onClick={() => handlePresetClick(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Calendar */}
          <div className="p-3">
            <h4 className="font-medium text-sm mb-2">Custom Range (Quarterly Data)</h4>
            <Calendar
              mode="range"
              selected={{
                from: tempRange.from,
                to: tempRange.to,
              }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setTempRange({ from: range.from, to: range.to });
                }
              }}
              numberOfMonths={2}
              className={cn("p-3 pointer-events-auto")}
            />
            <div className="flex justify-between items-center mt-3 pt-3 border-t">
              <div className="text-sm text-muted-foreground">
                {tempRange.from && tempRange.to && (
                  <Badge variant="secondary" className="text-xs">
                    {format(tempRange.from, "MMM d")} - {format(tempRange.to, "MMM d")}
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                onClick={handleApplyCustomRange}
                disabled={!tempRange.from || !tempRange.to}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};