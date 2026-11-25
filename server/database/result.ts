/**
 * MySQL has no RETURNING: writes resolve to [ResultSetHeader, fields].
 * Returns how many rows an UPDATE/DELETE/INSERT changed.
 */
export function affectedRows(result: unknown): number {
  const header = Array.isArray(result) ? result[0] : result
  return Number((header as { affectedRows?: number } | undefined)?.affectedRows ?? 0)
}

/** True when a write failed on a UNIQUE/PRIMARY KEY (MySQL ER_DUP_ENTRY). */
export function isDuplicateKey(err: unknown): boolean {
  let e: unknown = err
  for (let i = 0; i < 4 && e; i++) {
    if ((e as { errno?: number }).errno === 1062) return true
    if ((e as { code?: string }).code === 'ER_DUP_ENTRY') return true
    e = (e as { cause?: unknown }).cause
  }
  return false
}
