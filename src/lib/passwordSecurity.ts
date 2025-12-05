/**
 * Password security utilities using Have I Been Pwned API
 * Uses k-anonymity to check passwords without exposing them
 */

async function sha1Hash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export interface BreachCheckResult {
  isBreached: boolean;
  breachCount: number;
  error?: string;
}

/**
 * Check if a password has been exposed in known data breaches
 * Uses HIBP k-anonymity API - only sends first 5 chars of SHA-1 hash
 */
export async function checkPasswordBreach(password: string): Promise<BreachCheckResult> {
  try {
    const hash = await sha1Hash(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true', // Adds padding to prevent timing attacks
      },
    });

    if (!response.ok) {
      return { isBreached: false, breachCount: 0, error: 'Unable to verify password security' };
    }

    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        return { isBreached: true, breachCount: parseInt(count.trim(), 10) };
      }
    }

    return { isBreached: false, breachCount: 0 };
  } catch (error) {
    console.error('Password breach check failed:', error);
    return { isBreached: false, breachCount: 0, error: 'Unable to verify password security' };
  }
}

/**
 * Format breach count for user-friendly display
 */
export function formatBreachCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
