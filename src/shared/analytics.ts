import { inject } from '@vercel/analytics'

/** Track page views on Vercel (no-op locally unless forced). */
export function initAnalytics(): void {
  inject({
    mode: import.meta.env.PROD ? 'production' : 'development',
  })
}
