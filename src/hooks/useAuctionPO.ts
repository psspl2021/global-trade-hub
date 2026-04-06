/**
 * useAuctionPO — Purchase Order generation from reverse auction awards
 * Uses existing purchase_orders + po_items tables
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface POLineItem {
  item_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate: number; // 0, 5, 12, 18 or custom
}

export function calculatePOTotals(items: POLineItem[], freight: number) {
  let subtotal = 0;
  let taxTotal = 0;

  for (const item of items) {
    const lineTotal = item.unit_price * item.quantity;
    const lineTax = (item.tax_rate / 100) * lineTotal;
    subtotal += lineTotal;
    taxTotal += lineTax;
  }

  const grandTotal = subtotal + taxTotal + freight;
  return { subtotal, taxTotal, grandTotal };
}

export function generatePONotes(items: POLineItem[], auctionTitle: string) {
  return `Purchase Order generated from reverse auction: "${auctionTitle}". Includes ${items.length} SKU(s). All materials must meet agreed specifications. Delivery timelines and quality compliance are mandatory. Freight charges are agreed separately.`;
}

export function useAuctionPO() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePO = async ({
    auctionId,
    auctionTitle,
    supplierId,
    supplierName,
    items,
    freight,
    currency = 'INR',
  }: {
    auctionId: string;
    auctionTitle: string;
    supplierId: string;
    supplierName: string;
    items: POLineItem[];
    freight: number;
    currency?: string;
  }) => {
    if (!user) {
      toast.error('You must be logged in');
      return null;
    }

    setIsGenerating(true);
    try {
      const { subtotal, taxTotal, grandTotal } = calculatePOTotals(items, freight);
      const poNumber = `PO-RA-${Date.now()}`;
      const notes = generatePONotes(items, auctionTitle);

      // Insert PO into purchase_orders table
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          po_number: poNumber,
          supplier_id: supplierId,
          vendor_name: supplierName,
          subtotal,
          tax_amount: taxTotal,
          total_amount: grandTotal,
          currency,
          notes,
          status: 'draft' as any,
          po_status: 'PENDING',
          po_value: grandTotal,
          created_by: user.id,
        })
        .select()
        .single();

      if (poError) throw poError;

      // Insert PO line items
      const poItems = items.map(item => ({
        po_id: po.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        tax_amount: (item.tax_rate / 100) * item.unit_price * item.quantity,
        total: item.unit_price * item.quantity + (item.tax_rate / 100) * item.unit_price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('po_items')
        .insert(poItems);

      if (itemsError) throw itemsError;

      toast.success('Purchase Order created successfully');
      return po;
    } catch (err: any) {
      console.error('PO generation error:', err);
      toast.error(err.message || 'Failed to create Purchase Order');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generatePO, isGenerating };
}
