import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { injectStructuredData, getFAQSchema } from "@/hooks/useSEO";

/**
 * Standardized AI-focused FAQ questions and answers for AEO/GEO optimization.
 * These are factual, non-promotional, and consistent across all pages.
 */
const standardFAQs = [
  {
    question: "What is AI-powered B2B procurement?",
    answer: "AI-powered B2B procurement uses artificial intelligence to automate and optimize business-to-business sourcing. Platforms like ProcureSaathi use AI to structure RFQs, match buyers with verified suppliers, analyze pricing, assess supply chain risks, and provide transparent sealed bidding for fair procurement."
  },
  {
    question: "How does ProcureSaathi use AI in sourcing?",
    answer: "ProcureSaathi leverages AI for intelligent RFQ generation, automatic supplier matching based on category and capacity, price intelligence with market benchmarks, and risk assessment. AI helps structure requirements professionally and ranks suppliers based on performance, pricing, and delivery reliability."
  },
  {
    question: "Is ProcureSaathi suitable for global buyers?",
    answer: "Yes, ProcureSaathi supports both domestic and international sourcing. Buyers from the USA, UK, Europe, Germany, Singapore, and other countries use the platform to source products from verified Indian manufacturers with export documentation support, logistics coordination, and managed fulfillment."
  },
  {
    question: "How is ProcureSaathi different from B2B marketplaces?",
    answer: "Unlike traditional B2B marketplaces that act as directories, ProcureSaathi operates as a managed procurement platform. Buyers deal with ProcureSaathi as a single counterparty, all suppliers are pre-verified, bidding is sealed and transparent, and the platform provides end-to-end fulfillment support with quality assurance."
  }
];

interface AEOFAQSectionProps {
  schemaId?: string;
  additionalFAQs?: Array<{ question: string; answer: string }>;
  showTitle?: boolean;
  className?: string;
}

/**
 * AEO/GEO optimized FAQ section with structured data.
 * Injects FAQPage schema for AI engine discoverability.
 */
export const AEOFAQSection = ({ 
  schemaId = "aeo-faq-schema",
  additionalFAQs = [],
  showTitle = true,
  className = ""
}: AEOFAQSectionProps) => {
  const allFAQs = [...standardFAQs, ...additionalFAQs];

  useEffect(() => {
    // Remove existing schema to prevent duplicates
    const existing = document.getElementById(schemaId);
    if (existing) existing.remove();

    // Inject FAQ structured data
    injectStructuredData(getFAQSchema(allFAQs), schemaId);

    return () => {
      const script = document.getElementById(schemaId);
      if (script) script.remove();
    };
  }, [schemaId]);

  return (
    <section className={`py-16 ${className}`} id="ai-faq">
      <div className="container mx-auto px-4">
        {showTitle && (
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-8">
            Frequently Asked Questions About AI Procurement
          </h2>
        )}
        
        <div className="max-w-4xl mx-auto space-y-4">
          {allFAQs.map((faq, idx) => (
            <Card key={idx} className="border-border/50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-3">{faq.question}</h3>
                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AEOFAQSection;
