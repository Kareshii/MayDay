import { createError } from 'h3'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type Database = PostgresJsDatabase<typeof schema>

let dbInstance: Database | null = null

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL)
}

export function useDatabase() {
  if (dbInstance) {
    return dbInstance
  }

  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw createError({
      statusCode: 503,
      statusMessage: 'DATABASE_URL is not configured. Point it to your Neon PostgreSQL database.',
    })
  }

  const client = postgres(databaseUrl, {
    max: 1,
    prepare: false,
  })

  dbInstance = drizzle(client, { schema })
  return dbInstance
}
