/**
 * PROCURESAATHI PRICING CALCULATOR — Single Source of Truth
 * 
 * This is the ONLY place where pricing math exists.
 * All frontend components MUST use this calculator.
 * 
 * RULES:
 * - Pricing flows from supplier_unit_price (per unit)
 * - NO derived pricing (rate = total / qty is FORBIDDEN)
 * - Transport and platform fees are additive
 * - GST is applied on final buyer subtotal
 */

export type TradeType = 'domestic_india' | 'import' | 'export';

export interface BidItemInput {
  supplierUnitPrice: number; // PER UNIT - from bid_items.supplier_unit_price
  quantity: number;
}

export interface PricingOptions {
  transportPerUnit?: number;
  tradeType: TradeType;
  gstRate?: number; // default 18% (0.18)
}

export interface CalculatedItem {
  supplierUnitPrice: number;
  buyerUnitPrice: number;
  buyerLineTotal: number;
  quantity: number;
}

export interface CalculatedBid {
  items: CalculatedItem[];
  subTotal: number;
  gstAmount: number;
  grandTotal: number;
  platformFeeRate: number;
  platformFeeAmount: number; // Total platform fee collected
}

export class PricingCalculator {
  /**
   * FLOAT-SAFE ROUNDING — Prevents 1272.6299999998 bugs
   * All money calculations MUST use this method
   */
  private static round(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  /**
   * Get platform fee rate based on trade type
   * Domestic India: 0.5%
   * Import/Export: 1%
   */
  static getPlatformFee(tradeType: TradeType): number {
    return tradeType === 'domestic_india' ? 0.005 : 0.01;
  }

  /**
   * Calculate buyer pricing from supplier bid items
   * 
   * Formula per item:
   * 1. supplierRate = supplier_unit_price + transport_per_unit
   * 2. buyerUnitPrice = supplierRate × (1 + platformFee)
   * 3. buyerLineTotal = buyerUnitPrice × quantity
   * 
   * Totals:
   * - subTotal = sum of all buyerLineTotals
   * - gstAmount = subTotal × gstRate
   * - grandTotal = subTotal + gstAmount
   * - platformFeeAmount = total platform fees collected
   */
  static calculateBid(
    items: BidItemInput[],
    options: PricingOptions
  ): CalculatedBid {
    if (!items.length) {
      throw new Error('PricingCalculator: bid_items cannot be empty');
    }

    const transport = options.transportPerUnit ?? 0;
    const gstRate = options.gstRate ?? 0.18;
    const feeRate = this.getPlatformFee(options.tradeType);

    let subTotal = 0;
    let platformFeeAmount = 0;

    const calculatedItems: CalculatedItem[] = items.map(item => {
      if (item.quantity <= 0) {
        throw new Error(`PricingCalculator: quantity must be positive, got ${item.quantity}`);
      }
      if (item.supplierUnitPrice <= 0) {
        throw new Error(`PricingCalculator: supplierUnitPrice must be positive, got ${item.supplierUnitPrice}`);
      }

      const supplierRate = item.supplierUnitPrice + transport;
      const buyerUnitPrice = this.round(supplierRate * (1 + feeRate));
      const buyerLineTotal = this.round(buyerUnitPrice * item.quantity);
      
      // Calculate platform fee for this item
      const supplierLineTotal = this.round((item.supplierUnitPrice + transport) * item.quantity);
      platformFeeAmount += this.round(buyerLineTotal - supplierLineTotal);

      subTotal = this.round(subTotal + buyerLineTotal);

      return {
        supplierUnitPrice: item.supplierUnitPrice,
        buyerUnitPrice,
        buyerLineTotal,
        quantity: item.quantity
      };
    });

    const gstAmount = this.round(subTotal * gstRate);
    const grandTotal = this.round(subTotal + gstAmount);

    return {
      items: calculatedItems,
      subTotal,
      gstAmount,
      grandTotal,
      platformFeeRate: feeRate,
      platformFeeAmount: this.round(platformFeeAmount)
    };
  }

  /**
   * Calculate single item buyer pricing
   * Use when you have just one item (legacy support)
   */
  static calculateSingleItem(
    supplierUnitPrice: number,
    quantity: number,
    options: Omit<PricingOptions, 'gstRate'>
  ): { buyerUnitPrice: number; buyerLineTotal: number } {
    const transport = options.transportPerUnit ?? 0;
    const feeRate = this.getPlatformFee(options.tradeType);

    const supplierRate = supplierUnitPrice + transport;
    const buyerUnitPrice = this.round(supplierRate * (1 + feeRate));
    const buyerLineTotal = this.round(buyerUnitPrice * quantity);

    return { buyerUnitPrice, buyerLineTotal };
  }

  /**
   * Format currency for display (INR)
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}

/**
 * USAGE EXAMPLE:
 * 
 * import { PricingCalculator } from '@/utils/PricingCalculator';
 * 
 * const pricing = PricingCalculator.calculateBid(
 *   bid.bid_items.map(item => ({
 *     supplierUnitPrice: item.supplier_unit_price,
 *     quantity: item.quantity
 *   })),
 *   {
 *     tradeType: requirement.trade_type,
 *     transportPerUnit: requirement.transport_cost_per_unit || 0
 *   }
 * );
 * 
 * // Use pricing.items[0].buyerUnitPrice for rate display
 * // Use pricing.grandTotal for total display
 */
