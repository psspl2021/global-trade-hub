/**
 * Demo Mode — Mock Data (NO real DB reads/writes)
 * Admin-only simulated procurement scenarios
 */

export const DEMO_BUYERS = [
  { id: 'demo-buyer-1', name: 'Rajesh Kumar', company: 'Kumar Industries Pvt Ltd', city: 'Mumbai', role: 'buyer_purchaser' },
];

export const DEMO_SUPPLIERS = [
  { id: 'demo-sup-1', name: 'Tata Steel Distributors', city: 'Jamshedpur', rating: 94, badge: '🟢 Reliable' },
  { id: 'demo-sup-2', name: 'JSW Steel Trading', city: 'Bellary', rating: 87, badge: '🟢 Reliable' },
  { id: 'demo-sup-3', name: 'Essar Metals', city: 'Hazira', rating: 72, badge: '🟡 Moderate' },
];

export const DEMO_TRANSPORTER = {
  id: 'demo-trans-1',
  name: 'Global Freight Logistics',
  vehicle: 'MH12AB1234',
  driver: 'Suresh Patil',
  driverContact: '+91 98765 43210',
};

export interface DemoBid {
  supplierId: string;
  supplierName: string;
  price: number;
  badge: string;
}

export const DEMO_AUCTION = {
  id: 'demo-auction-1',
  title: 'TMT Steel Bars — 500 MT',
  category: 'Metals — Ferrous',
  quantity: 500,
  unit: 'MT',
  currency: 'INR',
  status: 'live' as const,
  createdAt: new Date(Date.now() - 3600000).toISOString(),
  endsAt: new Date(Date.now() + 7200000).toISOString(),
  initialBids: [
    { supplierId: 'demo-sup-1', supplierName: 'Tata Steel Distributors', price: 52000, badge: '🟢' },
    { supplierId: 'demo-sup-2', supplierName: 'JSW Steel Trading', price: 50500, badge: '🟢' },
    { supplierId: 'demo-sup-3', supplierName: 'Essar Metals', price: 49800, badge: '🟡' },
  ] as DemoBid[],
};

export type DemoPOStatus = 'draft' | 'sent' | 'accepted' | 'in_transit' | 'delivered' | 'payment_done' | 'closed';

export const DEMO_PO = {
  id: 'demo-po-1',
  poNumber: 'PO-DEMO-001',
  title: 'TMT Steel Bars — 500 MT',
  supplierName: 'Essar Metals',
  totalAmount: 24900000,
  currency: 'INR',
  status: 'draft' as DemoPOStatus,
  vehicleNumber: 'MH12AB1234',
  transporterName: 'Global Freight Logistics',
  driverContact: '+91 98765 43210',
  transportSource: 'supplier' as const,
};

export const DEMO_TIMELINE_STEPS: { status: DemoPOStatus; label: string; delayMs: number }[] = [
  { status: 'sent', label: 'PO Sent to Supplier', delayMs: 2000 },
  { status: 'accepted', label: 'Supplier Accepted', delayMs: 3000 },
  { status: 'in_transit', label: 'Shipment In Transit', delayMs: 4000 },
  { status: 'delivered', label: 'Goods Delivered', delayMs: 3500 },
  { status: 'payment_done', label: 'Payment Confirmed', delayMs: 3000 },
  { status: 'closed', label: 'Order Closed', delayMs: 2000 },
];

export const DELIVERY_DELAY_REASONS = [
  'Vehicle breakdown',
  'Route delay',
  'Weather issue',
  'Supplier dispatch delay',
  'Customs issue',
  'Other',
];
