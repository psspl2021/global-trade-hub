import * as React from "react";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/**
 * PageTransition - Wraps content with a smooth fade-in animation
 * Use this component to wrap page content for professional entrance animations
 */
export function PageTransition({ children, className, delay = 0 }: PageTransitionProps) {
  return (
    <div 
      className={cn("animate-fade-in opacity-0", className)}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {children}
    </div>
  );
}

/**
 * StaggerContainer - Container that staggers the animation of its children
 * Children will animate in sequence with a slight delay between each
 */
export function StaggerContainer({ 
  children, 
  className,
  staggerDelay = 75 
}: { 
  children: React.ReactNode; 
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <div className={cn("stagger-children", className)}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ style?: React.CSSProperties }>, {
            style: {
              ...((child.props as { style?: React.CSSProperties }).style || {}),
              animationDelay: `${index * staggerDelay}ms`,
            },
          });
        }
        return child;
      })}
    </div>
  );
}

/**
 * SlideUp - Animates content sliding up into view
 */
export function SlideUp({ children, className, delay = 0 }: PageTransitionProps) {
  return (
    <div 
      className={cn("animate-slide-up opacity-0", className)}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {children}
    </div>
  );
}

/**
 * ScaleIn - Animates content scaling in from slightly smaller
 */
export function ScaleIn({ children, className, delay = 0 }: PageTransitionProps) {
  return (
    <div 
      className={cn("animate-scale-in opacity-0", className)}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {children}
    </div>
  );
}

export { PageTransition as default };
