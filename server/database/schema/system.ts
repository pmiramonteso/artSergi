import { index, json, mysqlEnum, mysqlTable, serial, text, varchar } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { users } from './auth'
import { dateTime, exactVarchar, uuidPk, uuidRef } from './columns'
import { LOCALES, NEWSLETTER_STATUSES, WEBHOOK_STATUSES } from './enums'

/**
 * Processed webhook events (Stripe event id as primary key). Inserting the
 * id first makes webhook handling idempotent: a duplicate delivery hits the
 * primary key and is skipped. Payloads are not stored.
 */
export const webhookEvents = mysqlTable(
  'webhook_events',
  {
    id: exactVarchar('id', { length: 255 }).primaryKey(),
    provider: varchar('provider', { length: 32 }).notNull().default('stripe'),
    type: varchar('type', { length: 120 }).notNull(),
    status: mysqlEnum('status', WEBHOOK_STATUSES).notNull().default('received'),
    error: text('error'),
    receivedAt: dateTime('received_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    processedAt: dateTime('processed_at'),
  },
  (t) => [index('webhook_events_status_idx').on(t.status)],
)

/**
 * Newsletter subscribers. Stores consent evidence (time + source) for GDPR.
 * Confirmation tokens are stored hashed, never in clear.
 */
export const newsletterSubscribers = mysqlTable('newsletter_subscribers', {
  id: uuidPk(),
  email: varchar('email', { length: 255 }).notNull().unique('newsletter_email_unique'),
  locale: mysqlEnum('locale', LOCALES).notNull().default('en'),
  status: mysqlEnum('status', NEWSLETTER_STATUSES).notNull().default('pending'),
  consentAt: dateTime('consent_at').notNull(),
  consentSource: varchar('consent_source', { length: 120 }).notNull(),
  confirmationTokenHash: exactVarchar('confirmation_token_hash', { length: 255 }),
  confirmedAt: dateTime('confirmed_at'),
  unsubscribedAt: dateTime('unsubscribed_at'),
  createdAt: dateTime('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
})

/** Append-only log of administrative actions. */
export const adminAuditLogs = mysqlTable(
  'admin_audit_logs',
  {
    id: serial('id').primaryKey(),
    actorUserId: uuidRef('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 80 }).notNull(),
    entityType: varchar('entity_type', { length: 40 }).notNull(),
    entityId: varchar('entity_id', { length: 120 }),
    changes: json('changes').$type<Record<string, unknown> | null>(),
    createdAt: dateTime('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index('admin_audit_logs_created_idx').on(t.createdAt),
    index('admin_audit_logs_entity_idx').on(t.entityType, t.entityId),
  ],
)
