import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, FileQuestion } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  className?: string;
}

/**
 * EmptyState - Professional empty state component
 * Use when there's no data to display in a section
 */
export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("empty-state animate-fade-in", className)}>
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground/60" />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && (
        <p className="empty-state-description">{description}</p>
      )}
      {action && (
        <Button
          variant={action.variant || "default"}
          onClick={action.onClick}
          className="mt-6"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

/**
 * EmptyStateInline - Compact inline empty state for smaller sections
 */
export function EmptyStateInline({
  icon: Icon = FileQuestion,
  message,
  className,
}: {
  icon?: LucideIcon;
  message: string;
  className?: string;
}) {
  return (
    <div className={cn(
      "flex items-center justify-center gap-3 py-8 px-4 text-muted-foreground",
      className
    )}>
      <Icon className="w-5 h-5 opacity-60" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

export { EmptyState as default };
