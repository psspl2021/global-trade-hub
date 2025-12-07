import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/landing/Header";
import FeaturesSection from "@/components/landing/FeaturesSection";
import StatsSection from "@/components/landing/StatsSection";
import WhyChooseUs from "@/components/landing/WhyChooseUs";
import { LazyFAQ } from "@/components/landing/LazyFAQ";

const Index = () => {
  const { user, loading } = useAuth();
  useSEO({ 
    title: "ProcureSaathi - B2B Procurement Platform", 
    description: "Connect with verified suppliers and streamline your procurement process" 
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Streamline Your B2B Procurement
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Connect with verified suppliers, manage requirements, and grow your business with ProcureSaathi.
          </p>
        </div>
      </section>
      
      <FeaturesSection />
      <StatsSection />
      <WhyChooseUs />
      <LazyFAQ />
    </div>
  );
};

export default Index;
