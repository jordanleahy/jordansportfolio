import React from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils";
import type { Vendor } from "@/types/vendor";

interface VendorNameOrLogoProps {
  vendor: Pick<Vendor, 'company_name'> & { landscape_logo_url?: string };
  className?: string;
  showName?: boolean; // Whether to show company name alongside logo
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: "h-6 max-w-[120px]",
  md: "h-8 max-w-[160px]", 
  lg: "h-12 max-w-[240px]"
};

export const VendorNameOrLogo: React.FC<VendorNameOrLogoProps> = ({
  vendor,
  className,
  showName = false,
  size = 'md'
}) => {
  const hasLogo = vendor.landscape_logo_url;

  if (hasLogo) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <OptimizedImage
          src={vendor.landscape_logo_url!}
          alt={`${vendor.company_name} logo`}
          className={cn("object-contain", sizeClasses[size])}
          style={{ aspectRatio: '4/1' }}
        />
        {showName && (
          <span className="font-medium">{vendor.company_name}</span>
        )}
      </div>
    );
  }

  return (
    <span className={cn("font-medium", className)}>
      {vendor.company_name}
    </span>
  );
};