import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Sparkles, Package, Truck, Star, Zap } from 'lucide-react';
import { SocialShareButtons } from './SocialShareButtons';

export const EarlyAdopterBanner = () => {
  const navigate = useNavigate();
  const [remainingSlots, setRemainingSlots] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCount = async () => {
    try {
      const { count, error } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .in('role', ['supplier', 'logistics_partner']);

      if (error) throw error;
      
      const remaining = Math.max(0, 100 - (count || 0));
      setRemainingSlots(remaining);
    } catch (error) {
      console.error('Error fetching early adopter count:', error);
      setRemainingSlots(null);
    } finally {
      setIsLoading(false);
    }
  };

  // SEO: Inject JSON-LD structured data for the offer and CRM software
  useEffect(() => {
    // Offer Schema for Early Adopter promotion
    const offerData = {
      "@context": "https://schema.org",
      "@type": "Offer",
      "name": "Free CRM & Tax Invoice Generator - 1 Year FREE Premium",
      "description": "First 100 suppliers and logistics partners get 1 year FREE premium subscription worth ₹24,950. Includes free CRM software, GST tax invoice generator, unlimited bids, early adopter badge, and priority support for B2B businesses in India.",
      "price": "0",
      "priceCurrency": "INR",
      "availability": "https://schema.org/LimitedAvailability",
      "validFrom": "2024-01-01",
      "validThrough": "2025-12-31",
      "eligibleRegion": {
        "@type": "Country",
        "name": "India"
      },
      "seller": {
        "@type": "Organization",
        "name": "ProcureSaathi",
        "url": "https://procuresaathi.com"
      },
      "itemOffered": {
        "@type": "Service",
        "name": "Free CRM & Tax Invoice Generator for B2B",
        "description": "Complete CRM software with lead management, GST tax invoice generator, proforma invoice maker, purchase order management, and activity tracking - all free for suppliers and logistics partners"
      }
    };

    // SoftwareApplication Schema for CRM & Invoice Generator
    const softwareSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "ProcureSaathi Free CRM & Tax Invoice Generator",
      "applicationCategory": "BusinessApplication",
      "applicationSubCategory": "CRM Software, Invoice Generator",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "INR",
        "description": "Free CRM and GST tax invoice generator for B2B suppliers and logistics partners"
      },
      "featureList": [
        "Free CRM Software",
        "GST Tax Invoice Generator",
        "Proforma Invoice Maker",
        "Purchase Order Management",
        "Lead Management System",
        "Activity Tracking",
        "Follow-up Reminders",
        "Document Management",
        "Pipeline Analytics"
      ],
      "screenshot": "https://procuresaathi.com/og-early-adopter.png",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "200",
        "bestRating": "5",
        "worstRating": "1"
      }
    };

    // Remove existing scripts
    const existingOffer = document.getElementById('early-adopter-offer-schema');
    const existingSoftware = document.getElementById('crm-invoice-software-schema');
    if (existingOffer) existingOffer.remove();
    if (existingSoftware) existingSoftware.remove();

    // Add offer schema
    const offerScript = document.createElement('script');
    offerScript.id = 'early-adopter-offer-schema';
    offerScript.type = 'application/ld+json';
    offerScript.text = JSON.stringify(offerData);
    document.head.appendChild(offerScript);

    // Add software schema
    const softwareScript = document.createElement('script');
    softwareScript.id = 'crm-invoice-software-schema';
    softwareScript.type = 'application/ld+json';
    softwareScript.text = JSON.stringify(softwareSchema);
    document.head.appendChild(softwareScript);

    return () => {
      const scriptToRemove1 = document.getElementById('early-adopter-offer-schema');
      const scriptToRemove2 = document.getElementById('crm-invoice-software-schema');
      if (scriptToRemove1) scriptToRemove1.remove();
      if (scriptToRemove2) scriptToRemove2.remove();
    };
  }, []);

  useEffect(() => {
    fetchCount();

    // Subscribe to realtime updates for new signups
    const channel = supabase
      .channel('early-adopter-count')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_roles',
        },
        (payload) => {
          // Only update if new role is supplier or logistics_partner
          if (payload.new.role === 'supplier' || payload.new.role === 'logistics_partner') {
            fetchCount();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Don't show banner if all spots are filled
  if (!isLoading && remainingSlots === 0) {
    return null;
  }

  const filledSpots = remainingSlots !== null ? 100 - remainingSlots : 0;
  const progressPercentage = (filledSpots / 100) * 100;

  return (
    <section 
      className="relative py-8 overflow-hidden" 
      id="early-adopter-offer" 
      aria-labelledby="early-adopter-heading"
      aria-describedby="early-adopter-description"
      itemScope 
      itemType="https://schema.org/Offer"
    >
      {/* Hidden SEO content for search engines */}
      <meta itemProp="price" content="0" />
      <meta itemProp="priceCurrency" content="INR" />
      <meta itemProp="availability" content="https://schema.org/LimitedAvailability" />
      <meta itemProp="validFrom" content="2024-01-01" />
      <meta itemProp="validThrough" content="2025-12-31" />
      <link itemProp="url" href="https://procuresaathi.com/#early-adopter-offer" />
      
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-warning/20 via-primary/20 to-warning/20 animate-pulse" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-transparent" aria-hidden="true" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-warning/10 rounded-full blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" aria-hidden="true" />
      
      <div className="container mx-auto px-4 relative z-10">
        <article className="max-w-5xl mx-auto" itemScope itemType="https://schema.org/SpecialAnnouncement">
          <div className="bg-card/95 backdrop-blur-sm border-2 border-warning/50 rounded-2xl p-6 md:p-8 shadow-lg">
            {/* Header with badge */}
            <header className="flex flex-col md:flex-row items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <figure className="relative" aria-label="Trophy icon representing premium offer">
                  <div className="absolute inset-0 bg-warning/30 rounded-full blur-md animate-pulse" aria-hidden="true" />
                  <div className="relative bg-gradient-to-br from-warning to-warning/80 p-3 rounded-full">
                    <Trophy className="h-8 w-8 text-warning-foreground" aria-hidden="true" role="img" />
                  </div>
                </figure>
                <div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="bg-warning/20 text-warning text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide"
                      role="status"
                      aria-label="Limited time offer"
                    >
                      Limited Offer
                    </span>
                    <Sparkles className="h-4 w-4 text-warning animate-pulse" aria-hidden="true" role="img" />
                  </div>
                  <h2 
                    id="early-adopter-heading" 
                    className="text-2xl md:text-3xl font-bold text-foreground mt-1" 
                    itemProp="name"
                  >
                    First 100 Partners Get <span className="text-warning">1 Year FREE</span> Premium!
                  </h2>
                  <p 
                    id="early-adopter-description"
                    className="text-sm text-muted-foreground mt-1" 
                    itemProp="description"
                  >
                    Free CRM Software & GST Tax Invoice Generator included with premium subscription worth ₹24,950 — India's best B2B procurement platform for suppliers and logistics partners
                  </p>
                </div>
              </div>
            </header>

            {/* Progress bar and counter */}
            <div className="mb-6" role="progressbar" aria-valuenow={filledSpots} aria-valuemin={0} aria-valuemax={100} aria-label="Early adopter spots claimed">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-muted-foreground">Early Adopter Spots Claimed</span>
                <span className="text-sm font-bold text-warning" aria-live="polite">
                  {isLoading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    `${filledSpots}/100 claimed`
                  )}
                </span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-warning to-warning/70 rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
              {remainingSlots !== null && remainingSlots > 0 && (
                <p className="text-center mt-2 text-lg font-semibold text-foreground" aria-live="polite">
                  🔥 Only <span className="text-warning text-xl" itemProp="inventoryLevel">{remainingSlots}</span> spots remaining!
                </p>
              )}
            </div>

            {/* Benefits grid - SEO optimized with semantic list */}
            <nav aria-label="Premium benefits included" className="mb-6">
              <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 list-none p-0 m-0" itemScope itemType="https://schema.org/ItemList">
                <li className="flex items-center gap-2 bg-success/10 rounded-lg p-3" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <Star className="h-5 w-5 text-success shrink-0" aria-hidden="true" role="img" />
                  <span className="text-sm font-medium text-foreground" itemProp="name">1 Year FREE Premium</span>
                  <meta itemProp="position" content="1" />
                </li>
                <li className="flex items-center gap-2 bg-primary/10 rounded-lg p-3" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <Zap className="h-5 w-5 text-primary shrink-0" aria-hidden="true" role="img" />
                  <span className="text-sm font-medium text-foreground" itemProp="name">Unlimited Bids</span>
                  <meta itemProp="position" content="2" />
                </li>
                <li className="flex items-center gap-2 bg-warning/10 rounded-lg p-3" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <Trophy className="h-5 w-5 text-warning shrink-0" aria-hidden="true" role="img" />
                  <span className="text-sm font-medium text-foreground" itemProp="name">Early Adopter Badge</span>
                  <meta itemProp="position" content="3" />
                </li>
                <li className="flex items-center gap-2 bg-muted rounded-lg p-3" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <Sparkles className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" role="img" />
                  <span className="text-sm font-medium text-foreground" itemProp="name">Priority Support</span>
                  <meta itemProp="position" content="4" />
                </li>
              </ul>
            </nav>

            {/* CTA buttons with proper ARIA labels */}
            <nav aria-label="Sign up options" className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="h-14 text-lg px-8 bg-warning hover:bg-warning/90 text-warning-foreground shadow-lg shadow-warning/25"
                onClick={() => navigate('/signup?role=supplier')}
                aria-label="Join ProcureSaathi as a Supplier - Get 1 Year FREE Premium"
              >
                <Package className="h-5 w-5 mr-2" aria-hidden="true" />
                Join as Supplier
              </Button>
              <Button 
                size="lg"
                className="h-14 text-lg px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
                onClick={() => navigate('/signup?role=logistics_partner')}
                aria-label="Join ProcureSaathi as a Logistics Partner - Get 1 Year FREE Premium"
              >
                <Truck className="h-5 w-5 mr-2" aria-hidden="true" />
                Join as Logistics Partner
              </Button>
            </nav>

            {/* Fine print with schema markup */}
            <footer className="mt-4">
              <p className="text-center text-xs text-muted-foreground">
                <span itemProp="priceSpecification" itemScope itemType="https://schema.org/PriceSpecification">
                  Premium subscription worth <span itemProp="price">₹24,950</span> — completely FREE for early adopters. 
                  <meta itemProp="priceCurrency" content="INR" />
                </span>
                No credit card required.
              </p>
              
              {/* Additional SEO text for crawlers */}
              <p className="sr-only">
                ProcureSaathi Early Adopter Program: Get free CRM software, GST tax invoice generator, proforma invoice maker, 
                and B2B procurement tools. India's leading platform for raw material suppliers, manufacturers, distributors, 
                wholesalers, and logistics partners. Free lead management, document management, activity tracking, 
                and pipeline analytics for your business.
              </p>
            </footer>

            {/* Social Share Buttons */}
            <SocialShareButtons />
          </div>
        </article>
      </div>
    </section>
  );
};
