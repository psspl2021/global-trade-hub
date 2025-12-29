import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(1, 'Password is required')
    .max(100, 'Password must be less than 100 characters'),
});

export const signupSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  companyName: z.string()
    .trim()
    .min(2, 'Company name must be at least 2 characters')
    .max(200, 'Company name must be less than 200 characters'),
  contactPerson: z.string()
    .trim()
    .min(2, 'Contact person must be at least 2 characters')
    .max(100, 'Contact person must be less than 100 characters'),
  phone: z.string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, 'Please enter a valid phone number (10-15 digits)'),
  role: z.enum(['buyer', 'supplier', 'logistics_partner']),
  referredByName: z.string()
    .trim()
    .min(2, 'Referrer name must be at least 2 characters')
    .max(100, 'Referrer name must be less than 100 characters'),
  referredByPhone: z.string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, 'Please enter a valid phone number (10-15 digits)'),
  location: z.string()
    .trim()
    .min(2, 'Location is required')
    .max(200, 'Location must be less than 200 characters'),
  gstin: z.string()
    .trim()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid 15-character GSTIN')
    .optional()
    .or(z.literal('')),
});

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const resetEmailSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ResetEmailFormData = z.infer<typeof resetEmailSchema>;
