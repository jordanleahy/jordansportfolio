import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const splitButtonVariants = cva(
  "inline-flex border transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-input bg-background hover:bg-accent/50",
        destructive: "border-destructive bg-destructive/10 hover:bg-destructive/20",
        outline: "border-input bg-background hover:bg-accent/50",
        secondary: "border-secondary bg-secondary hover:bg-secondary/80",
        ghost: "border-transparent bg-transparent hover:bg-accent/50",
      },
      size: {
        default: "h-10 rounded-md",
        sm: "h-9 rounded-md",
        lg: "h-11 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const splitButtonSectionVariants = cva(
  "inline-flex items-center justify-center text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "text-foreground hover:bg-accent hover:text-accent-foreground",
        destructive: "text-destructive-foreground hover:bg-destructive/30",
        outline: "text-foreground hover:bg-accent hover:text-accent-foreground", 
        secondary: "text-secondary-foreground hover:bg-secondary/90",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
      },
      section: {
        primary: "",
        dropdown: "",
      },
    },
  }
)

export interface SplitButtonProps extends VariantProps<typeof splitButtonVariants> {
  className?: string
  primaryAction: {
    onClick: () => void
    disabled?: boolean
    loading?: boolean
    children: React.ReactNode
    title?: string
    className?: string
  }
  dropdownTrigger: {
    disabled?: boolean
    children: React.ReactNode
    title?: string
    className?: string
  }
  dropdownContent: React.ReactNode
}

const SplitButton = React.forwardRef<HTMLDivElement, SplitButtonProps>(
  ({ className, variant, size, primaryAction, dropdownTrigger, dropdownContent, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(splitButtonVariants({ variant, size, className }))}
        {...props}
      >
        {/* Primary Action Button */}
        <button
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled || primaryAction.loading}
          title={primaryAction.title}
          className={cn(
            splitButtonSectionVariants({ variant, section: "primary" }),
            "px-3 rounded-l-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            size === "sm" && "h-8",
            size === "default" && "h-9", 
            size === "lg" && "h-10",
            primaryAction.className
          )}
        >
          {primaryAction.children}
        </button>
        
        {/* Divider */}
        <div className="w-px bg-border" />
        
        {/* Dropdown Trigger */}
        <div className="relative">
          <button
            disabled={dropdownTrigger.disabled}
            title={dropdownTrigger.title}
            className={cn(
              splitButtonSectionVariants({ variant, section: "dropdown" }),
              "px-2 rounded-r-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              size === "sm" && "h-8",
              size === "default" && "h-9",
              size === "lg" && "h-10",
              dropdownTrigger.className
            )}
          >
            {dropdownTrigger.children}
          </button>
          
          {/* Dropdown Content - This should be wrapped by a DropdownMenu component */}
          {dropdownContent}
        </div>
      </div>
    )
  }
)

SplitButton.displayName = "SplitButton"

export { SplitButton, splitButtonVariants }