import { Card, CardContent } from '@/components/ui/card';
import { FileText, Sparkles, Users, Package } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: FileText,
    title: 'Submit Requirements',
    description: 'Buyers submit sourcing needs or research products on the platform.',
    color: 'bg-primary/10 text-primary',
  },
  {
    number: '02',
    icon: Sparkles,
    title: 'AI Detects Intent',
    description: 'AI analyzes buyer intent and structures professional RFQs automatically.',
    color: 'bg-warning/10 text-warning',
  },
  {
    number: '03',
    icon: Users,
    title: 'Verified Suppliers Matched',
    description: 'Suppliers are matched based on category, capacity, and performance history.',
    color: 'bg-success/10 text-success',
  },
  {
    number: '04',
    icon: Package,
    title: 'Managed Fulfilment',
    description: 'Single contract with ProcureSaathi for end-to-end managed delivery.',
    color: 'bg-primary/10 text-primary',
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-12 sm:py-16 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            AI-first procurement flow designed for verified sourcing
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((step) => (
            <Card 
              key={step.number}
              className="relative overflow-hidden hover:shadow-lg transition-shadow border-border/50"
            >
              <CardContent className="p-6 text-center">
                {/* Step Number Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${step.color} text-sm font-bold`}>
                    {step.number}
                  </span>
                </div>

                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${step.color} mb-4`}>
                  <step.icon className="h-7 w-7" />
                </div>

                <h3 className="font-display font-semibold text-lg mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">
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
