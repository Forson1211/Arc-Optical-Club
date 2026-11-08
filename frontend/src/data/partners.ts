import type { Partner } from '../lib/content'

// Logos are copied from each organization's own website; see docs/PARTNER-LOGOS.md.
export const partners: Partner[] = [
  { id: 'partner-pillmart', title: 'Pilmart Pharmacy and Clinic', category: 'Partner', image: '', alt: '', website: '', order: 0, status: 'draft' },
  { id: 'partner-osag', title: 'Optometry Students Association of Ghana', category: 'Partner', image: '/images/partner-osag.png', alt: 'Optometry Students Association of Ghana logo', website: 'https://osagofficial1.wordpress.com/about/', order: 1, status: 'published' },
  { id: 'partner-ucc', title: 'University of Cape Coast', category: 'Partner', image: '/images/partner-ucc.webp', alt: 'University of Cape Coast logo', website: 'https://ucc.edu.gh/', order: 2, status: 'published' },
]
