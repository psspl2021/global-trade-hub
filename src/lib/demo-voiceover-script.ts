/**
 * Demo Voiceover Script — Multi-language narration synced to demo phases.
 * Uses browser SpeechSynthesis API (zero API cost).
 */

export type DemoNarrationStep =
  | 'intro'
  | 'auction_live'
  | 'auction_complete'
  | 'po_start'
  | 'po_sent'
  | 'po_accepted'
  | 'po_in_transit'
  | 'po_delivered'
  | 'po_payment'
  | 'po_closed'
  | 'outro';

export interface NarrationEntry {
  step: DemoNarrationStep;
  text: Record<string, string>; // keyed by language code
}

export const DEMO_NARRATION: NarrationEntry[] = [
  {
    step: 'intro',
    text: {
      en: 'Welcome to ProcureSaathi — your private global procurement network. This is not a marketplace. This is your own controlled sourcing engine. Let\'s walk through how modern procurement works here.',
      hi: 'प्रोक्योरसाथी में आपका स्वागत है — आपका निजी वैश्विक प्रोक्योरमेंट नेटवर्क। यह कोई मार्केटप्लेस नहीं है। यह आपका अपना नियंत्रित सोर्सिंग इंजन है।',
    },
  },
  {
    step: 'auction_live',
    text: {
      en: 'Let\'s start with the most powerful feature — Reverse Auctions. Instead of calling 3 to 4 suppliers manually, you invite your trusted suppliers into a live competitive auction. They compete in real time, and you get the best possible price transparently.',
      hi: 'सबसे शक्तिशाली फीचर से शुरू करते हैं — रिवर्स ऑक्शन। मैन्युअली 3-4 सप्लायर्स को कॉल करने की बजाय, आप अपने विश्वसनीय सप्लायर्स को लाइव ऑक्शन में आमंत्रित करते हैं।',
    },
  },
  {
    step: 'auction_complete',
    text: {
      en: 'The auction is complete. The lowest bidder wins. Now, you generate a Purchase Order directly from the platform. No manual follow-ups. No confusion. Everything is structured and tracked.',
      hi: 'ऑक्शन पूरा हो गया। सबसे कम बोली लगाने वाला जीतता है। अब आप सीधे प्लेटफॉर्म से पर्चेज ऑर्डर बनाते हैं।',
    },
  },
  {
    step: 'po_start',
    text: {
      en: 'Now comes Execution Tracking — where most systems fail. Here, every step is enforced. No step can be skipped. This ensures discipline and trust across the entire supply chain.',
      hi: 'अब आता है एक्ज़ीक्यूशन ट्रैकिंग — जहाँ ज़्यादातर सिस्टम फेल होते हैं। यहाँ हर स्टेप एनफोर्स्ड है।',
    },
  },
  {
    step: 'po_sent',
    text: {
      en: 'The Purchase Order has been sent to the supplier. They must formally accept before anything moves forward.',
      hi: 'पर्चेज ऑर्डर सप्लायर को भेज दिया गया है। आगे बढ़ने से पहले उन्हें औपचारिक रूप से स्वीकार करना होगा।',
    },
  },
  {
    step: 'po_accepted',
    text: {
      en: 'Supplier has accepted the order. Now shipment details must be entered — vehicle number, driver contact, and transport source.',
      hi: 'सप्लायर ने ऑर्डर स्वीकार कर लिया है। अब शिपमेंट डिटेल्स भरनी होंगी।',
    },
  },
  {
    step: 'po_in_transit',
    text: {
      en: 'Shipment is now in transit. Vehicle details are locked. If delivery is delayed, reasons must be recorded. No excuses without accountability.',
      hi: 'शिपमेंट अब ट्रांज़िट में है। अगर डिलीवरी में देरी होती है, तो कारण दर्ज करने होंगे।',
    },
  },
  {
    step: 'po_delivered',
    text: {
      en: 'Goods delivered. Delivery is confirmed with accountability. The buyer must now confirm payment to close the loop.',
      hi: 'माल डिलीवर हो गया। अब बायर को पेमेंट कन्फर्म करना होगा।',
    },
  },
  {
    step: 'po_payment',
    text: {
      en: 'Payment confirmed. If a previous order is incomplete, new orders are blocked. This ensures serious business, not casual transactions.',
      hi: 'पेमेंट कन्फर्म हो गया। अगर कोई पुराना ऑर्डर अधूरा है, तो नए ऑर्डर ब्लॉक हो जाएंगे।',
    },
  },
  {
    step: 'po_closed',
    text: {
      en: 'Order complete. The full lifecycle is finished. Supplier reliability score is updated. The buyer can now create a new order.',
      hi: 'ऑर्डर पूरा हो गया। सप्लायर की विश्वसनीयता स्कोर अपडेट हो गया है।',
    },
  },
  {
    step: 'outro',
    text: {
      en: 'ProcureSaathi is not just a tool. It is your Procurement Operating System. You control the network. You control the pricing. You control the outcome. Let\'s run your first global auction.',
      hi: 'प्रोक्योरसाथी सिर्फ एक टूल नहीं है। यह आपका प्रोक्योरमेंट ऑपरेटिंग सिस्टम है।',
    },
  },
];

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
