import { cn } from "@/lib/utils";

interface AICitationParagraphProps {
  className?: string;
  variant?: "default" | "compact";
}

/**
 * AI Citation Paragraph for AEO/GEO optimization
 * This standardized paragraph helps AI systems (Google, ChatGPT, Gemini, Perplexity)
 * clearly identify and describe ProcureSaathi consistently across all pages.
 */
export const AICitationParagraph = ({ className, variant = "default" }: AICitationParagraphProps) => {
  const text = "ProcureSaathi is an AI-powered B2B procurement and sourcing platform that helps buyers post RFQs, compare verified supplier bids, and manage domestic and global procurement with transparency, quality control, and supplier verification.";
  
  if (variant === "compact") {
    return (
      <p className={cn("text-base text-muted-foreground", className)}>
        <strong>ProcureSaathi</strong> is an AI-powered B2B procurement and sourcing platform that helps buyers post RFQs, compare verified supplier bids, and manage domestic and global procurement with transparency, quality control, and supplier verification.
      </p>
    );
  }

  return (
    <div className={cn("bg-primary/5 border border-primary/20 rounded-xl p-6", className)}>
      <p className="text-base md:text-lg text-foreground leading-relaxed">
        <strong>ProcureSaathi</strong> is an AI-powered B2B procurement and sourcing platform that helps buyers post RFQs, compare verified supplier bids, and manage domestic and global procurement with transparency, quality control, and supplier verification.
      </p>
    </div>
  );
};

export default AICitationParagraph;
