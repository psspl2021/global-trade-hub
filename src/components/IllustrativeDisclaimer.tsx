import { Info } from "lucide-react";

interface IllustrativeDisclaimerProps {
  className?: string;
  variant?: "default" | "compact" | "blog";
}

export const IllustrativeDisclaimer = ({ 
  className = "", 
  variant = "default" 
}: IllustrativeDisclaimerProps) => {
  if (variant === "compact") {
    return (
      <p className={`text-sm text-muted-foreground italic ${className}`}>
        This is an illustrative procurement scenario based on typical workflows on ProcureSaathi. 
        Actual outcomes may vary depending on category, volume, and market conditions.
      </p>
    );
  }

  if (variant === "blog") {
    return (
      <aside className={`bg-muted/50 border border-border rounded-lg p-4 ${className}`}>
        <p className="text-sm text-muted-foreground italic">
          This content is illustrative and based on common procurement workflows on ProcureSaathi. 
          Actual outcomes may vary depending on requirements, suppliers, and market conditions.
        </p>
      </aside>
    );
  }

  return (
    <div className={`bg-muted/50 border border-border rounded-lg p-4 flex items-start gap-3 ${className}`}>
      <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
      <p className="text-sm text-muted-foreground">
        This is an illustrative procurement scenario based on typical workflows on ProcureSaathi. 
        Actual outcomes may vary depending on category, volume, and market conditions.
      </p>
    </div>
  );
};
