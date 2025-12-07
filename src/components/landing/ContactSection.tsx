import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const ContactSection = () => {
  const navigate = useNavigate();

  return (
    <section id="contact" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
            <p className="text-muted-foreground">
              Have questions? Our team is here to help you with all your sourcing needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <a href="mailto:sales@procuresaathi.com" className="text-muted-foreground hover:text-primary transition-colors">
                    sales@procuresaathi.com
                  </a>
                  <br />
                  <a href="mailto:support@procuresaathi.com" className="text-muted-foreground hover:text-primary transition-colors">
                    support@procuresaathi.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Phone</h3>
                  <a href="tel:+919876543210" className="text-muted-foreground hover:text-primary transition-colors">
                    +91 98765 43210
                  </a>
                  <br />
                  <span className="text-sm text-muted-foreground">(Mon-Sat, 9 AM - 6 PM IST)</span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Registered Office</h3>
                  <p className="text-muted-foreground">
                    ProcureSaathi Solutions Pvt Ltd<br />
                    123, Business Park, Sector 62<br />
                    Noida, Uttar Pradesh 201301<br />
                    India
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Business Hours</h3>
                  <p className="text-muted-foreground">
                    Monday - Saturday: 9:00 AM - 6:00 PM IST<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">Get Started Today</h3>
              <p className="text-muted-foreground mb-6">
                Ready to transform your procurement process? Join thousands of businesses 
                already benefiting from our platform.
              </p>
              <div className="space-y-3">
                <Button className="w-full" onClick={() => navigate('/signup?role=buyer')}>
                  Register as Buyer
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/signup?role=supplier')}>
                  Register as Supplier
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => navigate('/signup?role=logistics_partner')}>
                  Join as Logistics Partner
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
