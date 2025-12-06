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
        answer: "Simply sign up as a buyer, navigate to your dashboard, and click 'Post Requirement'. Fill in product details, quantity, budget range, and delivery requirements. Verified suppliers will then bid competitively on your requirement."
      },
      {
        question: "Is my requirement visible to all suppliers?",
        answer: "Yes, your requirements are visible to all verified suppliers on the platform. However, your company details remain confidential until you accept a bid."
      },
      {
        question: "How does the competitive bidding system work?",
        answer: "Suppliers submit sealed bids on your requirements. They can only see the current lowest bid amount, not competitor details. This ensures fair, competitive pricing for buyers."
      },
    ]
  },
  {
    category: "For Suppliers",
    questions: [
      {
        question: "What is the service fee for suppliers?",
        answer: "ProcureSaathi charges a 1% service fee on successful transactions. This fee is automatically calculated and added to your bid amount when presented to buyers."
      },
      {
        question: "How many bids can I place per month?",
        answer: "Free tier suppliers can place up to 5 bids per month. Premium subscribers enjoy unlimited bids, priority listing, and a featured badge on their profile."
      },
      {
        question: "Can I upload my product catalog?",
        answer: "Yes! Suppliers can maintain detailed product catalogs with images, specifications, pricing ranges, MOQ, and certifications. Your catalog helps buyers discover your offerings."
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
    const allFaqs = faqData.flatMap(category => 
      category.questions.map(q => ({
        question: q.question,
        answer: q.answer
      }))
    );
    injectStructuredData(getFAQSchema(allFaqs), 'faq-schema');
  }, []);

  return (
    <section className="py-16 bg-background" id="faq">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about sourcing, supplying, and logistics on ProcureSaathi.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          {faqData.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h3 className="text-xl font-semibold text-primary mb-4">
                {category.category}
              </h3>
              <Accordion type="single" collapsible className="w-full">
                {category.questions.map((faq, faqIndex) => (
                  <AccordionItem key={faqIndex} value={`${categoryIndex}-${faqIndex}`}>
                    <AccordionTrigger className="text-left text-foreground hover:text-primary">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
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
