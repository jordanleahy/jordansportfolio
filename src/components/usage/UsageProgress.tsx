import React from "react";

interface UsageProgressProps {
  used: number;
  total: number;
  label?: string;
  className?: string;
}

export const UsageProgress: React.FC<UsageProgressProps> = ({ used, total, label = "Usage", className }) => {
  const percent = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">{used.toLocaleString()} / {total.toLocaleString()}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 mt-2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)}>
        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};
