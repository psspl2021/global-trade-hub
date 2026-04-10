/**
 * Global Reverse Auction Positioning & Messaging Constants
 * Used across landing pages, dashboards, and auction creation flows.
 */

export const GLOBAL_AUCTION_POSITIONING = {
  headline: "Run Private Global Reverse Auctions with Your Trusted Network",
  subtext:
    "Invite your suppliers and logistics partners. Get competitive bids across borders with full control, compliance, and transparency.",
  highlights: [
    "🌍 Multi-country sourcing with your own suppliers",
    "💰 Multi-currency reverse bidding (USD, EUR, AED, INR, etc.)",
    "🚢 Integrated Global Fleet Transportation (logistics layer)",
    "📊 Real price discovery based on your supplier network",
    "🔒 Private auctions — no open marketplace noise",
  ],
};

export const BUYER_GLOBAL_FLOW = [
  {
    step: "1",
    title: "Create Global Auction",
    desc: "Define product, quantity, destination, and trade terms (FOB, CIF, etc.)",
  },
  {
    step: "2",
    title: "Invite Your Suppliers",
    desc: "Add trusted suppliers manually or invite via WhatsApp/email",
  },
  {
    step: "3",
    title: "Add Logistics Partners",
    desc: "Include Global Fleet Transportation providers for end-to-end pricing",
  },
  {
    step: "4",
    title: "Receive Competitive Bids",
    desc: "Suppliers compete in real-time reverse auction",
  },
  {
    step: "5",
    title: "Select & Fulfill",
    desc: "Finalize supplier + logistics in one streamlined flow",
  },
];

export const GLOBAL_CTA = {
  primary: "Create Global Auction",
  secondary: "Invite Suppliers & Fleet Partners",
  note: "Start with your existing network. No need to search suppliers — bring your own and unlock better pricing.",
};

export const SUPPLIER_INVITE_MESSAGE = (link: string) =>
  `You've been invited to participate in a private global reverse auction on ProcureSaathi.

✔ Verified buyer requirement
✔ Transparent competitive bidding
✔ International sourcing opportunity

Join and submit your bid:
${link}`;

export const FLEET_TRANSPORT_POSITIONING = {
  title: "Global Fleet Transportation",
  desc: "Seamlessly integrate logistics into your procurement. Invite your transporters or receive freight quotes alongside supplier bids.",
  features: [
    "🚢 Sea, Air, Road & Rail support",
    "🌍 Cross-border shipment handling",
    "📦 Linked directly to auction orders",
    "⏱ Real-time shipment tracking",
  ],
};

export const PLATFORM_STRATEGY_NOTE =
  "ProcureSaathi does not sell leads or run an open marketplace. You control your supplier and logistics network. We provide the infrastructure to run transparent, competitive global auctions.";

export const SUPPLIER_INVITE_NUDGE = {
  title: "Add at least 3 suppliers to unlock best pricing",
  subtext: "More competition = better price discovery",
};

export const NETWORK_SIGNAL = (count: number) =>
  `You've added ${count} supplier${count !== 1 ? "s" : ""}. ${
    count < 3
      ? "Add more for stronger competition and better pricing."
      : "Strong network — great competition drives better pricing."
  }`;
