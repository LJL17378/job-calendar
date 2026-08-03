export function createId(prefix: string): string {
  void prefix
  return crypto.randomUUID()
}
