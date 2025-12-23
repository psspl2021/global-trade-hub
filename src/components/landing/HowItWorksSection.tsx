import { Card, CardContent } from '@/components/ui/card';
import { FileText, Search, CheckCircle, Package } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: FileText,
    title: 'Describe What You Need',
    description: 'Tell us your product specs, quantity, timeline, and budget requirements.',
    color: 'bg-primary/10 text-primary',
  },
  {
    number: '02',
    icon: Search,
    title: 'AI + Team Finds Suppliers',
    description: 'Our AI matches you with verified suppliers. Our team onboards new ones if needed.',
    color: 'bg-warning/10 text-warning',
  },
  {
    number: '03',
    icon: CheckCircle,
    title: 'Evaluate & Place Orders',
    description: 'Compare quotes, negotiate terms, and place your purchase order with confidence.',
    color: 'bg-success/10 text-success',
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Simple, transparent sourcing process designed for modern B2B buyers
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((step) => (
            <Card 
              key={step.number}
              className="relative overflow-hidden hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6 text-center">
                {/* Step Number Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${step.color} text-sm font-bold`}>
                    {step.number}
                  </span>
                </div>

                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${step.color} mb-4`}>
                  <step.icon className="h-8 w-8" />
                </div>

                <h3 className="font-semibold text-lg mb-2">
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
