import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/landing/PageHeader";
import { StickySignupBanner } from "@/components/StickySignupBanner";
import { Footer } from "@/components/landing/Footer";
import { useSEO, injectStructuredData, getBreadcrumbSchema } from "@/hooks/useSEO";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  MessageCircle,
  Send,
  Building2,
  Loader2
} from "lucide-react";

const contactInfo = [
  {
    icon: Mail,
    title: "Email Us",
    primary: "sales@procuresaathi.com",
    secondary: "support@procuresaathi.com",
    description: "For sales and general inquiries",
  },
  {
    icon: Phone,
    title: "Call Us",
    primary: "+91 8368127357",
    secondary: null,
    description: "Mon-Sat, 9 AM - 6 PM IST",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    primary: "+91 8368127357",
    secondary: null,
    description: "Quick responses on WhatsApp",
  },
  {
    icon: Clock,
    title: "Business Hours",
    primary: "Mon - Sat: 9 AM - 6 PM",
    secondary: "Sunday: Closed",
    description: "Indian Standard Time (IST)",
  },
];

const inquiryTypes = [
  { value: "buyer", label: "Buyer Inquiry - Looking to source products" },
  { value: "supplier", label: "Supplier Inquiry - Want to list products" },
  { value: "logistics", label: "Logistics Partnership" },
  { value: "support", label: "Technical Support" },
  { value: "partnership", label: "Business Partnership" },
  { value: "other", label: "Other Inquiry" },
];

const Contact = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    inquiryType: "",
    message: "",
  });

  useSEO({
    title: "Contact ProcureSaathi | B2B Procurement Support & Sales",
    description: "Get in touch with ProcureSaathi for B2B procurement support, sales inquiries, or partnership opportunities. Email, phone, and WhatsApp support available.",
    keywords: "contact ProcureSaathi, B2B support India, procurement help, supplier inquiry, buyer support",
    canonical: "https://procuresaathi.com/contact",
  });

  useEffect(() => {
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Contact ProcureSaathi",
      "description": "Contact page for ProcureSaathi B2B procurement platform",
      "url": "https://procuresaathi.com/contact",
      "mainEntity": {
        "@type": "Organization",
        "name": "ProcureSaathi",
        "email": "sales@procuresaathi.com",
        "telephone": "+918368127357",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "IN"
        }
      }
    }, 'contact-page-schema');

    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "Contact", url: "https://procuresaathi.com/contact" }
    ]), 'contact-breadcrumb-schema');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("demo_requests").insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        company_name: formData.company || null,
        message: `[${formData.inquiryType || 'General'}] ${formData.message}`,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Message Sent!",
        description: "Thank you for reaching out. We'll get back to you within 24 hours.",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        inquiryType: "",
        message: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again or email us directly.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/918368127357?text=Hi, I'd like to inquire about ProcureSaathi services.", "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden gradient-mesh">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm mb-6 animate-fade-in">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">GET IN TOUCH</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 animate-slide-up">
              We'd Love to
              <span className="text-primary"> Hear From You</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground animate-slide-up delay-100 leading-relaxed">
              Have questions about B2B procurement? Want to become a supplier or buyer? 
              Our team is here to help you succeed.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {contactInfo.map((info) => (
              <Card key={info.title} className="group border-border/50 bg-card hover:shadow-large transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-5">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <info.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold mb-1">{info.title}</h3>
                  <p className="text-sm font-medium text-foreground">{info.primary}</p>
                  {info.secondary && (
                    <p className="text-sm text-muted-foreground">{info.secondary}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Form */}
            <Card className="border-border/50 shadow-large">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Send Us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company Name</Label>
                      <Input
                        id="company"
                        placeholder="Your company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inquiryType">Inquiry Type</Label>
                    <Select
                      value={formData.inquiryType}
                      onValueChange={(value) => setFormData({ ...formData, inquiryType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select inquiry type" />
                      </SelectTrigger>
                      <SelectContent>
                        {inquiryTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us how we can help..."
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full h-12 font-semibold" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold mb-4">Quick Actions</h2>
                <p className="text-muted-foreground mb-6">
                  Prefer a faster way to reach us? Choose from the options below.
                </p>
              </div>

              <Card className="border-border/50 hover:shadow-large transition-all duration-300 cursor-pointer group" onClick={handleWhatsAppClick}>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageCircle className="h-7 w-7 text-success" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-lg">Chat on WhatsApp</h3>
                    <p className="text-sm text-muted-foreground">Get instant responses from our team</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 hover:shadow-large transition-all duration-300 cursor-pointer group" onClick={() => window.location.href = 'mailto:sales@procuresaathi.com'}>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mail className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-lg">Email Sales Team</h3>
                    <p className="text-sm text-muted-foreground">sales@procuresaathi.com</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 hover:shadow-large transition-all duration-300 cursor-pointer group" onClick={() => window.location.href = 'tel:+918368127357'}>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Phone className="h-7 w-7 text-warning" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-lg">Call Us Directly</h3>
                    <p className="text-sm text-muted-foreground">+91 8368127357</p>
                  </div>
                </CardContent>
              </Card>

              {/* Office Info */}
              <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-lg mb-2">ProcureSaathi</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        India's trusted B2B procurement platform connecting verified buyers with reliable suppliers.
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>New Delhi, India</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <StickySignupBanner />
    </div>
  );
};

export default Contact;