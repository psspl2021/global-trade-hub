import { Card, CardContent } from '@/components/ui/card';
import { FileText, Sparkles, Users, Package } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: FileText,
    title: 'Submit Requirements',
    description: 'Buyers submit sourcing needs or research products on the platform.',
    color: 'bg-primary/10 text-primary',
    borderHover: 'hover:border-primary/40',
  },
  {
    number: '02',
    icon: Sparkles,
    title: 'AI Detects Intent',
    description: 'AI analyzes buyer intent and structures professional RFQs automatically.',
    color: 'bg-warning/10 text-warning',
    borderHover: 'hover:border-warning/40',
  },
  {
    number: '03',
    icon: Users,
    title: 'Verified Suppliers Matched',
    description: 'Suppliers are matched based on category, capacity, and performance history.',
    color: 'bg-success/10 text-success',
    borderHover: 'hover:border-success/40',
  },
  {
    number: '04',
    icon: Package,
    title: 'Managed Fulfilment',
    description: 'Single contract with ProcureSaathi for end-to-end managed delivery.',
    color: 'bg-primary/10 text-primary',
    borderHover: 'hover:border-primary/40',
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-14 sm:py-20 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3 tracking-tight">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base">
            AI-first procurement flow designed for verified sourcing
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((step, i) => (
            <Card 
              key={step.number}
              className={`relative overflow-hidden hover:shadow-xl transition-all duration-500 border-border/50 ${step.borderHover} group hover:-translate-y-1 animate-slide-up`}
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <CardContent className="p-6 text-center">
                {/* Step Number Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${step.color} text-sm font-bold group-hover:scale-110 transition-transform`}>
                    {step.number}
                  </span>
                </div>

                {/* Connector line (hidden on mobile, visible on lg) */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-border/60 z-10" />
                )}

                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${step.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="h-7 w-7" />
                </div>

                <h3 className="font-display font-semibold text-lg mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
