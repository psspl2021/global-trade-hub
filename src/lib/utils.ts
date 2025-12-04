import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskCompanyName(name: string): string {
  // "OFB Tech Pvt Ltd" → "O** T*** P** L**"
  return name
    .split(' ')
    .map(word => word.charAt(0) + '*'.repeat(Math.max(word.length - 1, 1)))
    .join(' ');
}
