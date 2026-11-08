export const GITTER_HELP_EVENT = 'devflow:gitter-help'

export function requestGitterHelp(prompt: string): void {
  window.dispatchEvent(new CustomEvent<string>(GITTER_HELP_EVENT, { detail: prompt }))
}
