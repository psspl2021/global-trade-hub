/**
 * Demo Voiceover Script — Multi-language narration synced to demo phases.
 * Uses browser SpeechSynthesis API (zero API cost).
 * Tone: conversational, boardroom-ready — NOT robotic.
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
      en: 'Welcome to ProcureSaathi — your private procurement network. This is not a marketplace… This is your own controlled sourcing engine. Let me walk you through how it works.',
      hi: 'प्रोक्योरसाथी में आपका स्वागत है — आपका निजी प्रोक्योरमेंट नेटवर्क। यह कोई मार्केटप्लेस नहीं है… यह आपका अपना नियंत्रित सोर्सिंग इंजन है।',
    },
    buyerText: {
      en: 'Welcome, Buyer. This is your Procurement Command Center. From here, you run reverse auctions, manage suppliers, and track every order — from dispatch to delivery.',
      hi: 'स्वागत है, बायर। यह आपका प्रोक्योरमेंट कमांड सेंटर है।',
    },
    supplierText: {
      en: 'Welcome, Supplier. This is where you receive auction invites, place competitive bids, and manage your orders. Let me show you how it works.',
      hi: 'स्वागत है, सप्लायर। यहाँ आप ऑक्शन आमंत्रण प्राप्त करते हैं और प्रतिस्पर्धी बोलियाँ लगाते हैं।',
    },
  },
  {
    step: 'rfq_start',
    text: {
      en: 'You don\'t start with forms… You just describe your requirement in plain text. ProcureSaathi\'s AI converts it into a structured RFQ — automatically.',
      hi: 'आप फॉर्म से शुरू नहीं करते… आप बस अपनी ज़रूरत सामान्य भाषा में बताते हैं। प्रोक्योरसाथी का AI इसे अपने-आप एक संरचित RFQ में बदल देता है।',
    },
    supplierText: {
      en: 'The buyer has submitted a requirement… and the system has structured it into a detailed enquiry — with SKU-level breakdown, delivery terms, and payment conditions.',
      hi: 'बायर ने अपनी ज़रूरत सबमिट कर दी है… और सिस्टम ने इसे SKU-लेवल ब्रेकडाउन के साथ एक डिटेल्ड एन्क्वायरी में बदल दिया है।',
    },
  },
  {
    step: 'rfq_structured',
    text: {
      en: 'Every requirement is structured before reaching suppliers… No ambiguity. No back-and-forth. Product, quantity, SKU breakdown, delivery timeline, payment terms — all locked before a single supplier is contacted.',
      hi: 'हर ज़रूरत सप्लायर्स तक पहुँचने से पहले संरचित होती है… कोई अस्पष्टता नहीं। प्रोडक्ट, क्वांटिटी, SKU ब्रेकडाउन, डिलीवरी टाइमलाइन — सब लॉक।',
    },
  },
  {
    step: 'supplier_invite',
    text: {
      en: 'Notice something… Suppliers are not browsing listings here. They are responding to your requirement — through structured, private invitations. Only your trusted network competes.',
      hi: 'ध्यान दीजिए… सप्लायर्स यहाँ लिस्टिंग ब्राउज़ नहीं कर रहे। वे आपकी ज़रूरत पर रिस्पॉन्ड कर रहे हैं — संरचित, निजी आमंत्रण के ज़रिए।',
    },
    supplierText: {
      en: 'You\'ve received a private auction invitation from a verified buyer. Review the requirement details and prepare your best bid.',
      hi: 'आपको एक वेरिफाइड बायर से प्राइवेट ऑक्शन इन्विटेशन मिला है। ज़रूरत की डिटेल्स देखें और अपनी बेस्ट बोली तैयार करें।',
    },
  },
  {
    step: 'auction_live',
    text: {
      en: 'Now the most powerful feature — Reverse Auctions… Instead of calling 3 to 4 suppliers manually, you invite your trusted suppliers into a live competitive auction. They compete in real time… and you get the best possible price — transparently.',
      hi: 'अब सबसे शक्तिशाली फीचर — रिवर्स ऑक्शन… मैन्युअली 3-4 सप्लायर्स को कॉल करने की बजाय, आप अपने विश्वसनीय सप्लायर्स को लाइव ऑक्शन में आमंत्रित करते हैं।',
    },
    buyerText: {
      en: 'You\'ve invited 3 suppliers to compete… Watch as bids drop in real time. You don\'t negotiate — the market does it for you.',
      hi: 'आपने 3 सप्लायर्स को प्रतिस्पर्धा के लिए आमंत्रित किया है… देखें कैसे बोलियाँ रियल-टाइम में गिरती हैं।',
    },
    supplierText: {
      en: 'You\'ve received an auction invite. Place your best bid to win the order… The lowest bid wins — compete smartly.',
      hi: 'आपको ऑक्शन का आमंत्रण मिला है। ऑर्डर जीतने के लिए अपनी सबसे अच्छी बोली लगाएँ।',
    },
  },
  {
    step: 'auction_complete',
    text: {
      en: 'The auction closes… and the lowest bidder wins — transparently. Now, you generate a Purchase Order directly from the platform. No manual follow-ups… No confusion. Everything is structured and tracked.',
      hi: 'ऑक्शन बंद हो गया… और सबसे कम बोली लगाने वाला जीतता है — पारदर्शी तरीके से। अब आप सीधे प्लेटफॉर्म से पर्चेज ऑर्डर बनाते हैं।',
    },
    buyerText: {
      en: 'Auction complete! You got the best price… Now generate a Purchase Order with one click — no back and forth.',
      hi: 'ऑक्शन पूरा! आपको सबसे अच्छी कीमत मिली। अब एक क्लिक में पर्चेज ऑर्डर बनाएँ।',
    },
    supplierText: {
      en: 'The auction has ended. If you won… a Purchase Order will be generated for you. Accept it to proceed.',
      hi: 'ऑक्शन समाप्त हो गया। अगर आप जीते, तो पर्चेज ऑर्डर जनरेट होगा।',
    },
  },
  {
    step: 'savings',
    text: {
      en: 'Savings per auction are typically modest — around 500 to 1,000 rupees per metric ton… depending on category and competition. But over multiple procurements… this compounds into significant annual savings of 10 to 15 percent.',
      hi: 'हर ऑक्शन में बचत आमतौर पर मामूली होती है — लगभग 500 से 1,000 रुपये प्रति मीट्रिक टन… लेकिन कई खरीद के बाद, यह सालाना 10 से 15 प्रतिशत तक की बड़ी बचत में बदल जाती है।',
    },
  },
  {
    step: 'loss_aversion',
    text: {
      en: 'Without competitive bidding… buyers often pay significantly more for the same order. This difference… directly impacts your margins.',
      hi: 'कंपेटिटिव बिडिंग के बिना… बायर्स अक्सर उसी ऑर्डर के लिए ज्यादा कीमत देते हैं। यह फर्क… सीधे आपके मार्जिन पर असर डालता है।',
    },
  },
  {
    step: 'po_start',
    text: {
      en: 'Now comes Execution Tracking — where most systems fail… Here, every step is enforced. No step can be skipped. This ensures discipline and trust… across the entire supply chain.',
      hi: 'अब आता है एक्ज़ीक्यूशन ट्रैकिंग — जहाँ ज़्यादातर सिस्टम फेल होते हैं… यहाँ हर स्टेप एनफोर्स्ड है।',
    },
  },
  {
    step: 'po_sent',
    text: {
      en: 'The Purchase Order has been sent to the supplier… They must formally accept before anything moves forward.',
      hi: 'पर्चेज ऑर्डर सप्लायर को भेज दिया गया है… आगे बढ़ने से पहले उन्हें औपचारिक रूप से स्वीकार करना होगा।',
    },
    supplierText: {
      en: 'You\'ve received a Purchase Order… Review the terms and accept to begin fulfillment.',
      hi: 'आपको पर्चेज ऑर्डर मिला है। शर्तें देखें और स्वीकार करें।',
    },
  },
  {
    step: 'po_accepted',
    text: {
      en: 'Supplier has accepted the order… Now shipment details must be entered — vehicle number, driver contact, and transport source.',
      hi: 'सप्लायर ने ऑर्डर स्वीकार कर लिया है… अब शिपमेंट डिटेल्स भरनी होंगी।',
    },
  },
  {
    step: 'po_in_transit',
    text: {
      en: 'Shipment is now in transit… Vehicle details are locked. If delivery is delayed… reasons must be recorded. No excuses without accountability.',
      hi: 'शिपमेंट अब ट्रांज़िट में है… अगर डिलीवरी में देरी होती है, तो कारण दर्ज करने होंगे।',
    },
  },
  {
    step: 'po_delivered',
    text: {
      en: 'Goods delivered… Delivery is confirmed with accountability. The buyer must now confirm payment… to close the loop.',
      hi: 'माल डिलीवर हो गया… अब बायर को पेमेंट कन्फर्म करना होगा।',
    },
  },
  {
    step: 'po_payment',
    text: {
      en: 'Payment confirmed… If a previous order is incomplete, new orders are blocked. This ensures serious business… not casual transactions.',
      hi: 'पेमेंट कन्फर्म हो गया… अगर कोई पुराना ऑर्डर अधूरा है, तो नए ऑर्डर ब्लॉक हो जाएंगे।',
    },
  },
  {
    step: 'po_closed',
    text: {
      en: 'Order complete… The full lifecycle is finished. Supplier reliability score is updated… The buyer can now create a new order.',
      hi: 'ऑर्डर पूरा हो गया… सप्लायर की विश्वसनीयता स्कोर अपडेट हो गया है।',
    },
  },
  {
    step: 'outro',
    text: {
      en: 'ProcureSaathi is not just a tool… It is your Procurement Operating System. You control the network… You control the pricing… You control the outcome.',
      hi: 'प्रोक्योरसाथी सिर्फ एक टूल नहीं है… यह आपका प्रोक्योरमेंट ऑपरेटिंग सिस्टम है।',
    },
  },
  {
    step: 'cta',
    text: {
      en: 'You are now ready to run your first global auction… Let\'s get started.',
      hi: 'अब आप अपना पहला ग्लोबल ऑक्शन चलाने के लिए तैयार हैं… चलिए शुरू करते हैं।',
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
