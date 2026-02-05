import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

/**
 * LoadingState - A professional loading indicator
 * Use for async operations, page loads, and data fetching
 */
export function LoadingState({ 
  className, 
  size = "md", 
  text,
  fullScreen = false 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && (
        <p className={cn("text-muted-foreground font-medium", textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
}

/**
 * LoadingDots - Animated dots for inline loading states
 */
export function LoadingDots({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
    </span>
  );
}

/**
 * LoadingOverlay - Overlay for sections being updated
 */
export function LoadingOverlay({ 
  className,
  text 
}: { 
  className?: string;
  text?: string;
}) {
  return (
    <div className={cn(
      "absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-inherit",
      className
    )}>
      <LoadingState size="md" text={text} />
    </div>
  );
}

/**
 * ButtonLoader - Inline spinner for button loading states
 */
export function ButtonLoader({ className }: { className?: string }) {
  return (
    <Loader2 className={cn("w-4 h-4 animate-spin", className)} />
  );
}

export { LoadingState as default };
