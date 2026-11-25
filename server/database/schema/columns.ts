import { randomUUID } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { char, customType, datetime } from 'drizzle-orm/mysql-core'

/*
 * Shared column helpers for MySQL 8.4 (the production server at Sered).
 * - ids are UUID strings generated in the application (no RETURNING in MySQL)
 * - datetimes are stored in UTC with millisecond precision
 * - tokens and external ids use a binary collation: compared case-sensitively
 *   (the server default utf8mb4_0900_ai_ci would treat "aB" and "Ab" as equal)
 */

export const uuidPk = (name = 'id') =>
  char(name, { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID())

export const uuidRef = (name: string) => char(name, { length: 36 })

export const dateTime = (name: string) => datetime(name, { mode: 'date', fsp: 3 })

export const timestamps = {
  createdAt: dateTime('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: dateTime('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .$onUpdate(() => new Date()),
}

/** Case-sensitive VARCHAR (utf8mb4_bin) for tokens, secrets and provider ids. */
export const exactVarchar = customType<{ data: string; config: { length: number } }>({
  dataType: (config) =>
    `varchar(${config?.length ?? 255}) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`,
})
