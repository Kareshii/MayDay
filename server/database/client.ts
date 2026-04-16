import { createError } from 'h3'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { getDatabaseSchema } from './schema'
import { getConfiguredArticleTableName, getConfiguredDatabaseUrl } from '../utils/runtimeSetup'

function createDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    max: 1,
    prepare: false,
  })

  return drizzle(client, { schema: getDatabaseSchema() })
}

type Database = ReturnType<typeof createDatabase>

let dbInstance: Database | null = null
let dbKey: string | null = null

export function isDatabaseConfigured() {
  return Boolean(getConfiguredDatabaseUrl())
}

export function useDatabase() {
  const databaseUrl = getConfiguredDatabaseUrl()
  const databaseKey = `${databaseUrl}::${getConfiguredArticleTableName()}`

  if (dbInstance && dbKey === databaseKey) {
    return dbInstance
  }

  if (!databaseUrl) {
    throw createError({
      statusCode: 503,
      statusMessage: 'DATABASE_URL is not configured. Complete the first-run setup before using the CMS.',
    })
  }

  dbKey = databaseKey
  dbInstance = createDatabase(databaseUrl)
  return dbInstance
}
