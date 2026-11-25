import type { Database } from '../database/client'
import { adminAuditLogs } from '../database/schema'

/** Append-only audit trail for administrative changes. */
export async function writeAudit(
  db: Database,
  entry: {
    actorUserId: string | null
    action: string
    entityType: string
    entityId?: string | null
    changes?: Record<string, unknown>
  },
) {
  await db.insert(adminAuditLogs).values({
    actorUserId: entry.actorUserId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    changes: entry.changes ?? null,
  })
}

/** Field-level diff for audit entries: only changed keys are recorded. */
export function diff<T extends Record<string, unknown>>(before: T, patch: Partial<T>) {
  const changes: Record<string, { from: unknown; to: unknown }> = {}
  for (const [k, to] of Object.entries(patch)) {
    if (to !== undefined && before[k] !== to) changes[k] = { from: before[k], to }
  }
  return changes
}
