import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Globe, Package, Ship, Shield, Truck } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";


const countryData: Record<string, {
  name: string;
  flag: string;
  headline: string;
  description: string;
  topCategories: string[];
  tradeStats: { label: string; value: string }[];
  certifications: string[];
}> = {
  usa: {
    name: "United States",
    flag: "🇺🇸",
    headline: "Source Quality Products from India to USA",
    description: "Connect with FDA-compliant, verified Indian suppliers for seamless import to the United States. Competitive pricing, quality assurance, and integrated logistics.",
    topCategories: ["Pharmaceuticals", "Textiles & Garments", "Chemicals", "Machinery", "Gems & Jewelry", "Agricultural Products"],
    tradeStats: [
      { label: "India-USA Trade Volume", value: "$120B+" },
      { label: "Active Suppliers", value: "2,500+" },
      { label: "Avg. Savings", value: "25-40%" }
    ],
    certifications: ["FDA", "ISO 9001", "GMP", "CE Mark"]
  },
  uae: {
    name: "United Arab Emirates",
    flag: "🇦🇪",
    headline: "India to UAE Trade Made Simple",
    description: "Access HALAL-certified suppliers, competitive pricing, and direct shipping to Jebel Ali. Perfect for re-export and GCC distribution.",
    topCategories: ["Food Products", "Textiles", "Machinery", "Chemicals", "Steel", "Spices"],
    tradeStats: [
      { label: "India-UAE Trade Volume", value: "$85B+" },
      { label: "Active Suppliers", value: "3,200+" },
      { label: "Avg. Delivery Time", value: "5-7 days" }
    ],
    certifications: ["HALAL", "SASO", "ISO 22000", "FSSAI"]
  },
  uk: {
    name: "United Kingdom",
    flag: "🇬🇧",
    headline: "Indian Suppliers for UK Importers",
    description: "UKCA-compliant suppliers ready to serve the British market. Post-Brexit customs expertise and competitive sterling pricing.",
    topCategories: ["Textiles", "Pharmaceuticals", "IT Services", "Gems & Jewelry", "Leather Goods", "Food Products"],
    tradeStats: [
      { label: "India-UK Trade Volume", value: "$35B+" },
      { label: "Active Suppliers", value: "1,800+" },
      { label: "FTA Progress", value: "In Negotiation" }
    ],
    certifications: ["UKCA", "CE Mark", "ISO", "BRC"]
  },
  africa: {
    name: "Africa",
    flag: "🌍",
    headline: "Export from India to Africa",
    description: "Reliable suppliers for African markets with experience in containerized shipping to major ports including Lagos, Mombasa, Durban, and Casablanca.",
    topCategories: ["Pharmaceuticals", "Agricultural Machinery", "Textiles", "Vehicles", "Rice & Grains", "Consumer Electronics"],
    tradeStats: [
      { label: "India-Africa Trade", value: "$98B+" },
      { label: "Countries Served", value: "54" },
      { label: "Active Trade Routes", value: "120+" }
    ],
    certifications: ["WHO-GMP", "ISO", "SONCAP", "KEBS"]
  },
  germany: {
    name: "Germany",
    flag: "🇩🇪",
    headline: "German Quality, Indian Efficiency",
    description: "CE-marked products from verified Indian manufacturers. Engineering excellence meets competitive pricing for the German market.",
    topCategories: ["Machinery", "Chemicals", "Auto Components", "Pharmaceuticals", "Textiles", "IT Services"],
    tradeStats: [
      { label: "India-Germany Trade", value: "$28B+" },
      { label: "Active Suppliers", value: "1,200+" },
      { label: "Quality Compliance", value: "99.2%" }
    ],
    certifications: ["CE Mark", "TÜV", "ISO", "REACH"]
  },
  australia: {
    name: "Australia",
    flag: "🇦🇺",
    headline: "Source from India to Australia",
    description: "Verified suppliers with experience in Australian compliance requirements. Direct shipping to Sydney, Melbourne, and other major ports.",
    topCategories: ["Textiles", "Gems & Jewelry", "Pharmaceuticals", "Machinery", "Spices", "Handicrafts"],
    tradeStats: [
      { label: "India-Australia Trade", value: "$25B+" },
      { label: "Active Suppliers", value: "950+" },
      { label: "ECTA Benefits", value: "Active" }
    ],
    certifications: ["TGA", "ACCC Approved", "ISO", "Organic Australia"]
  }
};

