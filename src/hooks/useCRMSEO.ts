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
      name: 'ProcureSaathi CRM',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Customer Relationship Management',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
        description: 'Free CRM for suppliers to manage leads, invoices, and purchase orders'
      },
      featureList: [
        'Lead Management',
        'Activity Tracking',
        'Follow-up Reminders',
        'Proforma Invoice Generation',
        'Tax Invoice Generation',
        'Purchase Order Management',
        'Pipeline Analytics'
      ],
      screenshot: 'https://procuresaathi.com/og-image.png',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '150',
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
      name: 'How to Manage Leads with ProcureSaathi CRM',
      description: 'Step-by-step guide to using the free CRM for B2B lead management',
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Add a New Lead',
          text: 'Click "Add Lead" and enter contact details, company name, and expected deal value'
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'Track Activities',
          text: 'Log calls, emails, and meetings to maintain a complete interaction history'
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Set Follow-ups',
          text: 'Schedule follow-up dates to receive automated reminders'
        },
        {
          '@type': 'HowToStep',
          position: 4,
          name: 'Update Lead Status',
          text: 'Move leads through your pipeline: New → Contacted → Qualified → Proposal → Won'
        },
        {
          '@type': 'HowToStep',
          position: 5,
          name: 'Generate Documents',
          text: 'Create proforma invoices, tax invoices, and purchase orders directly from CRM'
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

// FAQ Schema for CRM
export const getCRMFAQSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is ProcureSaathi CRM free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, the CRM is completely free for all registered suppliers on ProcureSaathi. It includes lead management, activity tracking, and document generation features at no cost.'
      }
    },
    {
      '@type': 'Question',
      name: 'What features does the CRM include?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ProcureSaathi CRM includes: Lead pipeline management with status tracking, Activity logging for calls/emails/meetings, Automated follow-up reminders, Proforma and Tax invoice generation, Purchase order management, and Pipeline value analytics.'
      }
    },
    {
      '@type': 'Question',
      name: 'How do follow-up reminders work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'When you set a follow-up date for a lead, the system automatically sends you a notification on that date. Overdue follow-ups are also flagged so you never miss an important touchpoint.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I generate invoices from the CRM?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, you can create both Proforma Invoices and GST Tax Invoices directly from the CRM. Simply fill in the buyer details and line items, and the system calculates taxes automatically.'
      }
    }
  ]
});
