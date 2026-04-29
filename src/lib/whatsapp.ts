/**
 * Central WhatsApp configuration for ProcureSaathi sales channel.
 * Single source of truth — change number/messages here only.
 */

export const WHATSAPP_SALES_NUMBER = '918368127357'; // +91 83681 27357 (no '+' for wa.me)

export const WHATSAPP_DEFAULT_MESSAGE =
  'Hi, I want a better price for [material] at [location]. Quantity: [ ].';

export const WHATSAPP_CONCIERGE_MESSAGE =
  'Hi, I want ProcureSaathi to handle my procurement end-to-end. Material: [ ]. Quantity: [ ]. Delivery location: [ ].';

export function buildWhatsAppLink(message: string = WHATSAPP_DEFAULT_MESSAGE): string {
  return `https://wa.me/${WHATSAPP_SALES_NUMBER}?text=${encodeURIComponent(message)}`;
}
