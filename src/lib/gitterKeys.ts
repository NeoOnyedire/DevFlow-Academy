/**
 * gitterKeys.ts
 *
 * Shared localStorage keys/types for the learner's own Gitter AI (BYOK)
 * credentials, used by GitterHelper.tsx (the chat widget), ReviewModal.tsx
 * (review gate + moderation), and CurriculumPanel.tsx (Module 1 gate).
 * Centralized here so all three read/write the exact same storage slot.
 */

export const GITTER_API_KEY_STORAGE = 'devflow_gitter_api_key'
export const GITTER_PROVIDER_STORAGE = 'devflow_gitter_provider'

export type AiProvider = 'gemini' | 'groq' | 'anthropic'

export interface GitterCredentials {
  apiKey: string
  provider: AiProvider
}

/** Reads whatever Gitter AI key/provider is currently stored in this browser, if any. */
export function getGitterCredentials(): GitterCredentials | null {
  if (typeof window === 'undefined') return null
  const apiKey = localStorage.getItem(GITTER_API_KEY_STORAGE)
  const provider = localStorage.getItem(GITTER_PROVIDER_STORAGE) as AiProvider | null
  if (!apiKey || !provider) return null
  return { apiKey, provider }
}

/** Whether the learner has activated Gitter AI mode at all, regardless of provider. */
export function hasGitterAiActivated(): boolean {
  return !!getGitterCredentials()
}