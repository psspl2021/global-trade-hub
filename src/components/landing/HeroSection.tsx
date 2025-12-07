import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Factory, Truck } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6">
          ProcureSaathi - India's #1
          <br />
          <span className="text-primary">B2B Sourcing</span>
          <span className="text-foreground"> & </span>
          <span className="text-orange-500">Procurement Platform</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
          Connect with verified suppliers, access live stock updates, and streamline your procurement process. 
          Join thousands of businesses transforming their B2B operations.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" className="gap-2 min-w-[180px]" asChild>
            <Link to="/signup?role=buyer">
              <Users className="h-5 w-5" />
              Join as Buyer
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          
          <Button size="lg" variant="outline" className="gap-2 min-w-[180px]" asChild>
            <Link to="/signup?role=supplier">
              <Factory className="h-5 w-5" />
              Join as Supplier
            </Link>
          </Button>
          
          <Button size="lg" variant="secondary" className="gap-2 min-w-[180px]" asChild>
            <Link to="/signup?role=logistics">
              <Truck className="h-5 w-5" />
              Request Free Demo
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
