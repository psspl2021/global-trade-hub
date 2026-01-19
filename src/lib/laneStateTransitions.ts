/**
 * Lane State Machine
 * 
 * Canonical states for demand lane lifecycle:
 * detected → pending → activated → fulfilling → closed → lost
 */

export type LaneState = 'detected' | 'pending' | 'activated' | 'fulfilling' | 'closed' | 'lost';

export interface LaneCapacityStatus {
  country: string;
  category: string;
  demand_value: number;
  total_capacity: number;
  allocated_capacity: number;
  available_capacity: number;
  utilization_pct: number;
  deficit_value: number;
  status: 'OK' | 'DEFICIT' | 'NO_CAPACITY';
}

const LANE_TRANSITIONS: Record<string, Record<string, LaneState>> = {
  detected: {
    validate: 'pending',
  },
  pending: {
    activate: 'activated',
    reject: 'lost',
  },
  activated: {
    allocate: 'fulfilling',
  },
  fulfilling: {
    complete: 'closed',
    fail: 'lost',
  },
};

/**
 * Get the next valid lane state based on current state and action
 */
export function getNextLaneState(current: string, action: string): LaneState | null {
  return LANE_TRANSITIONS[current]?.[action] || null;
}

/**
 * Check if a state transition is valid
 */
export function isValidTransition(current: string, next: string): boolean {
  const transitions = LANE_TRANSITIONS[current];
  if (!transitions) return false;
  return Object.values(transitions).includes(next as LaneState);
}

/**
 * Compute lane capacity status
 */
export function computeLaneCapacityStatus(
  country: string,
  category: string,
  demandValue: number,
  capacity: { monthly_capacity_value: number; allocated_capacity_value: number } | null
): LaneCapacityStatus {
  if (!capacity) {
    return {
      country,
      category,
      demand_value: demandValue,
      total_capacity: 0,
      allocated_capacity: 0,
      available_capacity: 0,
      utilization_pct: 100,
      deficit_value: demandValue,
      status: 'NO_CAPACITY',
    };
  }

  const available = capacity.monthly_capacity_value - capacity.allocated_capacity_value;
  const deficit = Math.max(0, demandValue - available);
  const utilization = capacity.monthly_capacity_value > 0
    ? (capacity.allocated_capacity_value / capacity.monthly_capacity_value) * 100
    : 100;

  return {
    country,
    category,
    demand_value: demandValue,
    total_capacity: capacity.monthly_capacity_value,
    allocated_capacity: capacity.allocated_capacity_value,
    available_capacity: available,
    utilization_pct: utilization,
    deficit_value: deficit,
    status: deficit > 0 ? 'DEFICIT' : 'OK',
  };
}

/**
 * Lane state display metadata
 */
export const LANE_STATE_CONFIG: Record<LaneState, { 
  label: string; 
  color: string; 
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  description: string;
}> = {
  detected: {
    label: 'Detected',
    color: 'text-gray-500',
    badgeVariant: 'outline',
    description: 'Signal auto-generated from page / RFQ',
  },
  pending: {
    label: 'Pending',
    color: 'text-yellow-600',
    badgeVariant: 'secondary',
    description: 'Human-validated demand backlog',
  },
  activated: {
    label: 'Activated',
    color: 'text-blue-600',
    badgeVariant: 'default',
    description: 'Lane opened for supplier fulfilment',
  },
  fulfilling: {
    label: 'Fulfilling',
    color: 'text-purple-600',
    badgeVariant: 'default',
    description: 'Supplier capacity allocated',
  },
  closed: {
    label: 'Closed',
    color: 'text-green-600',
    badgeVariant: 'outline',
    description: 'Successfully fulfilled',
  },
  lost: {
    label: 'Lost',
    color: 'text-red-600',
    badgeVariant: 'destructive',
    description: 'Demand expired or failed',
  },
};
