import { bigint, boolean, index, int, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core'
import { dateTime, exactVarchar, timestamps, uuidPk, uuidRef } from './columns'

/*
 * Authentication tables in the shape Better Auth expects (JS keys = Better
 * Auth field names; columns snake_case). Better Auth owns password hashing
 * (scrypt, in accounts.password), sessions, verification tokens, TOTP 2FA and
 * roles (users.role).
 *
 * Emails are unique case-insensitively thanks to the server's default
 * case-insensitive collation; tokens use a binary (case-sensitive) collation.
 */

export const users = mysqlTable('users', {
  id: uuidPk(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique('users_email_unique'),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  /** 'user' | 'admin' (comma-separated for multiple roles). */
  role: varchar('role', { length: 64 }).default('user'),
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: dateTime('ban_expires'),
  ...timestamps,
})

export const sessions = mysqlTable(
  'sessions',
  {
    id: uuidPk(),
    expiresAt: dateTime('expires_at').notNull(),
    token: exactVarchar('token', { length: 255 }).notNull().unique('sessions_token_unique'),
    ipAddress: varchar('ip_address', { length: 64 }),
    userAgent: text('user_agent'),
    userId: uuidRef('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    impersonatedBy: uuidRef('impersonated_by'),
    ...timestamps,
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
)

export const accounts = mysqlTable(
  'accounts',
  {
    id: uuidPk(),
    accountId: varchar('account_id', { length: 255 }).notNull(),
    providerId: varchar('provider_id', { length: 64 }).notNull(),
    userId: uuidRef('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: dateTime('access_token_expires_at'),
    refreshTokenExpiresAt: dateTime('refresh_token_expires_at'),
    scope: text('scope'),
    /** Better Auth scrypt hash. Never plaintext. */
    password: text('password'),
    ...timestamps,
  },
  (t) => [index('accounts_user_idx').on(t.userId)],
)

export const verifications = mysqlTable(
  'verifications',
  {
    id: uuidPk(),
    identifier: exactVarchar('identifier', { length: 255 }).notNull(),
    value: text('value').notNull(),
    expiresAt: dateTime('expires_at').notNull(),
    ...timestamps,
  },
  (t) => [index('verifications_identifier_idx').on(t.identifier)],
)

export const twoFactors = mysqlTable(
  'two_factors',
  {
    id: uuidPk(),
    secret: exactVarchar('secret', { length: 255 }).notNull(),
    backupCodes: text('backup_codes').notNull(),
    userId: uuidRef('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    verified: boolean('verified').default(true),
    failedVerificationCount: int('failed_verification_count').default(0),
    lockedUntil: dateTime('locked_until'),
  },
  (t) => [index('two_factors_user_idx').on(t.userId), index('two_factors_secret_idx').on(t.secret)],
)

/** Shared rate-limit counters (works across processes, unlike memory). */
export const rateLimits = mysqlTable('rate_limits', {
  id: uuidPk(),
  key: exactVarchar('key', { length: 255 }).notNull().unique('rate_limits_key_unique'),
  count: int('count').notNull(),
  lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
})

export { timestamps }
