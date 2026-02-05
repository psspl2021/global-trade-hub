import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border-border text-foreground bg-background hover:bg-muted",
        success: "border-transparent bg-success text-success-foreground shadow-sm hover:bg-success/90",
        warning: "border-transparent bg-warning text-warning-foreground shadow-sm hover:bg-warning/90",
        // Soft/muted variants (colored background with matching text)
        "primary-soft": "border-primary/20 bg-primary/10 text-primary hover:bg-primary/15",
        "success-soft": "border-success/20 bg-success/10 text-success hover:bg-success/15",
        "warning-soft": "border-warning/20 bg-warning/10 text-warning hover:bg-warning/15",
        "destructive-soft": "border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/15",
        // Status badges
        active: "border-success/30 bg-success/10 text-success",
        pending: "border-warning/30 bg-warning/10 text-warning",
        inactive: "border-muted-foreground/30 bg-muted text-muted-foreground",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
