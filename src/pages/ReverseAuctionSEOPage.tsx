import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function ReverseAuctionSEOPage() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <Helmet>
        <title>Reverse Auction Procurement Platform | Online Reverse Bidding | ProcureSaathi</title>
        <meta
          name="description"
          content="Run reverse auctions for industrial procurement. Discover the best supplier prices with competitive bidding. Used by procurement teams across India."
        />
        <link rel="canonical" href="https://www.procuresaathi.com/reverse-auction-procurement" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Reverse Auction Procurement Platform",
            description: "Run reverse auctions for industrial procurement with verified suppliers.",
            url: "https://www.procuresaathi.com/reverse-auction-procurement",
            publisher: {
              "@type": "Organization",
              name: "ProcureSaathi",
              url: "https://www.procuresaathi.com",
            },
          })}
        </script>
      </Helmet>

      <h1 className="text-4xl font-bold text-foreground mb-6">
        Reverse Auction Procurement Platform
      </h1>
      <p className="text-lg text-muted-foreground mb-10">
        ProcureSaathi enables industrial buyers to run competitive reverse auctions
        with verified suppliers. Suppliers bid down prices in real time, allowing
        buyers to achieve significant cost savings and transparent procurement.
      </p>

      {/* Benefits */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          Why Use Reverse Auctions for Procurement?
        </h2>
        <ul className="space-y-3 text-muted-foreground">
          <li>✔ Discover true market price through competitive supplier bidding</li>
          <li>✔ Reduce procurement cost by 5–15%</li>
          <li>✔ Invite verified suppliers only</li>
          <li>✔ Transparent audit trail for enterprise procurement</li>
          <li>✔ Integrated RFQ + Reverse Auction workflow</li>
        </ul>
      </section>

      {/* How It Works */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          How Reverse Auctions Work
        </h2>
        <ol className="space-y-3 text-muted-foreground list-decimal list-inside">
          <li>Buyer posts procurement requirement</li>
          <li>Buyer invites verified suppliers</li>
          <li>Suppliers submit competitive bids</li>
          <li>Prices decrease in real-time bidding</li>
          <li>Buyer awards contract to the best supplier</li>
        </ol>
      </section>

      {/* RFQ vs Reverse Auction */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          RFQ vs Reverse Auction
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border border-border rounded-lg">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-3 text-left text-foreground">Procurement Method</th>
                <th className="p-3 text-left text-foreground">Use Case</th>
                <th className="p-3 text-left text-foreground">Outcome</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border">
                <td className="p-3">RFQ (Sealed Bidding)</td>
                <td className="p-3">Custom fabrication, complex specs</td>
                <td className="p-3">Negotiated pricing with technical evaluation</td>
              </tr>
              <tr>
                <td className="p-3">Reverse Auction</td>
                <td className="p-3">Standardized commodities, high volume</td>
                <td className="p-3">Lowest market price through competition</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Industries */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          Industries Using Reverse Auctions
        </h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>• Steel & Metals Procurement</li>
          <li>• Construction Materials</li>
          <li>• Industrial Chemicals</li>
          <li>• Polymers & Plastics</li>
          <li>• Electrical Equipment</li>
        </ul>
      </section>

      {/* CTA */}
      <section className="bg-primary/10 p-8 rounded-xl text-center">
        <h3 className="text-2xl font-bold text-foreground mb-4">
          Start Your Reverse Auction Today
        </h3>
        <p className="text-muted-foreground mb-6">
          Invite suppliers and discover the best procurement prices through competitive bidding.
        </p>
        <Link
          to="/buyer/reverse-auctions"
          className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          Create Reverse Auction
        </Link>
      </section>

      
    </div>
  );
}
