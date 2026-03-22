import { useSEOHead } from '@/hooks/useSEOHead';

const Terms = () => {
  useSEOHead({
    title: 'Terms & Conditions | ProcureSaathi — B2B Procurement Platform',
    description: 'Read the Terms & Conditions for using ProcureSaathi, India\'s trusted B2B procurement marketplace connecting verified buyers and suppliers.',
  });

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 min-h-[70vh]">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Terms &amp; Conditions</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 2026</p>

      <section className="space-y-6 text-foreground/90 leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold mb-2">1. About ProcureSaathi</h2>
          <p>
            ProcureSaathi is a B2B procurement marketplace that connects verified Indian suppliers with
            buyers across the globe. Our platform facilitates transparent procurement through reverse
            auctions, RFQ management, and AI-powered supplier matching for categories including ferrous
            and non-ferrous metals, polymers, chemicals, construction materials, textiles, and industrial
            equipment.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">2. Acceptance of Terms</h2>
          <p>
            By accessing or using ProcureSaathi ("the Platform"), you agree to be bound by these Terms &amp;
            Conditions, our Privacy Policy, and all applicable laws and regulations. If you do not agree
            with any part of these terms, you must not use the Platform.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">3. User Accounts &amp; Registration</h2>
          <p>
            Users must provide accurate, complete, and current information during registration. Each user
            is responsible for maintaining the confidentiality of their account credentials. You may not
            share your account or allow others to access it. ProcureSaathi reserves the right to suspend
            or terminate accounts that violate these terms.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">4. Platform Usage</h2>
          <p>
            All users—buyers and suppliers—must provide truthful information when posting requirements,
            submitting quotations, or participating in reverse auctions. Manipulative bidding, fake RFQs,
            misleading product descriptions, or any form of platform abuse may result in immediate account
            suspension and potential legal action.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">5. Procurement &amp; Transactions</h2>
          <p>
            ProcureSaathi acts as a facilitator connecting buyers with suppliers. We do not manufacture,
            stock, or ship any products. All transactions, including pricing, quality, delivery timelines,
            and payment terms, are negotiated directly between the buyer and the supplier. ProcureSaathi
            is not a party to any purchase agreement unless explicitly stated.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">6. Pricing &amp; Service Fees</h2>
          <p>
            Certain features on ProcureSaathi, including reverse auction credits and premium supplier
            visibility, may require payment. All fees are non-refundable unless stated otherwise.
            Applicable taxes (including GST) will be charged as per Indian regulations.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">7. Intellectual Property</h2>
          <p>
            All content on ProcureSaathi—including text, graphics, logos, icons, images, data, and
            software—is the property of ProcureSaathi or its licensors and is protected by Indian and
            international copyright laws. You may not reproduce, distribute, or create derivative works
            without prior written consent.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">8. Limitation of Liability</h2>
          <p>
            ProcureSaathi shall not be liable for any direct, indirect, incidental, or consequential
            damages arising from the use of the Platform, including but not limited to losses from
            failed transactions, delivery delays, product quality issues, or data breaches beyond our
            reasonable control.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">9. Dispute Resolution</h2>
          <p>
            Any disputes arising from the use of the Platform shall be governed by the laws of India.
            Users agree to attempt resolution through mediation before pursuing litigation. The courts
            of Hyderabad, Telangana shall have exclusive jurisdiction.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">10. Modifications</h2>
          <p>
            ProcureSaathi reserves the right to modify these Terms &amp; Conditions at any time. Users will
            be notified of material changes via email or on-platform notification. Continued use of the
            Platform after changes constitutes acceptance of the revised terms.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">11. Contact</h2>
          <p>
            For questions about these Terms &amp; Conditions, please contact us at{' '}
            <a href="mailto:support@procuresaathi.com" className="text-primary underline">
              support@procuresaathi.com
            </a>.
          </p>
        </div>
      </section>
    </main>
  );
};

export default Terms;
