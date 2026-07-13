/**
 * avatarColor.ts
 *
 * Deterministic color from a name string, used as an avatar background
 * fallback for users without a real avatar image (password accounts, or
 * GitHub accounts before their image loads).
 *
 * Previously this was computed once and stored on the user record.
 * Now that accounts are real server-side records, we don't want to store
 * a purely cosmetic, always-derivable value — so it's computed on the
 * fly wherever it's needed (Navigation.tsx).
 */
const COLORS = ['#FF4D6D', '#F7B731', '#3CCF4A', '#4A90D9', '#9B59B6', '#E67E22']

export function nameToColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}
