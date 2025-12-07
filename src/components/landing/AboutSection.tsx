import { Shield, Users, Globe, Award } from 'lucide-react';

const stats = [
  { icon: Users, value: '10,000+', label: 'Verified Partners' },
  { icon: Globe, value: '50+', label: 'Countries Served' },
  { icon: Shield, value: '₹500Cr+', label: 'Trade Facilitated' },
  { icon: Award, value: '23+', label: 'Product Categories' },
];

export const AboutSection = () => {
  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">About ProcureSaathi</h2>
              <p className="text-muted-foreground mb-4">
                ProcureSaathi is India's leading B2B sourcing platform, connecting buyers with verified suppliers 
                through a transparent and competitive bidding system. Founded with the vision of simplifying 
                industrial procurement, we've grown to become a trusted partner for businesses across the globe.
              </p>
              <p className="text-muted-foreground mb-4">
                Our platform operates on a reverse marketplace model where buyers post their requirements and 
                suppliers compete to offer the best prices. This ensures you always get competitive rates while 
                maintaining quality standards.
              </p>
              <p className="text-muted-foreground mb-6">
                With integrated logistics services, secure transactions, and a robust verification system, 
                ProcureSaathi provides an end-to-end solution for all your sourcing needs.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">Sealed bidding system for competitive pricing</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">Verified suppliers with quality certifications</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">Integrated logistics with real-time tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">Secure invoice-based payment system</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div 
                  key={stat.label}
                  className="bg-card border rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
