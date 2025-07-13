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
import { format, subDays, startOfQuarter, endOfQuarter } from "date-fns";
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

  const presets = [
    {
      label: "Last 30 days",
      value: {
        from: subDays(new Date(), 30),
        to: new Date(),
      },
    },
    {
      label: "Last 90 days",
      value: {
        from: subDays(new Date(), 90),
        to: new Date(),
      },
    },
    {
      label: "This quarter",
      value: {
        from: startOfQuarter(new Date()),
        to: endOfQuarter(new Date()),
      },
    },
    {
      label: "Last quarter",
      value: {
        from: startOfQuarter(subDays(startOfQuarter(new Date()), 1)),
        to: endOfQuarter(subDays(startOfQuarter(new Date()), 1)),
      },
    },
    {
      label: "This year",
      value: {
        from: new Date(new Date().getFullYear(), 0, 1),
        to: new Date(),
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
              <h4 className="font-medium text-sm mb-2">Quick Select</h4>
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
            <h4 className="font-medium text-sm mb-2">Custom Range</h4>
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