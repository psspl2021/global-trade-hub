import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const indianTestimonials = [
  {
    name: "Rajesh Kumar",
    company: "Kumar Steel Industries",
    role: "Procurement Manager",
    type: "Buyer",
    country: "India",
    flag: "🇮🇳",
    quote: "ProcureSaathi transformed our sourcing process. We reduced procurement costs by 15% through competitive bidding.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    company: "Sharma Exports Pvt Ltd",
    role: "Business Owner",
    type: "Supplier",
    country: "India",
    flag: "🇮🇳",
    quote: "As a supplier, we've connected with verified buyers across India. The sealed bidding system ensures fair competition.",
    rating: 5,
  },
  {
    name: "Amit Patel",
    company: "Patel Logistics Co.",
    role: "Fleet Manager",
    type: "Logistics Partner",
    country: "India",
    flag: "🇮🇳",
    quote: "Managing our fleet and getting transport contracts has never been easier. Great platform for logistics partners!",
    rating: 5,
  },
];

const internationalTestimonials = [
  {
    name: "Ahmed Al-Rashid",
    company: "Gulf Trading LLC",
    country: "UAE",
    flag: "🇦🇪",
    quote: "Imported 500 MT steel from verified Indian suppliers. The sealed bidding system ensured competitive pricing.",
    rating: 5,
    volume: "$2.5M sourced"
  },
  {
    name: "Sarah Thompson",
    company: "British Textiles Co.",
    country: "United Kingdom",
    flag: "🇬🇧",
    quote: "Found reliable cotton fabric suppliers within 48 hours. The quality certifications gave us confidence.",
    rating: 5,
    volume: "£850K sourced"
  },
  {
    name: "John Mitchell",
    company: "US Industrial Supplies",
    country: "USA",
    flag: "🇺🇸",
    quote: "The HS code integration and export compliance support made importing from India hassle-free.",
    rating: 5,
    volume: "$1.8M sourced"
  },
];

export const Testimonials = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Trusted by Businesses Across <span className="text-primary">India & 50+ Countries</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied buyers, suppliers, and logistics partners who have transformed their B2B operations with ProcureSaathi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...indianTestimonials, ...internationalTestimonials].map((testimonial, index) => (
            <Card key={index} className="bg-card border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{testimonial.flag}</span>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.company}, {testimonial.country}
                    </p>
                  </div>
                </div>
                
                <Quote className="w-6 h-6 text-primary/20 mb-2" />
                
                <p className="text-foreground mb-4 italic">
                  "{testimonial.quote}"
                </p>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  {'volume' in testimonial && (
                    <span className="text-sm font-medium text-primary">{testimonial.volume}</span>
                  )}
                  {'type' in testimonial && (
                    <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                      {testimonial.type}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
