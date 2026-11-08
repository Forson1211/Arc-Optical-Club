import { z } from 'zod'

export const imageSource = z.string().trim().max(2048).refine(value => {
  // Only public image paths or HTTPS URLs; HTML, SVG and data URLs are not accepted.
  if (/^\/(?:images|scrolling)\/[A-Za-z0-9%_. ()-]+\.(?:png|jpe?g|webp)$/i.test(value)) return true
  if (/^\/api\/content\/images\/[a-f0-9-]{36}$/.test(value)) return true
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password } catch { return false }
}, 'Upload an image, use an existing /images/ path, or enter an HTTPS image URL.')

const status = z.enum(['draft', 'published'])
export const teamProfileSchema = z.object({
  title: z.string().trim().min(2).max(120), role: z.string().trim().min(2).max(160),
  category: z.enum(['Core Team', 'Team Leads', 'Team Members', 'Operations', 'Advisory Council']),
  image: z.union([z.literal(''), imageSource]).default(''), alt: z.string().trim().max(240).default(''),
  status, order: z.number().int().min(0).max(999),
}).refine(value => !value.image || value.alt.length >= 3, { message: 'Describe the uploaded photo.', path: ['alt'] })

export const partnerSchema = z.object({
  title: z.string().trim().min(2).max(120), category: z.literal('Partner').default('Partner'),
  image: z.union([z.literal(''), imageSource]).default(''), alt: z.string().trim().max(240).default(''),
  website: z.string().trim().max(2048).default('').refine(value => {
    if (!value) return true
    try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password } catch { return false }
  }, 'Use an HTTPS partner website URL.'),
  status, order: z.number().int().min(0).max(999),
}).refine(value => value.status !== 'published' || !!value.image, { message: 'Upload an official logo before publishing this partner.', path: ['image'] })
  .refine(value => !value.image || value.alt.length >= 3, { message: 'Describe the partner logo.', path: ['alt'] })

export const programContentSchema = z.object({
  title: z.string().trim().min(2).max(120), category: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(300), detail: z.string().trim().min(20).max(6000),
  image: imageSource, alt: z.string().trim().min(3).max(240),
  status, order: z.number().int().min(0).max(999),
})
export const newsSchema = z.object({
  title: z.string().trim().min(5).max(180), excerpt: z.string().trim().min(10).max(300),
  author: z.string().trim().min(2).max(120), category: z.string().trim().min(2).max(80),
  image: imageSource, alt: z.string().trim().min(3).max(240), status,
  publishedAt: z.string().datetime({ offset: true }).refine(value => Date.parse(value) <= Date.now(), 'Publication date cannot be in the future.'),
  blocks: z.array(z.discriminatedUnion('type', [
    z.object({ type: z.literal('paragraph'), text: z.string().trim().min(1).max(6000) }),
    z.object({ type: z.literal('heading'), text: z.string().trim().min(1).max(180) }),
    z.object({ type: z.literal('image'), src: imageSource, alt: z.string().trim().min(3).max(240), caption: z.string().trim().max(300) }),
  ])).min(1).max(40).refine(blocks => blocks.some(block => block.type === 'paragraph'), 'Add at least one paragraph.'),
}).refine(value => JSON.stringify(value).length < 55000, 'This article is too long. Please shorten it before saving.')
