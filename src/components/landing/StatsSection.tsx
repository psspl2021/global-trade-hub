import { useEffect, useState } from "react";
import { Users, Package, Truck, TrendingUp } from "lucide-react";

const stats = [
  { 
    icon: Users, 
    value: 5000, 
    suffix: "+", 
    label: "Verified Suppliers",
    description: "Trusted partners across India"
  },
  { 
    icon: Package, 
    value: 10000, 
    suffix: "+", 
    label: "Products Listed",
    description: "Across 23+ categories"
  },
  { 
    icon: Truck, 
    value: 500, 
    suffix: "+", 
    label: "Logistics Partners",
    description: "Verified fleet operators"
  },
  { 
    icon: TrendingUp, 
    value: 15, 
    suffix: "%", 
    label: "Avg. Cost Savings",
    description: "Through competitive bidding"
  },
];

const AnimatedCounter = ({ target, suffix }: { target: number; suffix: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <span>
      {count.toLocaleString()}{suffix}
    </span>
  );
};

const StatsSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('stats-section');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <section id="stats-section" className="py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            India's Growing B2B Marketplace
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">
            Join the fastest-growing network of verified buyers, suppliers, and logistics partners.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                <stat.icon className="w-8 h-8" />
              </div>
              <div className="text-4xl font-bold mb-2">
                {isVisible ? (
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                ) : (
                  `0${stat.suffix}`
                )}
              </div>
              <div className="font-semibold mb-1">{stat.label}</div>
              <div className="text-sm text-primary-foreground/70">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
