import { sql } from 'drizzle-orm'
import {
  bigserial,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { users } from './auth'
import { localeEnum, newsletterStatusEnum, webhookStatusEnum } from './enums'

/**
 * Processed webhook events (Stripe event id as primary key). Inserting the
 * id first makes webhook handling idempotent: a duplicate delivery hits the
 * primary key and is skipped. Payloads are not stored.
 */
export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: text('id').primaryKey(),
    provider: text('provider').notNull().default('stripe'),
    type: text('type').notNull(),
    status: webhookStatusEnum('status').notNull().default('received'),
    error: text('error'),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (t) => [index('webhook_events_status_idx').on(t.status)],
)

/**
 * Newsletter subscribers. Stores consent evidence (time + source) for GDPR.
 * Confirmation tokens are stored hashed, never in clear.
 */
export const newsletterSubscribers = pgTable(
  'newsletter_subscribers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    locale: localeEnum('locale').notNull().default('en'),
    status: newsletterStatusEnum('status').notNull().default('pending'),
    consentAt: timestamp('consent_at', { withTimezone: true }).notNull(),
    consentSource: text('consent_source').notNull(),
    confirmationTokenHash: text('confirmation_token_hash'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('newsletter_subscribers_email_lower_unique').on(sql`lower(${t.email})`)],
)

/** Append-only log of administrative actions (Phase 9 writes to it). */
export const adminAuditLogs = pgTable(
  'admin_audit_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    changes: jsonb('changes').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('admin_audit_logs_created_idx').on(t.createdAt),
    index('admin_audit_logs_entity_idx').on(t.entityType, t.entityId),
  ],
)
