// Multi-language translations for international landing pages

export type Language = 'en' | 'hi' | 'fr' | 'nl' | 'ro' | 'es' | 'de' | 'ar';

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
  nav: {
    home: string;
    categories: string;
    suppliers: string;
    about: string;
    contact: string;
    login: string;
    signup: string;
  };
  common: {
    loading: string;
    error: string;
    success: string;
    submit: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    view: string;
    search: string;
    filter: string;
    noResults: string;
  };
}

export const translations: Record<Language, Translations> = {
  // English (Default)
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
    nav: {
      home: "Home",
      categories: "Categories",
      suppliers: "Suppliers",
      about: "About",
      contact: "Contact",
      login: "Login",
      signup: "Sign Up",
    },
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      submit: "Submit",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      view: "View",
      search: "Search",
      filter: "Filter",
      noResults: "No results found",
    },
  },

  // Hindi (India - 85% traffic)
  hi: {
    hero: {
      headline: "भारत से गुणवत्तापूर्ण उत्पाद प्राप्त करें",
      description: "सुगम आयात के लिए सत्यापित भारतीय आपूर्तिकर्ताओं से जुड़ें। प्रतिस्पर्धी मूल्य, गुणवत्ता आश्वासन और एकीकृत लॉजिस्टिक्स।",
      getStarted: "आज ही शुरू करें",
      connectWithSuppliers: "आपूर्तिकर्ताओं से जुड़ें",
      bySubmitting: "सबमिट करके, आप हमारी सेवा की शर्तों और गोपनीयता नीति से सहमत हैं",
    },
    form: {
      fullName: "पूरा नाम",
      businessEmail: "व्यावसायिक ईमेल",
      phone: "फोन (देश कोड के साथ)",
      companyName: "कंपनी का नाम",
      monthlyVolume: "मासिक सोर्सिंग वॉल्यूम",
      selectVolume: "वॉल्यूम रेंज चुनें",
      interestedCategories: "रुचि की श्रेणियाँ",
      under10k: "₹8,00,000 से कम",
      range10k50k: "₹8,00,000 - ₹40,00,000",
      range50k100k: "₹40,00,000 - ₹80,00,000",
      range100k500k: "₹80,00,000 - ₹4,00,00,000",
      over500k: "₹4,00,00,000 से अधिक",
    },
    sections: {
      topCategories: "शीर्ष निर्यात श्रेणियाँ",
      whySource: "ProcureSaathi के माध्यम से भारत से क्यों खरीदें?",
      verifiedSuppliers: "सत्यापित आपूर्तिकर्ता",
      verifiedSuppliersDesc: "सभी आपूर्तिकर्ता उचित निर्यात लाइसेंस, प्रमाणपत्र और ट्रैक रिकॉर्ड के साथ सत्यापित हैं",
      integratedLogistics: "एकीकृत लॉजिस्टिक्स",
      integratedLogisticsDesc: "कारखाने से आपके दरवाजे तक एंड-टू-एंड शिपिंग समाधान",
      realTimeTracking: "रियल-टाइम ट्रैकिंग",
      realTimeTrackingDesc: "डिस्पैच से डिलीवरी तक अपने शिपमेंट को रियल-टाइम में ट्रैक करें",
      readyToStart: "भारत से सोर्सिंग शुरू करने के लिए तैयार हैं?",
      joinThousands: "हजारों आयातकों से जुड़ें जो खरीद लागत पर 25-40% बचाते हैं",
      createFreeAccount: "मुफ्त खाता बनाएं",
      browseCategories: "श्रेणियाँ ब्राउज़ करें",
    },
    stats: {
      tradeVolume: "व्यापार मात्रा",
      activeSuppliers: "सक्रिय आपूर्तिकर्ता",
      avgSavings: "औसत बचत",
      avgDelivery: "औसत डिलीवरी समय",
      countriesServed: "सेवित देश",
      qualityCompliance: "गुणवत्ता अनुपालन",
    },
    nav: {
      home: "होम",
      categories: "श्रेणियाँ",
      suppliers: "आपूर्तिकर्ता",
      about: "हमारे बारे में",
      contact: "संपर्क",
      login: "लॉगिन",
      signup: "साइन अप",
    },
    common: {
      loading: "लोड हो रहा है...",
      error: "त्रुटि",
      success: "सफलता",
      submit: "सबमिट करें",
      cancel: "रद्द करें",
      save: "सेव करें",
      delete: "हटाएं",
      edit: "संपादित करें",
      view: "देखें",
      search: "खोजें",
      filter: "फ़िल्टर",
      noResults: "कोई परिणाम नहीं मिला",
    },
  },

  // French (France 2%, Canada)
  fr: {
    hero: {
      headline: "Approvisionnez-vous en produits de qualité depuis l'Inde",
      description: "Connectez-vous avec des fournisseurs indiens vérifiés pour une importation fluide. Prix compétitifs, assurance qualité et logistique intégrée.",
      getStarted: "Commencer aujourd'hui",
      connectWithSuppliers: "Connecter avec les fournisseurs",
      bySubmitting: "En soumettant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité",
    },
    form: {
      fullName: "Nom complet",
      businessEmail: "Email professionnel",
      phone: "Téléphone (avec indicatif pays)",
      companyName: "Nom de l'entreprise",
      monthlyVolume: "Volume d'approvisionnement mensuel",
      selectVolume: "Sélectionner la plage de volume",
      interestedCategories: "Catégories d'intérêt",
      under10k: "Moins de 10 000 €",
      range10k50k: "10 000 € - 50 000 €",
      range50k100k: "50 000 € - 100 000 €",
      range100k500k: "100 000 € - 500 000 €",
      over500k: "Plus de 500 000 €",
    },
    sections: {
      topCategories: "Principales catégories d'exportation vers",
      whySource: "Pourquoi s'approvisionner depuis l'Inde via ProcureSaathi?",
      verifiedSuppliers: "Fournisseurs vérifiés",
      verifiedSuppliersDesc: "Tous les fournisseurs sont vérifiés avec des licences d'exportation, certifications et références appropriées",
      integratedLogistics: "Logistique intégrée",
      integratedLogisticsDesc: "Solutions d'expédition de bout en bout de l'usine à votre porte avec support douanier",
      realTimeTracking: "Suivi en temps réel",
      realTimeTrackingDesc: "Suivez vos expéditions en temps réel de l'envoi à la livraison au port de destination",
      readyToStart: "Prêt à commencer l'approvisionnement depuis l'Inde?",
      joinThousands: "Rejoignez des milliers d'importateurs qui économisent 25-40% sur les coûts d'approvisionnement",
      createFreeAccount: "Créer un compte gratuit",
      browseCategories: "Parcourir les catégories",
    },
    stats: {
      tradeVolume: "Volume commercial",
      activeSuppliers: "Fournisseurs actifs",
      avgSavings: "Économies moy.",
      avgDelivery: "Délai de livraison moy.",
      countriesServed: "Pays desservis",
      qualityCompliance: "Conformité qualité",
    },
    nav: {
      home: "Accueil",
      categories: "Catégories",
      suppliers: "Fournisseurs",
      about: "À propos",
      contact: "Contact",
      login: "Connexion",
      signup: "Inscription",
    },
    common: {
      loading: "Chargement...",
      error: "Erreur",
      success: "Succès",
      submit: "Soumettre",
      cancel: "Annuler",
      save: "Enregistrer",
      delete: "Supprimer",
      edit: "Modifier",
      view: "Voir",
      search: "Rechercher",
      filter: "Filtrer",
      noResults: "Aucun résultat trouvé",
    },
  },

  // Dutch (Netherlands 1%)
  nl: {
    hero: {
      headline: "Kwaliteitsproducten uit India",
      description: "Verbind met geverifieerde Indiase leveranciers voor naadloze import. Concurrerende prijzen, kwaliteitsborging en geïntegreerde logistiek.",
      getStarted: "Begin vandaag",
      connectWithSuppliers: "Verbind met leveranciers",
      bySubmitting: "Door in te dienen gaat u akkoord met onze servicevoorwaarden en privacybeleid",
    },
    form: {
      fullName: "Volledige naam",
      businessEmail: "Zakelijke e-mail",
      phone: "Telefoon (met landcode)",
      companyName: "Bedrijfsnaam",
      monthlyVolume: "Maandelijks inkoopvolume",
      selectVolume: "Selecteer volumebereik",
      interestedCategories: "Geïnteresseerde categorieën",
      under10k: "Onder €10.000",
      range10k50k: "€10.000 - €50.000",
      range50k100k: "€50.000 - €100.000",
      range100k500k: "€100.000 - €500.000",
      over500k: "Boven €500.000",
    },
    sections: {
      topCategories: "Top exportcategorieën naar",
      whySource: "Waarom via ProcureSaathi uit India inkopen?",
      verifiedSuppliers: "Geverifieerde leveranciers",
      verifiedSuppliersDesc: "Alle leveranciers zijn geverifieerd met juiste exportlicenties, certificeringen en trackrecords",
      integratedLogistics: "Geïntegreerde logistiek",
      integratedLogisticsDesc: "End-to-end verzendoplossingen van fabriek tot uw deur met douaneondersteuning",
      realTimeTracking: "Realtime tracking",
      realTimeTrackingDesc: "Volg uw zendingen in realtime van verzending tot levering in de bestemmingshaven",
      readyToStart: "Klaar om te beginnen met inkopen uit India?",
      joinThousands: "Sluit u aan bij duizenden importeurs die 25-40% besparen op inkoopkosten",
      createFreeAccount: "Gratis account aanmaken",
      browseCategories: "Categorieën bekijken",
    },
    stats: {
      tradeVolume: "Handelsvolume",
      activeSuppliers: "Actieve leveranciers",
      avgSavings: "Gem. besparing",
      avgDelivery: "Gem. levertijd",
      countriesServed: "Bediende landen",
      qualityCompliance: "Kwaliteitsconformiteit",
    },
    nav: {
      home: "Home",
      categories: "Categorieën",
      suppliers: "Leveranciers",
      about: "Over ons",
      contact: "Contact",
      login: "Inloggen",
      signup: "Registreren",
    },
    common: {
      loading: "Laden...",
      error: "Fout",
      success: "Succes",
      submit: "Verzenden",
      cancel: "Annuleren",
      save: "Opslaan",
      delete: "Verwijderen",
      edit: "Bewerken",
      view: "Bekijken",
      search: "Zoeken",
      filter: "Filteren",
      noResults: "Geen resultaten gevonden",
    },
  },

  // Romanian (Romania 1%)
  ro: {
    hero: {
      headline: "Achiziționați produse de calitate din India",
      description: "Conectați-vă cu furnizori indieni verificați pentru import fără probleme. Prețuri competitive, asigurarea calității și logistică integrată.",
      getStarted: "Începeți astăzi",
      connectWithSuppliers: "Conectați-vă cu furnizorii",
      bySubmitting: "Prin trimitere, sunteți de acord cu termenii serviciului și politica de confidențialitate",
    },
    form: {
      fullName: "Nume complet",
      businessEmail: "Email de afaceri",
      phone: "Telefon (cu codul țării)",
      companyName: "Numele companiei",
      monthlyVolume: "Volumul lunar de achiziții",
      selectVolume: "Selectați intervalul de volum",
      interestedCategories: "Categorii de interes",
      under10k: "Sub 10.000 €",
      range10k50k: "10.000 € - 50.000 €",
      range50k100k: "50.000 € - 100.000 €",
      range100k500k: "100.000 € - 500.000 €",
      over500k: "Peste 500.000 €",
    },
    sections: {
      topCategories: "Categorii principale de export către",
      whySource: "De ce să achiziționați din India prin ProcureSaathi?",
      verifiedSuppliers: "Furnizori verificați",
      verifiedSuppliersDesc: "Toți furnizorii sunt verificați cu licențe de export, certificări și referințe corespunzătoare",
      integratedLogistics: "Logistică integrată",
      integratedLogisticsDesc: "Soluții de expediere de la capăt la capăt de la fabrică la ușa dvs. cu suport vamal",
      realTimeTracking: "Urmărire în timp real",
      realTimeTrackingDesc: "Urmăriți expedițiile în timp real de la expediere până la livrare în portul de destinație",
      readyToStart: "Sunteți gata să începeți achizițiile din India?",
      joinThousands: "Alăturați-vă miilor de importatori care economisesc 25-40% din costurile de achiziție",
      createFreeAccount: "Creați un cont gratuit",
      browseCategories: "Răsfoiți categoriile",
    },
    stats: {
      tradeVolume: "Volumul comerțului",
      activeSuppliers: "Furnizori activi",
      avgSavings: "Economii medii",
      avgDelivery: "Timp mediu de livrare",
      countriesServed: "Țări deservite",
      qualityCompliance: "Conformitate calitate",
    },
    nav: {
      home: "Acasă",
      categories: "Categorii",
      suppliers: "Furnizori",
      about: "Despre noi",
      contact: "Contact",
      login: "Autentificare",
      signup: "Înregistrare",
    },
    common: {
      loading: "Se încarcă...",
      error: "Eroare",
      success: "Succes",
      submit: "Trimite",
      cancel: "Anulează",
      save: "Salvează",
      delete: "Șterge",
      edit: "Editează",
      view: "Vizualizare",
      search: "Caută",
      filter: "Filtrează",
      noResults: "Nu s-au găsit rezultate",
    },
  },

  // Spanish (Spain 1%)
  es: {
    hero: {
      headline: "Obtenga productos de calidad desde India",
      description: "Conéctese con proveedores indios verificados para una importación sin problemas. Precios competitivos, garantía de calidad y logística integrada.",
      getStarted: "Comience hoy",
      connectWithSuppliers: "Conectar con proveedores",
      bySubmitting: "Al enviar, acepta nuestros términos de servicio y política de privacidad",
    },
    form: {
      fullName: "Nombre completo",
      businessEmail: "Correo electrónico empresarial",
      phone: "Teléfono (con código de país)",
      companyName: "Nombre de la empresa",
      monthlyVolume: "Volumen de abastecimiento mensual",
      selectVolume: "Seleccionar rango de volumen",
      interestedCategories: "Categorías de interés",
      under10k: "Menos de 10.000 €",
      range10k50k: "10.000 € - 50.000 €",
      range50k100k: "50.000 € - 100.000 €",
      range100k500k: "100.000 € - 500.000 €",
      over500k: "Más de 500.000 €",
    },
    sections: {
      topCategories: "Principales categorías de exportación a",
      whySource: "¿Por qué abastecerse desde India a través de ProcureSaathi?",
      verifiedSuppliers: "Proveedores verificados",
      verifiedSuppliersDesc: "Todos los proveedores están verificados con licencias de exportación, certificaciones y referencias adecuadas",
      integratedLogistics: "Logística integrada",
      integratedLogisticsDesc: "Soluciones de envío de extremo a extremo desde la fábrica hasta su puerta con soporte aduanero",
      realTimeTracking: "Seguimiento en tiempo real",
      realTimeTrackingDesc: "Rastree sus envíos en tiempo real desde el despacho hasta la entrega en el puerto de destino",
      readyToStart: "¿Listo para comenzar a abastecerse desde India?",
      joinThousands: "Únase a miles de importadores que ahorran 25-40% en costos de adquisición",
      createFreeAccount: "Crear cuenta gratuita",
      browseCategories: "Explorar categorías",
    },
    stats: {
      tradeVolume: "Volumen comercial",
      activeSuppliers: "Proveedores activos",
      avgSavings: "Ahorro promedio",
      avgDelivery: "Tiempo de entrega prom.",
      countriesServed: "Países atendidos",
      qualityCompliance: "Cumplimiento de calidad",
    },
    nav: {
      home: "Inicio",
      categories: "Categorías",
      suppliers: "Proveedores",
      about: "Acerca de",
      contact: "Contacto",
      login: "Iniciar sesión",
      signup: "Registrarse",
    },
    common: {
      loading: "Cargando...",
      error: "Error",
      success: "Éxito",
      submit: "Enviar",
      cancel: "Cancelar",
      save: "Guardar",
      delete: "Eliminar",
      edit: "Editar",
      view: "Ver",
      search: "Buscar",
      filter: "Filtrar",
      noResults: "No se encontraron resultados",
    },
  },

  // German (Germany)
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
    nav: {
      home: "Startseite",
      categories: "Kategorien",
      suppliers: "Lieferanten",
      about: "Über uns",
      contact: "Kontakt",
      login: "Anmelden",
      signup: "Registrieren",
    },
    common: {
      loading: "Wird geladen...",
      error: "Fehler",
      success: "Erfolg",
      submit: "Absenden",
      cancel: "Abbrechen",
      save: "Speichern",
      delete: "Löschen",
      edit: "Bearbeiten",
      view: "Ansehen",
      search: "Suchen",
      filter: "Filtern",
      noResults: "Keine Ergebnisse gefunden",
    },
  },

  // Arabic (UAE)
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
    nav: {
      home: "الرئيسية",
      categories: "الفئات",
      suppliers: "الموردون",
      about: "من نحن",
      contact: "اتصل بنا",
      login: "تسجيل الدخول",
      signup: "إنشاء حساب",
    },
    common: {
      loading: "جاري التحميل...",
      error: "خطأ",
      success: "نجاح",
      submit: "إرسال",
      cancel: "إلغاء",
      save: "حفظ",
      delete: "حذف",
      edit: "تعديل",
      view: "عرض",
      search: "بحث",
      filter: "تصفية",
      noResults: "لم يتم العثور على نتائج",
    },
  },
};

// Get default language for a country based on traffic data
export const getDefaultLanguage = (country: string): Language => {
  const countryLanguageMap: Record<string, Language> = {
    india: 'en',
    usa: 'en',
    uk: 'en',
    france: 'fr',
    netherlands: 'nl',
    romania: 'ro',
    spain: 'es',
    canada: 'en',
    germany: 'de',
    uae: 'ar',
  };
  return countryLanguageMap[country.toLowerCase()] || 'en';
};

// RTL languages
export const isRTL = (lang: Language): boolean => {
  return lang === 'ar';
};

// Get language name in its native form
export const getLanguageName = (lang: Language): string => {
  const names: Record<Language, string> = {
    en: 'English',
    hi: 'हिन्दी',
    fr: 'Français',
    nl: 'Nederlands',
    ro: 'Română',
    es: 'Español',
    de: 'Deutsch',
    ar: 'العربية',
  };
  return names[lang];
};

// Get all supported languages
export const getSupportedLanguages = (): Language[] => {
  return ['en', 'hi', 'fr', 'nl', 'ro', 'es', 'de', 'ar'];
};
