import { z } from 'zod'

/**
 * Member creation form validation schema
 */
export const memberSchema = z.object({
  // Personal Information
  first_name: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters'),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length >= 6,
      'Password must be at least 6 characters'
    ),
  phone_country_code: z.string().default('+1'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine(
      (val) => /^\d{7,15}$/.test(val),
      'Phone number must be between 7 and 15 digits'
    ),
  date_of_birth: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true
        const date = new Date(val)
        const age = (Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        return age >= 18 && age <= 120
      },
      'Member must be between 18 and 120 years old'
    ),
  address: z.string().optional(),
  diet_restrictions: z.string().optional(),
})

export type MemberFormData = z.infer<typeof memberSchema>

