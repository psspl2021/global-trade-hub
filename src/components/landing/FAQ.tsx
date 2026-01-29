import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect } from "react";
import { injectStructuredData, getFAQSchema } from "@/hooks/useSEO";

const faqData = [
  {
    category: "About ProcureSaathi",
    questions: [
      {
        question: "What is ProcureSaathi?",
        answer: "ProcureSaathi is an AI-powered B2B procurement and sourcing platform that helps buyers post RFQs, compare verified supplier bids, and manage domestic and global procurement with transparency, quality control, and supplier verification. It connects buyers, fulfillment partners, and logistics providers across domestic and export–import markets."
      },
      {
        question: "Does ProcureSaathi sell leads?",
        answer: "No, ProcureSaathi does not sell leads. The platform uses AI to detect real buyer demand and matches verified suppliers based on actual requirements. Suppliers are connected with genuine procurement intent, not purchased contact lists."
      },
      {
        question: "Are demand signals on ProcureSaathi real?",
        answer: "Demand signals on ProcureSaathi are AI-detected based on buyer research, RFQ submissions, and search behavior. The signals displayed publicly are illustrative representations of common demand patterns. Actual buyer requirements are shared directly with matched suppliers."
      },
      {
        question: "Who is ProcureSaathi for?",
        answer: "ProcureSaathi is designed for B2B buyers (MSMEs, manufacturers, traders, enterprises) looking to source products, and for verified suppliers who want to receive genuine buyer requirements. The platform also supports logistics partners offering transport and warehousing services."
      },
    ]
  },
  {
    category: "AI-Powered Procurement",
    questions: [
      {
        question: "What is AI-powered B2B procurement?",
        answer: "AI-powered B2B procurement uses artificial intelligence to automate and optimize business-to-business sourcing. Platforms like ProcureSaathi use AI to structure RFQs, match buyers with verified suppliers, analyze pricing, and provide transparent sealed bidding for fair procurement."
      },
      {
        question: "How does ProcureSaathi use AI in sourcing?",
        answer: "ProcureSaathi leverages AI for intelligent RFQ generation, automatic supplier matching based on category and capacity, price intelligence with market benchmarks, and demand detection. AI helps structure requirements professionally and ranks suppliers based on performance, pricing, and delivery reliability."
      },
      {
        question: "Is ProcureSaathi suitable for global buyers?",
        answer: "Yes, ProcureSaathi supports both domestic and international sourcing. Buyers from the USA, UK, Europe, Germany, Singapore, and other countries use the platform to source products from verified Indian manufacturers with export documentation support, logistics coordination, and managed fulfillment."
      },
      {
        question: "How is ProcureSaathi different from B2B marketplaces?",
        answer: "Unlike traditional B2B marketplaces that act as directories, ProcureSaathi operates as a managed procurement platform. Buyers deal with ProcureSaathi as a single counterparty, all suppliers are pre-verified, bidding is sealed and transparent, and the platform provides end-to-end fulfillment support with quality assurance."
      },
    ]
  },
  {
    category: "For Buyers",
    questions: [
      {
        question: "How do I post a sourcing requirement on ProcureSaathi?",
        answer: "To post a sourcing requirement, sign up and log in to your dashboard. Click on 'Post Requirement' and enter product details, quantity, budget range, and delivery requirements. ProcureSaathi's AI will structure your RFQ and match you with verified suppliers."
      },
      {
        question: "Is ProcureSaathi free for buyers?",
        answer: "Yes, ProcureSaathi offers free registration for buyers along with free RFQ posting. Buyers receive competitive bids from verified suppliers without any upfront cost."
      },
      {
        question: "Who fulfills orders on ProcureSaathi?",
        answer: "All orders are fulfilled by verified fulfillment partners within ProcureSaathi's network. Buyers deal directly with ProcureSaathi as the commercial counterparty, ensuring quality assurance, transparent pricing, and reliable delivery."
      },
    ]
  },
  {
    category: "For Suppliers",
    questions: [
      {
        question: "How does ProcureSaathi select suppliers?",
        answer: "ProcureSaathi uses an internal AI-based scoring system that evaluates price competitiveness, delivery reliability, quality history, and production capacity. Top-ranked suppliers receive higher order allocation and better visibility."
      },
      {
        question: "How can suppliers join ProcureSaathi?",
        answer: "Suppliers can register through the platform by providing business details, product catalogs, and verification documents. Once verified, suppliers receive access to buyer requirements matched to their categories and capabilities."
      },
      {
        question: "Are the case studies and scenarios on ProcureSaathi real?",
        answer: "The procurement scenarios presented on ProcureSaathi are illustrative examples based on typical workflows. They demonstrate how the platform commonly supports sourcing across various industries. Actual outcomes vary depending on category, volume, and market conditions."
      },
    ]
  },
];

export const FAQ = () => {
  // Inject FAQ structured data for SEO
  useEffect(() => {
    const schemaId = 'landing-faq-schema';
    
    // Remove any existing FAQ schema first to prevent duplicates
    const existingScript = document.getElementById(schemaId);
    if (existingScript) existingScript.remove();
    
    const allFaqs = faqData.flatMap(category => 
      category.questions.map(q => ({
        question: q.question,
        answer: q.answer
      }))
    );
    injectStructuredData(getFAQSchema(allFaqs), schemaId);
    
    // Cleanup on unmount
    return () => {
      const script = document.getElementById(schemaId);
      if (script) script.remove();
    };
  }, []);

  return (
    <section className="py-10 sm:py-12 bg-background" id="faq">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            Everything you need to know about ProcureSaathi's AI-powered procurement platform.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {faqData.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h3 className="text-lg font-semibold text-primary mb-3">
                {category.category}
              </h3>
              <Accordion type="single" collapsible className="w-full">
                {category.questions.map((faq, faqIndex) => (
                  <AccordionItem key={faqIndex} value={`${categoryIndex}-${faqIndex}`}>
                    <AccordionTrigger className="text-left text-foreground hover:text-primary text-sm py-3">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
