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
    category: "For Buyers",
    questions: [
      {
        question: "How do I post a sourcing requirement on ProcureSaathi?",
        answer: "Simply sign up, navigate to your dashboard, and click 'Post Requirement'. Fill in product details, quantity, budget range, and delivery requirements. ProcureSaathi's verified fulfillment network will provide competitive offers."
      },
      {
        question: "Who fulfills my orders?",
        answer: "All orders are fulfilled by ProcureSaathi's verified partner network. You deal exclusively with ProcureSaathi as your commercial counterparty — enjoying full protection, quality assurance, and transparent pricing."
      },
      {
        question: "How does ProcureSaathi ensure competitive pricing?",
        answer: "ProcureSaathi's internal scoring system ranks fulfillment partners based on price, delivery reliability, quality, and capacity. You always receive the best-value offer without needing to negotiate directly."
      },
    ]
  },
  {
    category: "For Fulfillment Partners",
    questions: [
      {
        question: "How does ProcureSaathi select fulfillment partners?",
        answer: "Partners are ranked using an internal scoring system combining price competitiveness, delivery reliability, quality track record, and capacity. Top-ranked partners are assigned orders by ProcureSaathi."
      },
      {
        question: "How many offers can I submit per month?",
        answer: "Free tier partners can submit up to 5 offers per month. Premium partners enjoy unlimited submissions, priority ranking, and enhanced visibility in ProcureSaathi's network."
      },
      {
        question: "Can I upload my product catalog?",
        answer: "Yes! Partners can maintain detailed product catalogs with images, specifications, pricing ranges, MOQ, and certifications. This helps ProcureSaathi match you with suitable requirements."
      },
    ]
  },
  {
    category: "For Logistics Partners",
    questions: [
      {
        question: "What vehicles can I register on ProcureSaathi?",
        answer: "We support trucks, trailers, tankers, container trucks, mini trucks, pickups, tempos, and LPVs. Each vehicle requires RC document verification before becoming visible to customers."
      },
      {
        question: "What is the logistics service fee?",
        answer: "Logistics partners pay a 0.25% service fee on successful transport bookings - significantly lower than the 1% charged on product supply transactions."
      },
      {
        question: "Can I also list warehousing space?",
        answer: "Absolutely! Logistics partners can list warehousing facilities including dry storage, cold storage, bonded warehouses, open yards, and hazmat storage."
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
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Everything you need to know about ProcureSaathi.
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
