export interface TestimonialItem {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  organization: string;
  specialty?: string;
}

/**
 * Verified beta-user testimonials.
 * Add real, approved customer quotes here.
 * Per product policy, the "What Early Teams Are Saying" section stays hidden
 * until at least 2 real beta-user quotes are present.
 */
export const TESTIMONIALS: TestimonialItem[] = [];

/**
 * Optional verified clinic count for social proof.
 * Keep null/0 until a real verified count is ready to display.
 */
export const VERIFIED_CLINICS_COUNT: number | null = null;

export function hasRealTestimonials(): boolean {
  return TESTIMONIALS.length >= 2;
}
