import { Search, Activity, FileText, ShieldCheck } from 'lucide-react';

const features = [
  { icon: Search, label: 'Search Categories' },
  { icon: Activity, label: 'Live Stock' },
  { icon: FileText, label: 'Live Requirements' },
  { icon: ShieldCheck, label: 'Verified Partners' },
];

const QuickFeatures = () => {
  return (
    <section className="py-8 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
          {features.map((feature) => (
            <div
              key={feature.label}
              className="flex items-center gap-2 px-4 py-2 bg-background rounded-full shadow-sm border"
            >
              <feature.icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{feature.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickFeatures;
