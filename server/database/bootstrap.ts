import { createError } from 'h3'
import postgres from 'postgres'
import type { DatabaseConnectionConfig } from '../utils/runtimeSetup'
import { buildDatabaseUrl } from '../utils/runtimeSetup'

type SetupDatabaseClient = ReturnType<typeof postgres>

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`
}

function createSetupDatabaseClient(connection: DatabaseConnectionConfig) {
  return postgres(buildDatabaseUrl(connection), {
    max: 1,
    prepare: false,
  })
}

function toDatabaseSetupError(error: unknown, prefix: string) {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    return error
  }

  const message = error instanceof Error ? error.message : 'Unknown database error'

  return createError({
    statusCode: 500,
    statusMessage: `${prefix}: ${message}`,
  })
}

async function closeSetupDatabaseClient(client: SetupDatabaseClient) {
  await client.end({ timeout: 5 }).catch(() => {})
}

export async function testDatabaseConnection(connection: DatabaseConnectionConfig) {
  const client = createSetupDatabaseClient(connection)

  try {
    const result = await client<{
      databaseName: string
      currentUser: string
    }[]>`
      SELECT
        current_database() AS "databaseName",
        current_user AS "currentUser"
    `

    return result[0] || {
      databaseName: connection.databaseName,
      currentUser: connection.username,
    }
  } catch (error) {
    throw toDatabaseSetupError(error, 'PostgreSQL connection test failed')
  } finally {
    await closeSetupDatabaseClient(client)
  }
}

export async function bootstrapDatabase(connection: DatabaseConnectionConfig) {
  const client = createSetupDatabaseClient(connection)
  const articlesTable = quoteIdentifier(connection.articleTableName)
  const slugIndex = quoteIdentifier(`${connection.articleTableName}_slug_idx`)
  const publishedIndex = quoteIdentifier(`${connection.articleTableName}_published_idx`)
  const updatedAtIndex = quoteIdentifier(`${connection.articleTableName}_updated_at_idx`)

  try {
    await client`select 1`

    try {
      await client.unsafe('CREATE EXTENSION IF NOT EXISTS pgcrypto')
    } catch {
      // Some managed Postgres providers disallow extension creation but already expose `gen_random_uuid()`.
    }

    try {
      await client.unsafe('SELECT gen_random_uuid()')
    } catch {
      throw createError({
        statusCode: 500,
        statusMessage: 'Connected to PostgreSQL, but `gen_random_uuid()` is unavailable. Please enable pgcrypto on the target database.',
      })
    }

    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS ${articlesTable} (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug text NOT NULL UNIQUE,
        title text NOT NULL,
        summary text NOT NULL DEFAULT '',
        cover_image text NOT NULL DEFAULT '',
        cover_layout text NOT NULL DEFAULT 'split-right',
        content text NOT NULL,
        published boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)

    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        key text PRIMARY KEY,
        value text NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)

    await client.unsafe(`CREATE INDEX IF NOT EXISTS ${slugIndex} ON ${articlesTable} (slug)`)
    await client.unsafe(`CREATE INDEX IF NOT EXISTS ${publishedIndex} ON ${articlesTable} (published)`)
    await client.unsafe(`CREATE INDEX IF NOT EXISTS ${updatedAtIndex} ON ${articlesTable} (updated_at)`)
    await client.unsafe(`ALTER TABLE ${articlesTable} ADD COLUMN IF NOT EXISTS cover_layout text NOT NULL DEFAULT 'split-right'`)
  } catch (error) {
    throw toDatabaseSetupError(error, 'PostgreSQL initialization failed')
  } finally {
    await closeSetupDatabaseClient(client)
  }
}
