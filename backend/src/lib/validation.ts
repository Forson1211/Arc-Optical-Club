import { z } from 'zod'

export const programNames = ['Sight For Kids', 'Operation Sight For All', 'Myopia Rescue'] as const
const name = z.string().trim().min(2, 'Please enter at least two characters.').max(120)
export const email = z.string().trim().email().max(180).transform(value => value.toLowerCase())
const phone = z.string().trim().min(7).max(40).regex(/^[+\d\s().-]+$/, 'Please enter a valid phone number.')
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().startsWith(value)
}, 'Please enter a valid date.')

export const joinSchema = z.object({
  name, email, phone,
  location: z.string().trim().min(2).max(160),
  role: z.enum(['Student', 'Eye-care professional', 'Other professional', 'Community volunteer']),
  organization: z.string().trim().max(180).optional().default(''),
  interests: z.array(z.enum(['Community outreach', 'Eye-health education', 'Research & learning', 'Fundraising & partnerships', 'Communications & design'])).min(1, 'Choose at least one area of interest.').max(5),
  availability: z.enum(['Weekends', 'Weekdays', 'Flexible / occasional']),
  motivation: z.string().trim().min(20, 'Please tell us a little more (at least 20 characters).').max(2000),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
})

export const outreachSchema = z.object({
  name, program: z.string().trim().min(2).max(120), location: z.string().trim().min(2).max(160), date,
  status: z.enum(['Planning', 'Confirmed', 'Completed']),
  screened: z.number().int().min(0).max(100000), target: z.number().int().min(1).max(100000),
}).refine(record => record.screened === 0 || record.status === 'Completed', { message: 'Mark an outreach Completed before recording people screened.', path: ['status'] })
export const volunteerSchema = z.object({ name, email, role: z.string().trim().min(2).max(100), status: z.enum(['Active', 'Pending', 'Declined']) })
export const donationSchema = z.object({ name, program: z.string().trim().min(2).max(120), date, amount: z.number().positive().max(100000000).multipleOf(0.01), status: z.enum(['Received', 'Pledged']) })
export const contactSchema = z.object({
  name, email, company: z.string().trim().max(160).optional(), phone: z.string().trim().max(40).optional(),
  subject: z.string().trim().min(2).max(180), message: z.string().trim().min(10).max(5000),
})
