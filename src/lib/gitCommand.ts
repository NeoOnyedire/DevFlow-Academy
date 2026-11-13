export function parseCommitMessage(command: string): string | null {
  const match = command.match(/-m\s*"([^"]+)"/)
  return match?.[1] ?? null
}
