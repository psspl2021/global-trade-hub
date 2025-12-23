import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Factory, Shield, Zap, Clock, Layers, UserCheck,
  ArrowRight, CheckCircle, MessageSquare
} from 'lucide-react';

const features = [
  {
    icon: Factory,
    title: 'Private Label & Custom Manufacturing',
    description: 'Source supplements, skincare, wellness, and more—tailored to your formulation, branding, and MOQ needs'
  },
  {
    icon: Shield,
    title: 'Verified Supplier Network',
    description: 'Work only with pre-screened Indian manufacturers meeting international quality and compliance standards'
  },
  {
    icon: Zap,
    title: 'Smart Vendor Matching',
    description: 'We shortlist partners based on your exact brief, saving you weeks of searching'
  },
  {
    icon: Clock,
    title: 'Faster Time to Market',
    description: 'Cut back-and-forth delays and move from idea to ready-to-ship products quicker'
  },
  {
    icon: Layers,
    title: 'End-to-End Coordination',
    description: 'From sampling to bulk production, we manage the entire process for you'
  },
  {
    icon: UserCheck,
    title: 'One Platform, Multiple Categories',
    description: 'Explore products, packaging, and accessories without switching between multiple platforms'
  }
];

const conciergeServices = [
  'Understanding your specs & product goals',
  'Shortlisting vetted, relevant manufacturers',
  'Coordinating meetings, calls, or site visits',
  'Guiding certification & compliance needs'
];

export const PrivateLabelSection = () => {
  const navigate = useNavigate();

  return (
    <section id="private-label" className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            1000+ Verified Manufacturers
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Source Private Label Products<br />
            <span className="text-primary">Direct from India</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            From supplements to skincare, ProcureSaathi makes sourcing simple, smart, and supported—powered by AI and backed by human expertise
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button 
            size="lg" 
            className="h-14 px-8"
            onClick={() => navigate('/post-rfq')}
          >
            Post Your Requirement
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="h-14 px-8"
            onClick={() => window.location.href = 'mailto:concierge@procuresaathi.com'}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Talk to Our Concierge
          </Button>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">
            Your Fast-Track to Trusted Indian Manufacturers
          </h3>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            From private label sourcing to custom manufacturing, ProcureSaathi simplifies your procurement journey—connecting you only with export-ready, reliable suppliers.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/50 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Concierge Section */}
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">White-Glove Concierge for Every Buyer</h3>
                <p className="text-muted-foreground mb-6">
                  Our sourcing experts personally support you by:
                </p>
                <ul className="space-y-3">
                  {conciergeServices.map((service, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{service}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 rounded-2xl p-8 inline-block">
                  <div className="text-5xl font-bold text-primary mb-2">85%</div>
                  <p className="text-muted-foreground">Matched in 5 days</p>
                </div>
                <Button 
                  className="mt-6 w-full"
                  onClick={() => window.location.href = 'mailto:concierge@procuresaathi.com'}
                >
                  Get Personalized Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
