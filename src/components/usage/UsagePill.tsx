import React from "react";

interface UsagePillProps {
  used: number;
  total: number;
  className?: string;
}

export const UsagePill: React.FC<UsagePillProps> = ({ used, total, className }) => {
  return (
    <div className={[
      "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs",
      "bg-background text-foreground border-border",
      className,
    ].filter(Boolean).join(" ")}
    aria-label={`Usage ${used} of ${total}`}>
      <span className="text-muted-foreground">Usage</span>
      <span className="font-medium">{used.toLocaleString()} / {total.toLocaleString()}</span>
    </div>
  );
};
