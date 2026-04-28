import { useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { injectStructuredData, getFAQSchema } from "@/hooks/useSEO";

const homepageFaqs = [
  {
    question: "What is ProcureSaathi?",
    answer:
      "ProcureSaathi is a B2B procurement platform that helps enterprises reduce material costs through real supplier competition — sealed-bid RFQs and live reverse auctions with full audit trails.",
  },
  {
    question: "How do reverse auctions work?",
    answer:
      "You publish a requirement, invited suppliers submit bids in a time-boxed live auction, and prices fall as suppliers compete in real time. You see every bid, award the winner, and keep a cryptographically chained audit trail.",
  },
  {
    question: "Is it free for buyers?",
    answer:
      "Yes. Posting requirements and running auctions is free for buyers. The platform earns a small service fee (0.5–1.0%) only on successfully awarded orders.",
  },
  {
    question: "Do my existing vendors participate?",
    answer:
      "Yes. You invite your current vendors to bid alongside our verified supplier network in the same auction. No need to switch suppliers — the competition itself drives prices down.",
  },
  {
    question: "How fast do I get quotes?",
    answer:
      "Sealed-bid RFQs typically receive responses within 24–48 hours. Live reverse auctions complete in 15–30 minutes from start to award.",
  },
];

export const HomepageFAQ = () => {
  useEffect(() => {
    const schemaId = "homepage-faq-schema";
    const existing = document.getElementById(schemaId);
    if (existing) existing.remove();
    injectStructuredData(getFAQSchema(homepageFaqs), schemaId);
    return () => {
      const s = document.getElementById(schemaId);
      if (s) s.remove();
    };
  }, []);

  return (
    <section className="border-b border-border bg-background" id="faq">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              FAQ
            </p>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-foreground tracking-tight">
              Common questions
            </h2>
          </div>

          <div className="lg:col-span-8">
            <Accordion type="single" collapsible className="w-full">
              {homepageFaqs.map((f, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border-b border-border"
                >
                  <AccordionTrigger className="text-left text-foreground hover:no-underline py-5 text-[15px] font-medium">
                    {f.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                    {f.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
};