export default function SourceCountry() {
  const { country } = useParams<{ country: string }>();
  const data = countryData[country?.toLowerCase() || ""] || countryData.usa;
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    categories: [] as string[],
    volume: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useSEO({
    title: `${data.headline} | ProcureSaathi`,
    description: data.description,
    keywords: `${data.name} import, India export, B2B sourcing, ${data.topCategories.join(", ")}`
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("international_leads").insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        company_name: formData.company || null,
        country: data.name,
        interested_categories: formData.categories,
        trade_interest: "import_from_india",
        monthly_volume: formData.volume || null,
        source: `/source/${country}`,
        utm_source: new URLSearchParams(window.location.search).get("utm_source") || null,
        utm_medium: new URLSearchParams(window.location.search).get("utm_medium") || null,
        utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign") || null
      });

      if (error) throw error;

      toast.success("Thank you! Our team will contact you shortly.");
      setFormData({ name: "", email: "", phone: "", company: "", categories: [], volume: "", message: "" });
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-5xl">{data.flag}</span>
                <Badge variant="secondary" className="text-sm">
                  <Globe className="h-3 w-3 mr-1" />
                  International Trade
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {data.headline}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {data.description}
              </p>
              
              <div className="grid grid-cols-3 gap-4 mb-8">
                {data.tradeStats.map((stat, index) => (
                  <div key={index} className="text-center p-4 bg-card rounded-lg">
                    <p className="text-2xl font-bold text-primary">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {data.certifications.map((cert, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Lead Capture Form */}
            <Card className="shadow-xl">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-2">Get Started Today</h2>
                <p className="text-muted-foreground mb-6">
                  Tell us about your sourcing needs and we'll connect you with verified suppliers
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Business Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="john@company.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone (with country code)</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 555 123 4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company Name</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="ABC Imports Ltd"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="volume">Monthly Sourcing Volume</Label>
                    <Select
                      value={formData.volume}
                      onValueChange={(value) => setFormData({ ...formData, volume: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select volume range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under_10k">Under $10,000</SelectItem>
                        <SelectItem value="10k_50k">$10,000 - $50,000</SelectItem>
                        <SelectItem value="50k_100k">$50,000 - $100,000</SelectItem>
                        <SelectItem value="100k_500k">$100,000 - $500,000</SelectItem>
                        <SelectItem value="over_500k">Over $500,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Interested Categories</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {data.topCategories.map((cat) => (
                        <Badge
                          key={cat}
                          variant={formData.categories.includes(cat) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            if (formData.categories.includes(cat)) {
                              setFormData({
                                ...formData,
                                categories: formData.categories.filter(c => c !== cat)
                              });
                            } else {
                              setFormData({
                                ...formData,
                                categories: [...formData.categories, cat]
                              });
                            }
                          }}
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Connect with Suppliers"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By submitting, you agree to our terms of service and privacy policy
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Top Categories Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Top Export Categories to {data.name}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {data.topCategories.map((category, index) => (
              <Card key={index} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <Package className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <p className="font-medium text-sm">{category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Source from India via ProcureSaathi?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">Verified Suppliers</h3>
                <p className="text-muted-foreground">
                  All suppliers are verified with proper export licenses, certifications, and track records
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Ship className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">Integrated Logistics</h3>
                <p className="text-muted-foreground">
                  End-to-end shipping solutions from factory to your door with customs support
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Truck className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">Real-Time Tracking</h3>
                <p className="text-muted-foreground">
                  Track your shipments in real-time from dispatch to delivery at destination port
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Sourcing from India?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of importers who save 25-40% on procurement costs
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" variant="secondary">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/categories">
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Browse Categories
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
