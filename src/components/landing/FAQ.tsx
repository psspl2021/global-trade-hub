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
    category: "General",
    questions: [
      {
        question: "What is ProcureSaathi?",
        answer: "ProcureSaathi is an AI-powered B2B procurement and sourcing platform that connects buyers, fulfillment partners, and logistics providers across domestic and export–import markets. It enables buyers to post sourcing requirements, receive competitive offers, and manage procurement with transparency, quality assurance, and logistics support."
      },
      {
        question: "Is ProcureSaathi a B2B marketplace?",
        answer: "Yes, ProcureSaathi is a digital B2B procurement and sourcing marketplace that connects buyers, suppliers, and logistics partners through AI-powered RFQs and transparent bidding."
      },
      {
        question: "Does ProcureSaathi support domestic and export–import sourcing?",
        answer: "Yes, ProcureSaathi supports both domestic B2B procurement and export–import sourcing across multiple product categories."
      },
      {
        question: "Is ProcureSaathi free to use?",
        answer: "ProcureSaathi offers free registration along with free CRM tools and one year of complimentary business leads for eligible businesses."
      },
      {
        question: "Which industries does ProcureSaathi support?",
        answer: "ProcureSaathi supports multiple industries including manufacturing, construction, steel, chemicals, packaging, logistics, and industrial supplies."
      },
      {
        question: "How does ProcureSaathi verify partners?",
        answer: "ProcureSaathi verifies partners through document checks, performance scoring, delivery history, and quality assessments to ensure reliable and trusted sourcing."
      },
      {
        question: "Are the case studies on ProcureSaathi real customer stories?",
        answer: "The procurement scenarios presented on ProcureSaathi are illustrative examples based on typical workflows. They demonstrate how the platform commonly supports sourcing across various industries. Actual outcomes vary depending on category, volume, and market conditions."
      },
    ]
  },
  {
    category: "For Buyers",
    questions: [
      {
        question: "How do I post a sourcing requirement on ProcureSaathi?",
        answer: "To post a sourcing requirement on ProcureSaathi, sign up, log in to your dashboard, and click on 'Post Requirement'. Enter product details, quantity, budget range, and delivery requirements. ProcureSaathi's verified fulfillment network will provide competitive offers for your requirement."
      },
      {
        question: "Who fulfills my orders on ProcureSaathi?",
        answer: "All orders on ProcureSaathi are fulfilled by verified fulfillment partners within ProcureSaathi's partner network. Buyers deal directly with ProcureSaathi as the commercial counterparty, ensuring full protection, quality assurance, transparent pricing, and reliable delivery."
      },
      {
        question: "How does ProcureSaathi ensure competitive pricing?",
        answer: "ProcureSaathi uses an internal AI-based scoring system to rank fulfillment partners based on pricing, delivery reliability, quality performance, and capacity. Buyers typically receive competitive offers without manual negotiations."
      },
    ]
  },
  {
    category: "For Fulfillment Partners",
    questions: [
      {
        question: "How does ProcureSaathi select fulfillment partners?",
        answer: "ProcureSaathi selects fulfillment partners using an internal scoring system that evaluates price competitiveness, delivery reliability, quality history, and production capacity. Top-ranked partners typically receive higher order allocation and better visibility."
      },
      {
        question: "How many offers can fulfillment partners submit per month?",
        answer: "Free-tier fulfillment partners can submit up to five offers per month. Premium partners receive unlimited submissions, priority ranking, and enhanced visibility across ProcureSaathi's buyer network."
      },
      {
        question: "Can fulfillment partners upload product catalogs on ProcureSaathi?",
        answer: "Yes, fulfillment partners can upload detailed product catalogs including images, specifications, pricing ranges, minimum order quantities, and certifications to help ProcureSaathi match them with relevant buyer requirements."
      },
    ]
  },
  {
    category: "For Logistics Partners",
    questions: [
      {
        question: "What vehicles can logistics partners register on ProcureSaathi?",
        answer: "Logistics partners can register trucks, trailers, tankers, container trucks, mini trucks, pickups, tempos, and light commercial vehicles. Each vehicle must be verified with valid RC documentation before becoming visible to customers."
      },
      {
        question: "Can logistics partners list warehousing space on ProcureSaathi?",
        answer: "Yes, logistics partners can list warehousing facilities including dry storage, cold storage, bonded warehouses, open yards, and hazardous material storage to offer integrated logistics and storage solutions."
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
            ProcureSaathi is an AI-powered B2B procurement and sourcing platform for buyers, fulfillment partners, and logistics providers across domestic and export–import markets.
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
