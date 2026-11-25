import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import { users } from '../database/schema'
import { writeAudit } from './audit'

export interface SessionUser {
  id: string
  email: string
  name: string
  emailVerified: boolean
  role?: string | null
  twoFactorEnabled?: boolean | null
}

/** The signed-in user (server-side session lookup), or 401. */
export async function requireUser(event: H3Event): Promise<SessionUser> {
  const auth = requireAuth(event)
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Sign in required' })
  return session.user as SessionUser
}

export const hasRole = (user: Pick<SessionUser, 'role'>, role: string) =>
  (user.role ?? '')
    .split(',')
    .map((r) => r.trim())
    .includes(role)

function adminAllowlist(event: H3Event): string[] {
  return String(useRuntimeConfig(event).adminEmails ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Admin access, decided on the server for every request:
 * - role 'admin' (or a VERIFIED email in NUXT_ADMIN_EMAILS, which is then
 *   persisted as role 'admin' with an audit entry: first-admin bootstrap);
 * - AND two-factor authentication enabled (MFA is mandatory for admins).
 * Hiding links in the UI is not access control; this is.
 */
export async function requireAdmin(event: H3Event): Promise<SessionUser> {
  const user = await requireUser(event)
  let isAdmin = hasRole(user, 'admin')

  if (!isAdmin && user.emailVerified && adminAllowlist(event).includes(user.email.toLowerCase())) {
    const db = requireDatabase()
    await db
      .update(users)
      .set({ role: 'admin', updatedAt: new Date() })
      .where(eq(users.id, user.id))
    await writeAudit(db, {
      actorUserId: user.id,
      action: 'admin.bootstrap',
      entityType: 'user',
      entityId: user.id,
      changes: { role: { from: user.role ?? 'user', to: 'admin' } },
    })
    isAdmin = true
  }

  if (!isAdmin) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  if (!user.twoFactorEnabled) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Two-factor authentication required',
      data: { code: 'MFA_REQUIRED' },
    })
  }
  return user
}
