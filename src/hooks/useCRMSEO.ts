import { useEffect } from 'react';

interface CRMSEOProps {
  pageType: 'dashboard' | 'leads' | 'activities';
  companyName?: string;
}

export const useCRMSEO = ({ pageType, companyName }: CRMSEOProps) => {
  useEffect(() => {
    // Inject SoftwareApplication schema for CRM
    const schemaId = 'crm-software-schema';
    let script = document.getElementById(schemaId) as HTMLScriptElement;
    
    if (!script) {
      script = document.createElement('script');
      script.id = schemaId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    const softwareSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Free CRM & Tax Invoice Generator - ProcureSaathi',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'CRM Software, Invoice Generator, B2B Tools',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
        description: 'Free CRM software and GST tax invoice generator for B2B suppliers. Manage leads, create invoices, and track sales pipeline at no cost.'
      },
      featureList: [
        'Free CRM Software',
        'GST Tax Invoice Generator',
        'Proforma Invoice Maker',
        'Lead Management System',
        'Activity Tracking',
        'Follow-up Reminders',
        'Purchase Order Management',
        'Debit Credit Note Generator',
        'Document Export to Excel',
        'Pipeline Value Analytics',
        'Supplier Contact Management'
      ],
      screenshot: 'https://www.procuresaathi.com/og-image.png',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '250',
        bestRating: '5',
        worstRating: '1'
      }
    };

    script.textContent = JSON.stringify(softwareSchema);

    // Inject HowTo schema for CRM usage
    const howToId = 'crm-howto-schema';
    let howToScript = document.getElementById(howToId) as HTMLScriptElement;
    
    if (!howToScript) {
      howToScript = document.createElement('script');
      howToScript.id = howToId;
      howToScript.type = 'application/ld+json';
      document.head.appendChild(howToScript);
    }

    const howToSchema = {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to Use Free CRM & Tax Invoice Generator',
      description: 'Step-by-step guide to using the free CRM software and GST tax invoice generator for B2B businesses',
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Add a New Lead',
          text: 'Click "Add Lead" and enter contact details, company name, and expected deal value in the free CRM'
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'Track Activities',
          text: 'Log calls, emails, and meetings to maintain a complete interaction history with leads'
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Set Follow-ups',
          text: 'Schedule follow-up dates to receive automated reminders for lead nurturing'
        },
        {
          '@type': 'HowToStep',
          position: 4,
          name: 'Update Lead Status',
          text: 'Move leads through your sales pipeline: New → Contacted → Qualified → Proposal → Won'
        },
        {
          '@type': 'HowToStep',
          position: 5,
          name: 'Generate GST Tax Invoice',
          text: 'Create GST-compliant tax invoices with HSN codes, GSTIN, and automatic tax calculation'
        },
        {
          '@type': 'HowToStep',
          position: 6,
          name: 'Create Proforma Invoice',
          text: 'Generate proforma invoices for quotations before finalizing deals'
        },
        {
          '@type': 'HowToStep',
          position: 7,
          name: 'Manage Purchase Orders',
          text: 'Create and track purchase orders with vendor details and delivery schedules'
        }
      ]
    };

    howToScript.textContent = JSON.stringify(howToSchema);

    return () => {
      // Cleanup on unmount
      const existingScript = document.getElementById(schemaId);
      const existingHowTo = document.getElementById(howToId);
      if (existingScript) existingScript.remove();
      if (existingHowTo) existingHowTo.remove();
    };
  }, [pageType, companyName]);
};

// FAQ Schema for Free CRM & Tax Invoice Generator
export const getCRMFAQSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is the CRM and Tax Invoice Generator really free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, the CRM software and GST tax invoice generator are completely free for all registered suppliers and logistics partners on ProcureSaathi. No hidden charges, no premium tier required for basic features.'
      }
    },
    {
      '@type': 'Question',
      name: 'What features does the free CRM include?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The free CRM includes: Lead pipeline management, Activity logging for calls/emails/meetings, Automated follow-up reminders, Contact management, Pipeline value analytics, and complete document generation suite.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I generate GST tax invoices for free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, you can create GST-compliant tax invoices with HSN codes, GSTIN validation, and automatic tax calculation. Export invoices to Excel or PDF for your records.'
      }
    },
    {
      '@type': 'Question',
      name: 'What types of invoices can I create?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can create Proforma Invoices, GST Tax Invoices, Purchase Orders, Debit Notes, and Credit Notes. All documents include your company logo and are GST-compliant.'
      }
    },
    {
      '@type': 'Question',
      name: 'How do I get 1 year FREE premium subscription?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The first 100 suppliers and logistics partners to sign up get 1 year FREE premium subscription worth ₹24,950. This includes unlimited bids, free CRM, tax invoice generator, early adopter badge, and priority support.'
      }
    }
  ]
});
