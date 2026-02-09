/**
 * Unified analytics — sends events to both PostHog and Google Analytics.
 * Components import `track` and `identify` from here; never call posthog/gtag directly.
 */

import posthog from 'posthog-js'

// ── Event names (single source of truth) ──────────────────

export type AnalyticsEvent =
  | 'intensity_selected'
  | 'intro_seen'
  | 'hot_take_loaded'
  | 'spin_again'
  | 'vote'
  | 'reason_tags_added'
  | 'explanation_added'
  | 'category_completed'
  | 'stance_card_completed'
  | 'stance_card_shared'
  | 'stance_card_saved'
  | 'save_collection_auth_prompt'
  | 'start_over'

// ── Helpers ───────────────────────────────────────────────

function isPostHogReady(): boolean {
  return typeof window !== 'undefined' && posthog.__loaded
}

function gaEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', name, params)
  }
}

// ── Public API ────────────────────────────────────────────

export function track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
  // PostHog
  if (isPostHogReady()) {
    posthog.capture(event, properties)
  }

  // Google Analytics
  gaEvent(event, properties)
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  if (isPostHogReady()) {
    posthog.identify(userId, traits)
  }
}

export function reset() {
  if (isPostHogReady()) {
    posthog.reset()
  }
}
