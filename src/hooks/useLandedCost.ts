import { useMemo } from 'react';

export interface LandedCostInput {
  basePrice: number;
  freightCost?: number;
  gstPercent?: number;
  paymentTermsDays?: number;
}

export interface LandedCostResult {
  landedCost: number;
  gstAmount: number;
  totalFreight: number;
  financingCost: number;
}

const FINANCING_RATE_PER_DAY = 0.04; // 0.04% per day (~14.6% annual)

export function useLandedCost(input: LandedCostInput): LandedCostResult {
  return useMemo(() => {
    const base = input.basePrice || 0;
    const freight = input.freightCost || 0;
    const gstPct = input.gstPercent || 0;
    const days = input.paymentTermsDays || 0;

    const gstAmount = base * gstPct / 100;
    const financingCost = days > 0 ? (base + freight) * (FINANCING_RATE_PER_DAY / 100) * days : 0;
    const landedCost = base + freight + gstAmount + financingCost;

    return { landedCost, gstAmount, totalFreight: freight, financingCost };
  }, [input.basePrice, input.freightCost, input.gstPercent, input.paymentTermsDays]);
}
