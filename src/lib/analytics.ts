// SEM & Analytics Tracking Utilities

// UTM Parameter Storage
interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string; // Google Ads Click ID
  fbclid?: string; // Facebook Click ID
  msclkid?: string; // Microsoft Ads Click ID
}

const UTM_STORAGE_KEY = 'ps_utm_params';
const UTM_EXPIRY_DAYS = 30;

// Parse and store UTM parameters from URL
export const captureUTMParams = (): UTMParams => {
  const params = new URLSearchParams(window.location.search);
  const utmParams: UTMParams = {};

  const paramKeys: (keyof UTMParams)[] = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'gclid', 'fbclid', 'msclkid'
  ];

  paramKeys.forEach(key => {
    const value = params.get(key);
    if (value) {
      utmParams[key] = value;
    }
  });

  // Only store if we have UTM params
  if (Object.keys(utmParams).length > 0) {
    const storageData = {
      params: utmParams,
      timestamp: Date.now(),
      landingPage: window.location.pathname,
    };
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(storageData));
  }

  return utmParams;
};

// Get stored UTM parameters
export const getStoredUTMParams = (): UTMParams | null => {
  try {
    const stored = localStorage.getItem(UTM_STORAGE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored);
    const expiryTime = UTM_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    // Check if expired
    if (Date.now() - data.timestamp > expiryTime) {
      localStorage.removeItem(UTM_STORAGE_KEY);
      return null;
    }

    return data.params;
  } catch {
    return null;
  }
};

// Get landing page from stored UTM data
export const getStoredLandingPage = (): string | null => {
  try {
    const stored = localStorage.getItem(UTM_STORAGE_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored);
    return data.landingPage || null;
  } catch {
    return null;
  }
};

// Clear UTM params (call after conversion)
export const clearUTMParams = (): void => {
  localStorage.removeItem(UTM_STORAGE_KEY);
};

// Google Ads Conversion Tracking
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// Track Google Ads conversion
export const trackGoogleAdsConversion = (
  conversionId: string,
  conversionLabel: string,
  value?: number,
  currency?: string
): void => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'conversion', {
      send_to: `${conversionId}/${conversionLabel}`,
      value: value,
      currency: currency || 'INR',
    });
  }
};

// Track custom event (for GA4)
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, unknown>
): void => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
  }
  
  // Also push to dataLayer for GTM
  if (window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...eventParams,
    });
  }
};

// Pre-defined conversion events
export const trackSignupStart = (role: string): void => {
  const utmParams = getStoredUTMParams();
  trackEvent('signup_start', {
    user_role: role,
    ...utmParams,
  });
};

export const trackSignupComplete = (role: string, userId?: string): void => {
  const utmParams = getStoredUTMParams();
  const landingPage = getStoredLandingPage();
  
  trackEvent('signup_complete', {
    user_role: role,
    user_id: userId,
    landing_page: landingPage,
    ...utmParams,
  });

  // Track as Google Ads conversion if configured
  // Replace with your actual conversion ID and label
  // trackGoogleAdsConversion('AW-XXXXXXXXXX', 'signup_complete');
};

export const trackDemoRequest = (companyName?: string): void => {
  const utmParams = getStoredUTMParams();
  trackEvent('demo_request', {
    company_name: companyName,
    ...utmParams,
  });
};

export const trackRequirementPost = (category: string, value?: number): void => {
  const utmParams = getStoredUTMParams();
  trackEvent('requirement_posted', {
    category: category,
    estimated_value: value,
    ...utmParams,
  });
};

export const trackBidSubmit = (requirementId: string, bidAmount: number): void => {
  const utmParams = getStoredUTMParams();
  trackEvent('bid_submitted', {
    requirement_id: requirementId,
    bid_amount: bidAmount,
    currency: 'INR',
    ...utmParams,
  });
};

export const trackBidAccepted = (bidId: string, transactionValue: number): void => {
  const utmParams = getStoredUTMParams();
  trackEvent('bid_accepted', {
    bid_id: bidId,
    transaction_value: transactionValue,
    currency: 'INR',
    ...utmParams,
  });
  
  // This is a high-value conversion
  // trackGoogleAdsConversion('AW-XXXXXXXXXX', 'transaction_complete', transactionValue, 'INR');
};

export const trackCategoryView = (categoryName: string): void => {
  trackEvent('view_category', {
    category_name: categoryName,
  });
};

export const trackProductView = (productId: string, productName: string, category: string): void => {
  trackEvent('view_item', {
    item_id: productId,
    item_name: productName,
    item_category: category,
  });
};

export const trackNewsletterSignup = (email: string): void => {
  const utmParams = getStoredUTMParams();
  trackEvent('newsletter_signup', {
    method: 'email',
    ...utmParams,
  });
};

export const trackContactFormSubmit = (): void => {
  const utmParams = getStoredUTMParams();
  trackEvent('contact_form_submit', {
    ...utmParams,
  });
};

// Page view with enhanced data
export const trackPageView = (pagePath: string, pageTitle: string): void => {
  const utmParams = getStoredUTMParams();
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle,
    ...utmParams,
  });
};

// Ecommerce-like events for B2B
export const trackAddToCart = (productId: string, productName: string, value: number): void => {
  trackEvent('add_to_cart', {
    items: [{
      item_id: productId,
      item_name: productName,
      price: value,
      currency: 'INR',
    }],
  });
};

export const trackBeginCheckout = (items: Array<{ id: string; name: string; value: number }>): void => {
  const utmParams = getStoredUTMParams();
  trackEvent('begin_checkout', {
    items: items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      price: item.value,
      currency: 'INR',
    })),
    ...utmParams,
  });
};

export const trackPurchase = (
  transactionId: string,
  value: number,
  items: Array<{ id: string; name: string; value: number }>
): void => {
  const utmParams = getStoredUTMParams();
  trackEvent('purchase', {
    transaction_id: transactionId,
    value: value,
    currency: 'INR',
    items: items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      price: item.value,
      currency: 'INR',
    })),
    ...utmParams,
  });
};

// Get attribution data for storing with conversions
export const getAttributionData = (): Record<string, unknown> => {
  const utmParams = getStoredUTMParams();
  const landingPage = getStoredLandingPage();
  
  return {
    ...utmParams,
    landing_page: landingPage,
    referrer: document.referrer || null,
    user_agent: navigator.userAgent,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    timestamp: new Date().toISOString(),
  };
};
