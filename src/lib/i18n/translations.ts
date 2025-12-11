// Multi-language translations for international landing pages

export type Language = 'en' | 'ar' | 'de';

export interface Translations {
  hero: {
    headline: string;
    description: string;
    getStarted: string;
    connectWithSuppliers: string;
    bySubmitting: string;
  };
  form: {
    fullName: string;
    businessEmail: string;
    phone: string;
    companyName: string;
    monthlyVolume: string;
    selectVolume: string;
    interestedCategories: string;
    under10k: string;
    range10k50k: string;
    range50k100k: string;
    range100k500k: string;
    over500k: string;
  };
  sections: {
    topCategories: string;
    whySource: string;
    verifiedSuppliers: string;
    verifiedSuppliersDesc: string;
    integratedLogistics: string;
    integratedLogisticsDesc: string;
    realTimeTracking: string;
    realTimeTrackingDesc: string;
    readyToStart: string;
    joinThousands: string;
    createFreeAccount: string;
    browseCategories: string;
  };
  stats: {
    tradeVolume: string;
    activeSuppliers: string;
    avgSavings: string;
    avgDelivery: string;
    countriesServed: string;
    qualityCompliance: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    hero: {
      headline: "Source Quality Products from India",
      description: "Connect with verified Indian suppliers for seamless import. Competitive pricing, quality assurance, and integrated logistics.",
      getStarted: "Get Started Today",
      connectWithSuppliers: "Connect with Suppliers",
      bySubmitting: "By submitting, you agree to our terms of service and privacy policy",
    },
    form: {
      fullName: "Full Name",
      businessEmail: "Business Email",
      phone: "Phone (with country code)",
      companyName: "Company Name",
      monthlyVolume: "Monthly Sourcing Volume",
      selectVolume: "Select volume range",
      interestedCategories: "Interested Categories",
      under10k: "Under $10,000",
      range10k50k: "$10,000 - $50,000",
      range50k100k: "$50,000 - $100,000",
      range100k500k: "$100,000 - $500,000",
      over500k: "Over $500,000",
    },
    sections: {
      topCategories: "Top Export Categories to",
      whySource: "Why Source from India via ProcureSaathi?",
      verifiedSuppliers: "Verified Suppliers",
      verifiedSuppliersDesc: "All suppliers are verified with proper export licenses, certifications, and track records",
      integratedLogistics: "Integrated Logistics",
      integratedLogisticsDesc: "End-to-end shipping solutions from factory to your door with customs support",
      realTimeTracking: "Real-Time Tracking",
      realTimeTrackingDesc: "Track your shipments in real-time from dispatch to delivery at destination port",
      readyToStart: "Ready to Start Sourcing from India?",
      joinThousands: "Join thousands of importers who save 25-40% on procurement costs",
      createFreeAccount: "Create Free Account",
      browseCategories: "Browse Categories",
    },
    stats: {
      tradeVolume: "Trade Volume",
      activeSuppliers: "Active Suppliers",
      avgSavings: "Avg. Savings",
      avgDelivery: "Avg. Delivery Time",
      countriesServed: "Countries Served",
      qualityCompliance: "Quality Compliance",
    },
  },
  ar: {
    hero: {
      headline: "احصل على منتجات عالية الجودة من الهند",
      description: "تواصل مع موردين هنود معتمدين للاستيراد السلس. أسعار تنافسية، ضمان الجودة، وخدمات لوجستية متكاملة.",
      getStarted: "ابدأ اليوم",
      connectWithSuppliers: "تواصل مع الموردين",
      bySubmitting: "بتقديم هذا النموذج، أنت توافق على شروط الخدمة وسياسة الخصوصية",
    },
    form: {
      fullName: "الاسم الكامل",
      businessEmail: "البريد الإلكتروني للعمل",
      phone: "الهاتف (مع رمز الدولة)",
      companyName: "اسم الشركة",
      monthlyVolume: "حجم التوريد الشهري",
      selectVolume: "اختر نطاق الحجم",
      interestedCategories: "الفئات المهتمة بها",
      under10k: "أقل من 10,000 دولار",
      range10k50k: "10,000 - 50,000 دولار",
      range50k100k: "50,000 - 100,000 دولار",
      range100k500k: "100,000 - 500,000 دولار",
      over500k: "أكثر من 500,000 دولار",
    },
    sections: {
      topCategories: "أهم فئات التصدير إلى",
      whySource: "لماذا تشتري من الهند عبر ProcureSaathi؟",
      verifiedSuppliers: "موردون معتمدون",
      verifiedSuppliersDesc: "جميع الموردين معتمدون بتراخيص تصدير مناسبة وشهادات وسجلات أداء",
      integratedLogistics: "خدمات لوجستية متكاملة",
      integratedLogisticsDesc: "حلول شحن شاملة من المصنع إلى بابك مع دعم جمركي",
      realTimeTracking: "تتبع في الوقت الفعلي",
      realTimeTrackingDesc: "تتبع شحناتك في الوقت الفعلي من الإرسال إلى التسليم في الميناء",
      readyToStart: "هل أنت مستعد للبدء بالاستيراد من الهند؟",
      joinThousands: "انضم إلى آلاف المستوردين الذين يوفرون 25-40% من تكاليف الشراء",
      createFreeAccount: "إنشاء حساب مجاني",
      browseCategories: "تصفح الفئات",
    },
    stats: {
      tradeVolume: "حجم التجارة",
      activeSuppliers: "الموردون النشطون",
      avgSavings: "متوسط التوفير",
      avgDelivery: "متوسط وقت التسليم",
      countriesServed: "الدول المخدومة",
      qualityCompliance: "الامتثال للجودة",
    },
  },
  de: {
    hero: {
      headline: "Qualitätsprodukte aus Indien beziehen",
      description: "Verbinden Sie sich mit verifizierten indischen Lieferanten für nahtlosen Import. Wettbewerbsfähige Preise, Qualitätssicherung und integrierte Logistik.",
      getStarted: "Jetzt starten",
      connectWithSuppliers: "Mit Lieferanten verbinden",
      bySubmitting: "Mit der Übermittlung stimmen Sie unseren Nutzungsbedingungen und Datenschutzrichtlinien zu",
    },
    form: {
      fullName: "Vollständiger Name",
      businessEmail: "Geschäftliche E-Mail",
      phone: "Telefon (mit Landesvorwahl)",
      companyName: "Firmenname",
      monthlyVolume: "Monatliches Beschaffungsvolumen",
      selectVolume: "Volumenbereich auswählen",
      interestedCategories: "Interessierte Kategorien",
      under10k: "Unter 10.000 €",
      range10k50k: "10.000 € - 50.000 €",
      range50k100k: "50.000 € - 100.000 €",
      range100k500k: "100.000 € - 500.000 €",
      over500k: "Über 500.000 €",
    },
    sections: {
      topCategories: "Top-Exportkategorien nach",
      whySource: "Warum über ProcureSaathi aus Indien beziehen?",
      verifiedSuppliers: "Verifizierte Lieferanten",
      verifiedSuppliersDesc: "Alle Lieferanten sind mit ordnungsgemäßen Exportlizenzen, Zertifizierungen und Erfolgsnachweisen verifiziert",
      integratedLogistics: "Integrierte Logistik",
      integratedLogisticsDesc: "End-to-End-Versandlösungen von der Fabrik bis zu Ihrer Tür mit Zollunterstützung",
      realTimeTracking: "Echtzeit-Verfolgung",
      realTimeTrackingDesc: "Verfolgen Sie Ihre Sendungen in Echtzeit vom Versand bis zur Lieferung am Zielhafen",
      readyToStart: "Bereit, mit der Beschaffung aus Indien zu beginnen?",
      joinThousands: "Schließen Sie sich Tausenden von Importeuren an, die 25-40% bei den Beschaffungskosten sparen",
      createFreeAccount: "Kostenloses Konto erstellen",
      browseCategories: "Kategorien durchsuchen",
    },
    stats: {
      tradeVolume: "Handelsvolumen",
      activeSuppliers: "Aktive Lieferanten",
      avgSavings: "Durchschn. Ersparnis",
      avgDelivery: "Durchschn. Lieferzeit",
      countriesServed: "Bediente Länder",
      qualityCompliance: "Qualitätskonformität",
    },
  },
};

// Get default language for a country
export const getDefaultLanguage = (country: string): Language => {
  const countryLanguageMap: Record<string, Language> = {
    uae: 'ar',
    saudi: 'ar',
    germany: 'de',
    austria: 'de',
    switzerland: 'de',
  };
  return countryLanguageMap[country.toLowerCase()] || 'en';
};

// RTL languages
export const isRTL = (lang: Language): boolean => {
  return lang === 'ar';
};
