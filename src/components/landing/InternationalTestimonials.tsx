import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Ahmed Al-Rashid",
    company: "Gulf Trading LLC",
    country: "UAE",
    flag: "🇦🇪",
    quote: "Imported 500 MT steel from verified Indian suppliers. The sealed bidding system ensured competitive pricing and the logistics integration made customs clearance seamless.",
    rating: 5,
    volume: "$2.5M sourced"
  },
  {
    name: "Sarah Thompson",
    company: "British Textiles Co.",
    country: "United Kingdom",
    flag: "🇬🇧",
    quote: "Found reliable cotton fabric suppliers within 48 hours. The quality certifications gave us confidence, and the platform handled export documentation perfectly.",
    rating: 5,
    volume: "£850K sourced"
  },
  {
    name: "John Mitchell",
    company: "US Industrial Supplies",
    country: "USA",
    flag: "🇺🇸",
    quote: "The HS code integration and export compliance support made importing from India hassle-free. Great supplier verification process.",
    rating: 5,
    volume: "$1.8M sourced"
  },
  {
    name: "Kwame Asante",
    company: "African Agro Imports",
    country: "Ghana",
    flag: "🇬🇭",
    quote: "Sourced agricultural equipment for our distribution network. The platform's verified logistics partners ensured timely delivery to Accra port.",
    rating: 5,
    volume: "$600K sourced"
  },
  {
    name: "Hans Mueller",
    company: "Deutsche Chemicals GmbH",
    country: "Germany",
    flag: "🇩🇪",
    quote: "The export certifications directory helped us find CE-compliant suppliers quickly. Professional platform for serious B2B buyers.",
    rating: 5,
    volume: "€1.2M sourced"
  },
  {
    name: "Yuki Tanaka",
    company: "Tokyo Trading Corp",
    country: "Japan",
    flag: "🇯🇵",
    quote: "Excellent platform for sourcing Indian handicrafts and textiles. The quality assurance and sealed bidding gave us best prices.",
    rating: 4,
    volume: "¥90M sourced"
  }
];

const InternationalTestimonials = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted by Buyers Across <span className="text-primary">50+ Countries</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join thousands of international importers who source quality products from verified Indian suppliers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-card hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{testimonial.flag}</span>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.company}, {testimonial.country}</p>
                  </div>
                </div>
                
                <Quote className="h-6 w-6 text-primary/30 mb-2" />
                <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-primary">{testimonial.volume}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InternationalTestimonials;
