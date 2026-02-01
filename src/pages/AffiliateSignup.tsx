import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSEO } from '@/hooks/useSEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, IndianRupee, TrendingUp, ArrowLeft, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';

const AffiliateSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingSlots, setCheckingSlots] = useState(true);
  const [slotsInfo, setSlotsInfo] = useState({ activeCount: 0, available: 50, waitlistCount: 0 });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  useSEO({
    title: 'Become an Affiliate Partner | Earn 20% Commission | ProcureSaathi',
    description: 'Join ProcureSaathi affiliate program. Earn 20% commission on platform fees from every referral order. Lifetime earnings, easy tracking, instant payouts. Start earning passive income today!',
  });

  // Check available affiliate slots
  useEffect(() => {
    const checkSlots = async () => {
      setCheckingSlots(true);
      const { data, error } = await supabase
        .from('affiliates')
        .select('status');

      if (!error && data) {
        const activeCount = data.filter(a => a.status === 'ACTIVE').length;
        const waitlistCount = data.filter(a => a.status === 'WAITLISTED').length;
        setSlotsInfo({
          activeCount,
          available: Math.max(0, 50 - activeCount),
          waitlistCount
        });
      }
      setCheckingSlots(false);
    };
    checkSlots();
  }, []);

  // Add structured data for affiliate program
  useEffect(() => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "ProcureSaathi Affiliate Partner Program",
      "description": "Join ProcureSaathi affiliate program and earn 20% commission on platform fees from every referral order. Lifetime earnings with easy tracking.",
      "url": "https://www.procuresaathi.com/affiliate-signup",
      "mainEntity": {
        "@type": "Offer",
        "name": "ProcureSaathi Affiliate Partnership",
        "description": "Earn 20% commission on platform fees from referral orders. Lifetime passive income opportunity.",
        "offeredBy": {
          "@type": "Organization",
          "name": "ProcureSaathi",
          "url": "https://www.procuresaathi.com"
        },
        "eligibleRegion": {
          "@type": "Country",
          "name": "India"
        }
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://www.procuresaathi.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Affiliate Signup",
            "item": "https://www.procuresaathi.com/affiliate-signup"
          }
        ]
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    script.id = 'affiliate-structured-data';
    document.head.appendChild(script);

    // Add Open Graph and Twitter meta tags
    const metaTags = [
      { property: 'og:title', content: 'Become an Affiliate Partner | Earn 20% Commission | ProcureSaathi' },
      { property: 'og:description', content: 'Join ProcureSaathi affiliate program. Earn 20% commission on platform fees. Lifetime earnings, easy tracking, instant payouts.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://www.procuresaathi.com/affiliate-signup' },
      { property: 'og:image', content: 'https://www.procuresaathi.com/og-early-adopter.png' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Become an Affiliate Partner | ProcureSaathi' },
      { name: 'twitter:description', content: 'Earn 20% commission on platform fees from referral orders. Join free today!' },
      { name: 'keywords', content: 'affiliate program India, B2B referral program, earn commission, passive income, procurement affiliate, supplier referral, logistics partner program, ProcureSaathi affiliate' },
    ];

    const addedTags: HTMLMetaElement[] = [];
    metaTags.forEach(tag => {
      const meta = document.createElement('meta');
      if (tag.property) meta.setAttribute('property', tag.property);
      if (tag.name) meta.setAttribute('name', tag.name);
      meta.setAttribute('content', tag.content);
      document.head.appendChild(meta);
      addedTags.push(meta);
    });

    return () => {
      const existingScript = document.getElementById('affiliate-structured-data');
      if (existingScript) existingScript.remove();
      addedTags.forEach(tag => tag.remove());
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create user account
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            contact_person: formData.name,
            company_name: formData.name,
            phone: formData.phone,
            role: 'affiliate',
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Step 2: Register as affiliate using FIFO system
        const { data: affiliateResult, error: affiliateError } = await supabase
          .rpc('register_affiliate', { p_user_id: data.user.id });

        if (affiliateError) {
          console.error('Affiliate registration error:', affiliateError);
        }

        const status = (affiliateResult as any)?.status || 'ACTIVE';
        const message = (affiliateResult as any)?.message || 'Account created successfully!';

        toast({
          title: status === 'ACTIVE' ? '🎉 Congratulations!' : 'Account Created',
          description: message,
        });

        navigate('/affiliate');
      }
    } catch (error: any) {
      toast({
        title: 'Signup failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi Logo" 
              className="h-16 sm:h-20 w-auto object-contain"
            />
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Benefits Section */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  Become an Affiliate Partner
                </h1>
                <p className="text-lg text-muted-foreground">
                  Earn passive income by referring suppliers and logistics partners to ProcureSaathi
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-card border">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <IndianRupee className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Earn 20% Commission</h3>
                    <p className="text-sm text-muted-foreground">
                      Get 20% of platform fees on every order from your referrals
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-card border">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Lifetime Earnings</h3>
                    <p className="text-sm text-muted-foreground">
                      Earn commission on every order your referrals make, forever!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-card border">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Easy Tracking</h3>
                    <p className="text-sm text-muted-foreground">
                      Track all your referrals, signups, and earnings in one dashboard
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Signup Form */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>Create Your Affiliate Account</CardTitle>
                  {checkingSlots ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : slotsInfo.available > 0 ? (
                    <Badge className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {slotsInfo.available} slots left
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Waitlist only
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {slotsInfo.available > 0 
                    ? 'Fill in your details to start earning'
                    : 'All 50 affiliate slots are filled. Apply to join the waiting list.'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* FIFO Notice */}
                <Alert className="mb-4 border-primary/30 bg-primary/5">
                  <AlertDescription className="text-sm">
                    <strong>Limited to 50 partners:</strong> Affiliate slots are approved on First-Come, First-Served basis. 
                    {slotsInfo.waitlistCount > 0 && ` Currently ${slotsInfo.waitlistCount} on waitlist.`}
                  </AlertDescription>
                </Alert>

                {/* Self-Referral Warning */}
                <Alert className="mb-4 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-sm text-amber-700 dark:text-amber-300">
                    <strong>Important:</strong> Self-referrals are strictly prohibited. You cannot earn commission on 
                    your own orders or orders from accounts with the same phone/email. Violations result in permanent 
                    commission forfeiture.
                  </AlertDescription>
                </Alert>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Min 6 characters"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm your password"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Affiliate Account
                  </Button>

                  <p className="text-sm text-center text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/login?redirect=/affiliate" className="text-primary hover:underline">
                      Login here
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AffiliateSignup;
