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

// ── Investor-Grade Positioning ─────────────────────
export const PLATFORM_POSITIONING = {
  title: "Private Global Reverse Auctions",
  desc: "Run procurement with your own supplier network — transparent, competitive, and global.",
};

export const MONETIZATION = {
  buyer: "Pay per auction via credits",
  supplier: "2 months free → then nominal fee",
  fleet: "2 months free → then per shipment or subscription",
};

export const LIQUIDITY_RULE = {
  minSuppliers: 3,
  messageLow: "Add at least 3 suppliers to unlock best pricing",
  messageHigh: "Strong competition drives better pricing",
};

export const TRUST_SIGNALS = [
  "Verified Business Badge",
  "GST / Tax ID Verified",
  "Profile Completeness Score",
  "Private Invite-Only Auctions",
];

export const GLOBAL_FEATURES = [
  "Multi-Currency",
  "Incoterms",
  "Export Compliance",
  "Timezone Conversion",
  "Multi-Language",
];

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

// ── Buyer Monetization ──────────────────────────────
export const BUYER_PRICING_COPY = {
  title: "Buy Auction Credits",
  desc: "Run private global reverse auctions with your supplier network. Pay per auction — no hidden costs.",
  note: "Unused auctions roll over. No expiry within validity period.",
  highlight: "More suppliers = better price discovery",
};

// ── Supplier Pricing ────────────────────────────────
export const SUPPLIER_PRICING = {
  freePeriod: "2 months",
  freeBenefits: [
    "Participate in unlimited auctions",
    "Receive private buyer invites",
    "Access global demand",
  ],
  paidAfter: "Nominal participation fee per auction OR monthly plan",
  positioning: "Start free. Pay only when you start winning business.",
};

// ── Global Fleet Transportation Pricing ─────────────
export const FLEET_PRICING = {
  freePeriod: "2 months",
  freeBenefits: [
    "Access freight requests",
    "Quote logistics for global shipments",
    "Connect directly with buyers",
  ],
  paidAfter: "Nominal fee per shipment or subscription",
  positioning: "Get shipments first. Pay once you start moving goods.",
};

// ── Signup Banners ──────────────────────────────────
export const SUPPLIER_SIGNUP_BANNER =
  "Join ProcureSaathi and access real buyer demand.\n✔ 2 months FREE access\n✔ No lead selling — only verified auctions\n✔ Start receiving global RFQs instantly\nNo upfront cost. Pay only after onboarding period.";

export const FLEET_SIGNUP_BANNER =
  "Join Global Fleet Transportation Network.\n✔ Get real shipment requests\n✔ Work with verified buyers\n✔ 2 months FREE access\nStart receiving freight demand immediately.";

export const FREE_BADGE = "🆓 Free access for suppliers & fleet (Limited time)";

// ── Supplier Invite Email HTML ──────────────────────
export const supplierInviteEmailHtml = (link: string) => `
<h2>You've been invited to a Private Global Auction</h2>
<p>You've been invited to participate in a reverse auction on ProcureSaathi.</p>
<ul>
  <li>✔ Verified Buyer Requirement</li>
  <li>✔ Transparent Competitive Bidding</li>
  <li>✔ Global Sourcing Opportunity</li>
</ul>
<p><a href="${link}" style="padding:12px 20px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">
  Join Auction →
</a></p>
<p style="color:#888;font-size:13px;">This is a private auction — only invited suppliers can participate.</p>
`;
