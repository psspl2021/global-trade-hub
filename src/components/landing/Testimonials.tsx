import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Rajesh Kumar",
    company: "Kumar Steel Industries",
    role: "Procurement Manager",
    type: "Buyer",
    quote: "ProcureSaathi transformed our sourcing process. We reduced procurement costs by 15% through competitive bidding.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    company: "Sharma Exports Pvt Ltd",
    role: "Business Owner",
    type: "Supplier",
    quote: "As a supplier, we've connected with verified buyers across India. The sealed bidding system ensures fair competition.",
    rating: 5,
  },
  {
    name: "Amit Patel",
    company: "Patel Logistics Co.",
    role: "Fleet Manager",
    type: "Logistics Partner",
    quote: "Managing our fleet and getting transport contracts has never been easier. Great platform for logistics partners!",
    rating: 5,
  },
];

export const Testimonials = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Trusted by Businesses Across India
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied buyers, suppliers, and logistics partners who have transformed their B2B operations with ProcureSaathi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-card border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                
                <Quote className="w-8 h-8 text-primary/20 mb-3" />
                
                <p className="text-foreground mb-6 italic">
                  "{testimonial.quote}"
                </p>
                
                <div className="border-t border-border pt-4">
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                    {testimonial.type}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
