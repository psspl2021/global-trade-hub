/**
 * Demo Voiceover Script — Hinglish narration for natural Indian English voice.
 * Text is Hinglish (romanized Hindi-English mix) so en-IN voice sounds human.
 */

export type DemoNarrationStep =
  | 'intro'
  | 'rfq_start'
  | 'rfq_structured'
  | 'supplier_invite'
  | 'auction_live'
  | 'auction_complete'
  | 'savings'
  | 'loss_aversion'
  | 'po_start'
  | 'po_sent'
  | 'po_accepted'
  | 'po_in_transit'
  | 'po_delivered'
  | 'po_payment'
  | 'po_closed'
  | 'outro'
  | 'cta';

export type DemoScenario = 'full' | 'buyer' | 'supplier';

export interface NarrationEntry {
  step: DemoNarrationStep;
  text: Record<string, string>;
  buyerText?: Record<string, string>;
  supplierText?: Record<string, string>;
}

export const DEMO_NARRATION: NarrationEntry[] = [
  {
    step: 'intro',
    text: {
      en: 'Welcome to ProcureSaathi — aapka private procurement network. Yeh marketplace nahi hai… yeh aapka apna controlled sourcing engine hai. Let me walk you through how it works.',
      hi: 'ProcureSaathi mein aapka swagat hai — aapka apna private procurement network. Yeh koi marketplace nahi hai… yeh aapka khud ka sourcing engine hai.',
    },
    buyerText: {
      en: 'Welcome, Buyer. Yeh hai aapka Procurement Command Center. Yahaan se aap reverse auctions chalate ho, suppliers manage karte ho, aur har order track karte ho.',
      hi: 'Swagat hai, Buyer. Yeh aapka Procurement Command Center hai. Yahaan se sab control hota hai.',
    },
    supplierText: {
      en: 'Welcome, Supplier. Yahaan aap auction invites receive karte ho, competitive bids lagate ho, aur apne orders manage karte ho.',
      hi: 'Swagat hai, Supplier. Yahaan aap auction invites receive karte ho aur competitive bids lagate ho.',
    },
  },
  {
    step: 'rfq_start',
    text: {
      en: 'Aap sirf requirement daalte ho — system automatically RFQ bana deta hai. No forms, no manual work.',
      hi: 'Aap bas apni requirement likhte ho, system automatically RFQ bana deta hai.',
    },
    supplierText: {
      en: 'Buyer ne apni requirement submit kar di hai… aur system ne ise ek detailed enquiry mein convert kar diya hai — SKU breakdown, delivery terms, payment conditions — sab ready.',
      hi: 'Buyer ne requirement submit ki hai… system ne ise detailed enquiry mein convert kar diya hai.',
    },
  },
  {
    step: 'rfq_structured',
    text: {
      en: 'Har requirement suppliers tak pahunchne se pehle structured hoti hai. No ambiguity, no back-and-forth. Product, quantity, SKU breakdown, delivery timeline — sab locked hai.',
      hi: 'Har requirement pehle se structured hoti hai. Koi confusion nahi. Product, quantity, timeline — sab locked.',
    },
  },
  {
    step: 'supplier_invite',
    text: {
      en: 'Ek cheez notice karo… Suppliers yahaan listings browse nahi kar rahe. Woh aapki requirement par respond kar rahe hain — private invitations ke through. Sirf aapka trusted network compete karta hai.',
      hi: 'Notice karo… Suppliers listings nahi dekh rahe. Woh aapki requirement par respond kar rahe hain — private invite ke through.',
    },
    supplierText: {
      en: 'Aapko ek verified buyer se private auction invitation mila hai. Requirement details review karo aur apni best bid taiyaar karo.',
      hi: 'Aapko ek verified buyer se private auction invite mila hai. Details dekho aur best bid lagao.',
    },
  },
  {
    step: 'auction_live',
    text: {
      en: 'Ab sabse powerful feature — Reverse Auction. Manually 3-4 suppliers ko call karne ki jagah, aap apne trusted suppliers ko live competitive auction mein invite karte ho. Woh real-time mein compete karte hain… aur aapko best possible price milta hai — transparently.',
      hi: 'Ab dekhiye sabse powerful feature — Reverse Auction. Aapke suppliers real-time mein compete kar rahe hain. Best price automatically milta hai.',
    },
    buyerText: {
      en: 'Aapne 3 suppliers ko compete karne ke liye invite kiya hai. Dekho kaise bids real-time mein drop ho rahi hain. Aap negotiate nahi karte — market karta hai aapke liye.',
      hi: 'Aapne 3 suppliers ko invite kiya hai. Dekho kaise bids real-time mein gir rahi hain.',
    },
    supplierText: {
      en: 'Aapko auction invite mila hai. Order jeetne ke liye apni best bid lagao. Lowest bid wins — compete smartly.',
      hi: 'Aapko auction invite mila hai. Best bid lagao — lowest bid jeetegi.',
    },
  },
  {
    step: 'auction_complete',
    text: {
      en: 'Auction complete ho gaya… aur lowest bidder jeeta hai — transparently. Ab aap directly platform se Purchase Order generate karte ho. No manual follow-ups, no confusion.',
      hi: 'Auction khatam — best price automatically mil gaya. Ab ek click mein Purchase Order ban jaata hai.',
    },
    buyerText: {
      en: 'Auction complete! Aapko best price mil gaya. Ab ek click mein Purchase Order generate karo — no back and forth.',
      hi: 'Auction complete! Best price mila. Ek click mein PO ban jaayega.',
    },
    supplierText: {
      en: 'Auction end ho gaya. Agar aap jeete ho… toh aapke liye Purchase Order generate hoga. Accept karo aur aage badho.',
      hi: 'Auction khatam. Agar aap jeete, toh PO generate hoga. Accept karo.',
    },
  },
  {
    step: 'savings',
    text: {
      en: 'Aapne kuch hi seconds mein significant cost save kiya hai. Har auction mein typically 500 se 1000 rupees per metric ton savings hoti hai. Multiple procurements ke baad, yeh 10 se 15 percent annual savings ban jaati hai.',
      hi: 'Sirf kuch seconds mein aapne cost save kar li. Har auction mein 500 se 1000 rupees per MT bachte hain. Saal bhar mein 10 se 15 percent savings.',
    },
  },
  {
    step: 'loss_aversion',
    text: {
      en: 'Without competition, yahi order aapko zyada mehenga padta. Competitive bidding ke bina… buyers aksar usi order ke liye zyada pay karte hain. Yeh difference… seedha aapke margins par impact karta hai.',
      hi: 'Agar competition nahi hota, toh yeh order aur mehenga padta. Yeh fark seedha margins par impact karta hai.',
    },
  },
  {
    step: 'po_start',
    text: {
      en: 'Ab aata hai Execution Tracking — jahaan zyada-tar systems fail hote hain. Yahaan har step enforced hai. Koi step skip nahi ho sakta. Discipline aur trust — poori supply chain mein.',
      hi: 'Ab aata hai Execution Tracking. Har step enforced hai. Koi step skip nahi hoga.',
    },
  },
  {
    step: 'po_sent',
    text: {
      en: 'Purchase Order supplier ko bhej diya gaya hai. Aage badhne se pehle unhe formally accept karna hoga.',
      hi: 'PO supplier ko bhej diya hai. Unhe pehle accept karna hoga.',
    },
    supplierText: {
      en: 'Aapko Purchase Order mila hai. Terms review karo aur accept karo — fulfillment shuru karne ke liye.',
      hi: 'Aapko PO mila hai. Terms dekho aur accept karo.',
    },
  },
  {
    step: 'po_accepted',
    text: {
      en: 'Supplier ne order accept kar liya hai. Ab shipment details enter karni hongi — vehicle number, driver contact, aur transport source.',
      hi: 'Supplier ne accept kiya. Ab shipment details bharne hongi.',
    },
  },
  {
    step: 'po_in_transit',
    text: {
      en: 'Shipment ab transit mein hai. Vehicle details locked hain. Agar delivery delay hoti hai… reasons record karne honge. Bina accountability ke koi excuse nahi chalega.',
      hi: 'Shipment transit mein hai. Agar delay hota hai toh reason dena padega. Koi excuse nahi.',
    },
  },
  {
    step: 'po_delivered',
    text: {
      en: 'Goods delivered ho gaye. Delivery confirmed hai with accountability. Ab buyer ko payment confirm karna hoga — loop close karne ke liye.',
      hi: 'Maal deliver ho gaya. Ab buyer ko payment confirm karni hogi.',
    },
  },
  {
    step: 'po_payment',
    text: {
      en: 'Payment confirmed. Agar koi previous order incomplete hai, toh new orders block ho jaayenge. Yeh serious business ensure karta hai — casual transactions nahi.',
      hi: 'Payment confirm ho gayi. Purana order adhoora hai toh naye orders block honge.',
    },
  },
  {
    step: 'po_closed',
    text: {
      en: 'Order complete. Poora lifecycle finish ho gaya hai. Supplier ki reliability score update ho gayi hai. Buyer ab naya order create kar sakta hai.',
      hi: 'Order complete. Supplier ka reliability score update ho gaya. Ab naya order bana sakte ho.',
    },
  },
  {
    step: 'outro',
    text: {
      en: 'ProcureSaathi sirf ek tool nahi hai… Yeh aapka Procurement Operating System hai. Aap network control karte ho. Aap pricing control karte ho. Aap outcome control karte ho.',
      hi: 'Yeh sirf tool nahi — yeh aapka complete procurement system hai. Network, pricing, outcome — sab aapke control mein.',
    },
  },
  {
    step: 'cta',
    text: {
      en: 'Ab aap apna first auction run karne ke liye ready ho. Let\'s get started.',
      hi: 'Ab aap apna first auction start kar sakte ho. Chaliye shuru karte hain.',
    },
  },
];

/** Get narration text based on scenario (role-specific) */
export function getNarrationText(
  step: DemoNarrationStep,
  language: string,
  scenario: DemoScenario = 'full'
): string {
  const entry = DEMO_NARRATION.find(n => n.step === step);
  if (!entry) return '';

  if (scenario === 'buyer' && entry.buyerText) {
    return entry.buyerText[language] || entry.buyerText['en'] || entry.text[language] || entry.text['en'] || '';
  }
  if (scenario === 'supplier' && entry.supplierText) {
    return entry.supplierText[language] || entry.supplierText['en'] || entry.text[language] || entry.text['en'] || '';
  }
  return entry.text[language] || entry.text['en'] || '';
}

/** Map PO status to narration step */
export function poStatusToNarrationStep(status: string): DemoNarrationStep | null {
  const map: Record<string, DemoNarrationStep> = {
    draft: 'po_start',
    sent: 'po_sent',
    accepted: 'po_accepted',
    in_transit: 'po_in_transit',
    delivered: 'po_delivered',
    payment_done: 'po_payment',
    closed: 'po_closed',
  };
  return map[status] || null;
}
