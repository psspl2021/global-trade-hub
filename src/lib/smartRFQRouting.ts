/**
 * ============================================================
 * SMART RFQ ROUTING
 * ============================================================
 * 
 * Routes high-intent RFQs to qualified suppliers based on:
 * - Verification status
 * - Category match
 * - Subscription tier
 * - Lane assignment
 */

import { supabase } from '@/integrations/supabase/client';

export interface RFQRoutingResult {
  supplierId: string;
  matchScore: number;
  isVerified: boolean;
  isLaneAssigned: boolean;
  accessTier: 'free' | 'premium' | 'exclusive';
  priority: number;
}

/**
 * Get qualified suppliers for an RFQ
 * Implements monetisation-aware routing:
 * - Exclusive suppliers get priority
 * - Lane-assigned suppliers come first
 * - Verified suppliers only for high-intent
 */
export async function getQualifiedSuppliers(params: {
  category: string;
  country: string;
  intentScore: number;
}): Promise<RFQRoutingResult[]> {
  const { category, country, intentScore } = params;
  
  try {
    // 1. Check if lane is locked
    const { data: laneLock } = await supabase
      .from('demand_lane_locks')
      .select(`
        id,
        max_suppliers,
        lane_supplier_assignments (
          supplier_id,
          priority_rank,
          is_active
        )
      `)
      .eq('category', category)
      .eq('country', country)
      .eq('is_active', true)
      .single();

    // If lane is locked, return only assigned suppliers
    if (laneLock && laneLock.lane_supplier_assignments) {
      const assignedSuppliers = (laneLock.lane_supplier_assignments as any[])
        .filter((a: any) => a.is_active)
        .sort((a: any, b: any) => a.priority_rank - b.priority_rank);

      if (assignedSuppliers.length > 0) {
        // Get supplier details
        const supplierIds = assignedSuppliers.map((a: any) => a.supplier_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, is_verified_supplier')
          .in('id', supplierIds);

        return assignedSuppliers.map((a: any) => {
          const profile = profiles?.find((p: any) => p.id === a.supplier_id);
          return {
            supplierId: a.supplier_id,
            matchScore: 100,
            isVerified: profile?.is_verified_supplier || false,
            isLaneAssigned: true,
            accessTier: 'exclusive' as const,
            priority: a.priority_rank,
          };
        });
      }
    }

    // 2. For unlocked lanes, find matching suppliers
    const { data: suppliers } = await supabase
      .from('profiles')
      .select(`
        id,
        is_verified_supplier,
        supplier_categories
      `)
      .eq('business_type', 'supplier')
      .contains('supplier_categories', [category]);

    if (!suppliers || suppliers.length === 0) {
      return [];
    }

    // 3. Get access tiers for matching suppliers
    const supplierIds = suppliers.map((s: any) => s.id);
    const { data: accessData } = await supabase
      .from('supplier_demand_access')
      .select('supplier_id, access_tier')
      .in('supplier_id', supplierIds);

    const accessMap = new Map(
      (accessData || []).map((a: any) => [a.supplier_id, a.access_tier])
    );

    // 4. Score and sort suppliers
    const results: RFQRoutingResult[] = suppliers.map((s: any) => {
      const tier = (accessMap.get(s.id) || 'free') as 'free' | 'premium' | 'exclusive';
      let matchScore = 50;

      // Verification bonus
      if (s.is_verified_supplier) matchScore += 20;

      // Access tier bonus
      if (tier === 'exclusive') matchScore += 30;
      else if (tier === 'premium') matchScore += 15;

      // High-intent requires verified or premium
      if (intentScore >= 7) {
        if (!s.is_verified_supplier && tier === 'free') {
          matchScore = 0; // Exclude free unverified from high-intent
        }
      }

      return {
        supplierId: s.id,
        matchScore,
        isVerified: s.is_verified_supplier || false,
        isLaneAssigned: false,
        accessTier: tier,
        priority: tier === 'exclusive' ? 1 : tier === 'premium' ? 2 : 3,
      };
    });

    // Filter out zero scores and sort
    return results
      .filter(r => r.matchScore > 0)
      .sort((a, b) => {
        // Sort by priority tier first, then match score
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.matchScore - a.matchScore;
      })
      .slice(0, 10); // Return top 10

  } catch (error) {
    console.error('[SmartRFQRouting] Error:', error);
    return [];
  }
}

/**
 * Check if a supplier can access an RFQ based on monetisation rules
 */
export async function canSupplierAccessRFQ(params: {
  supplierId: string;
  rfqCategory: string;
  rfqCountry: string;
  intentScore: number;
}): Promise<{
  canAccess: boolean;
  reason: string;
  upgradeRequired?: boolean;
}> {
  const { supplierId, rfqCategory, rfqCountry, intentScore } = params;

  try {
    // Get supplier's access tier
    const { data: access } = await supabase
      .from('supplier_demand_access')
      .select('access_tier, min_intent_visible')
      .eq('supplier_id', supplierId)
      .single();

    const tier = (access?.access_tier || 'free') as string;
    const minIntent = access?.min_intent_visible || 0;

    // Free tier restrictions
    if (tier === 'free') {
      // High-intent RFQs require upgrade
      if (intentScore >= 4) {
        return {
          canAccess: false,
          reason: 'This high-intent RFQ requires a Premium subscription',
          upgradeRequired: true,
        };
      }
    }

    // Check if lane is locked and supplier is not assigned
    const { data: laneLock } = await supabase
      .from('demand_lane_locks')
      .select('id')
      .eq('category', rfqCategory)
      .eq('country', rfqCountry)
      .eq('is_active', true)
      .single();

    if (laneLock) {
      const { data: assignment } = await supabase
        .from('lane_supplier_assignments')
        .select('id')
        .eq('lane_lock_id', laneLock.id)
        .eq('supplier_id', supplierId)
        .eq('is_active', true)
        .single();

      if (!assignment) {
        return {
          canAccess: false,
          reason: 'This lane is locked to selected suppliers only',
          upgradeRequired: false,
        };
      }
    }

    return {
      canAccess: true,
      reason: 'Access granted',
    };

  } catch (error) {
    console.error('[SmartRFQRouting] Access check error:', error);
    return {
      canAccess: true, // Default to allow on error
      reason: 'Access check failed, defaulting to allow',
    };
  }
}
