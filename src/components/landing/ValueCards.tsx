import { Link } from 'react-router-dom';
import { ShoppingCart, Factory, Truck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const cards = [
  {
    icon: ShoppingCart,
    title: "Sourcing Products?",
    subtitle: "It's FREE, Forever!",
    description: "Post your requirements and receive competitive bids from verified suppliers across India.",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
    iconColor: "text-green-600",
    link: "/signup?role=buyer",
    buttonText: "Start Sourcing",
  },
  {
    icon: Factory,
    title: "Manufacturer?",
    subtitle: "Connect with Global Buyers!",
    description: "Showcase your products, manage live stock, and bid on buyer requirements.",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    iconColor: "text-amber-600",
    link: "/signup?role=supplier",
    buttonText: "List Products",
  },
  {
    icon: Truck,
    title: "Need Transportation?",
    subtitle: "Book a Truck!",
    description: "Find verified logistics partners for hassle-free material transportation.",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-600",
    link: "/signup?role=logistics",
    buttonText: "Book Now",
  },
];

const ValueCards = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className={`${card.bgColor} ${card.borderColor} border rounded-xl p-6 text-center transition-transform hover:scale-105`}
            >
              <div className={`${card.iconColor} inline-flex p-3 rounded-full bg-background mb-4`}>
                <card.icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-1">{card.title}</h3>
              <p className={`${card.iconColor} font-semibold mb-3`}>{card.subtitle}</p>
              <p className="text-muted-foreground text-sm mb-4">{card.description}</p>
              <Button variant="outline" className="gap-2" asChild>
                <Link to={card.link}>
                  {card.buttonText}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueCards;
