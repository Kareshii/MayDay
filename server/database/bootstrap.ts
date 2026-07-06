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
        pinned boolean NOT NULL DEFAULT false,
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

    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS admin_navigation (
        id text PRIMARY KEY,
        title text NOT NULL,
        path text NOT NULL,
        link_type text NOT NULL,
        parent_id text NOT NULL DEFAULT '',
        sort_order integer NOT NULL DEFAULT 0,
        enabled boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)

    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS admin_categories (
        id text PRIMARY KEY,
        name text NOT NULL,
        slug text NOT NULL UNIQUE,
        parent_id text NOT NULL DEFAULT '',
        sort_order integer NOT NULL DEFAULT 0,
        description text NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)

    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS admin_comments (
        id text PRIMARY KEY,
        author text NOT NULL,
        email text NOT NULL DEFAULT '',
        article_slug text NOT NULL DEFAULT '',
        content text NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)

    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS admin_friend_links (
        id text PRIMARY KEY,
        title text NOT NULL,
        url text NOT NULL,
        description text NOT NULL DEFAULT '',
        sort_order integer NOT NULL DEFAULT 0,
        enabled boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)

    await client.unsafe(`ALTER TABLE ${articlesTable} ADD COLUMN IF NOT EXISTS cover_layout text NOT NULL DEFAULT 'split-right'`)
    await client.unsafe(`ALTER TABLE ${articlesTable} ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false`)
    await client.unsafe(`CREATE INDEX IF NOT EXISTS ${slugIndex} ON ${articlesTable} (slug)`)
    await client.unsafe(`CREATE INDEX IF NOT EXISTS ${publishedIndex} ON ${articlesTable} (published)`)
    await client.unsafe(`CREATE INDEX IF NOT EXISTS ${quoteIdentifier(`${connection.articleTableName}_pinned_idx`)} ON ${articlesTable} (pinned)`)
    await client.unsafe(`CREATE INDEX IF NOT EXISTS ${updatedAtIndex} ON ${articlesTable} (updated_at)`)
    await client.unsafe("ALTER TABLE admin_navigation ADD COLUMN IF NOT EXISTS link_type text NOT NULL DEFAULT 'internal'")
    await client.unsafe(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'admin_navigation' AND column_name = 'type'
        ) THEN
          EXECUTE 'UPDATE admin_navigation SET link_type = COALESCE(NULLIF("type", ''''), link_type)';
          EXECUTE 'ALTER TABLE admin_navigation DROP COLUMN "type"';
        END IF;
      END $$;
    `)
    await client.unsafe('CREATE INDEX IF NOT EXISTS admin_navigation_order_idx ON admin_navigation (sort_order)')
    await client.unsafe('CREATE INDEX IF NOT EXISTS admin_navigation_parent_idx ON admin_navigation (parent_id)')
    await client.unsafe('CREATE INDEX IF NOT EXISTS admin_categories_slug_idx ON admin_categories (slug)')
    await client.unsafe('CREATE INDEX IF NOT EXISTS admin_categories_parent_idx ON admin_categories (parent_id)')
    await client.unsafe('CREATE INDEX IF NOT EXISTS admin_categories_order_idx ON admin_categories (sort_order)')
    await client.unsafe('CREATE INDEX IF NOT EXISTS admin_comments_status_idx ON admin_comments (status)')
    await client.unsafe('CREATE INDEX IF NOT EXISTS admin_comments_article_slug_idx ON admin_comments (article_slug)')
    await client.unsafe('CREATE INDEX IF NOT EXISTS admin_comments_created_at_idx ON admin_comments (created_at)')
    await client.unsafe('CREATE INDEX IF NOT EXISTS admin_friend_links_order_idx ON admin_friend_links (sort_order)')
    await client.unsafe('CREATE INDEX IF NOT EXISTS admin_friend_links_enabled_idx ON admin_friend_links (enabled)')
  } catch (error) {
    throw toDatabaseSetupError(error, 'PostgreSQL initialization failed')
  } finally {
    await closeSetupDatabaseClient(client)
  }
}
