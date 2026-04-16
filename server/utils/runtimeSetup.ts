import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const DEFAULT_ADMIN_USERNAME = 'admin'
const DEFAULT_ARTICLES_TABLE = 'articles'
const DEFAULT_LOCAL_HOST = '127.0.0.1'
const DEFAULT_REMOTE_PORT = 5432
const RUNTIME_SETUP_FILE = resolve(process.cwd(), '.data', 'runtime-setup.json')
const RUNTIME_SETUP_KEY_FILE = resolve(process.cwd(), '.data', 'runtime-setup.key')

export type DatabaseConnectionMode = 'local' | 'remote'

export interface DatabaseConnectionConfig {
  mode: DatabaseConnectionMode
  host: string
  port: number
  databaseName: string
  username: string
  password: string
  ssl: boolean
  articleTableName: string
}

interface EncryptedPayload {
  data: string
  iv: string
  tag: string
}

interface StoredRuntimeSetup {
  configuredAt?: string
  encryptedDatabaseConfig?: EncryptedPayload
  databaseUrl?: string
  articleTableName?: string
  adminUsername?: string
  adminPasswordHash?: string
  adminPasswordSalt?: string
  adminSessionSecret?: string
}

export interface RuntimeSetupState {
  databaseConfigured: boolean
  authConfigured: boolean
  databaseSource: 'env' | 'file' | 'missing'
  authSource: 'env' | 'file' | 'missing'
  defaultUsername: string
  sessionSecretConfigured: boolean
  setupComplete: boolean
  requiresDatabaseSetup: boolean
  requiresAdminSetup: boolean
  databaseMode: DatabaseConnectionMode | null
  databaseHost: string | null
  databasePort: number | null
  articleTableName: string
}

export interface SaveRuntimeSetupInput {
  databaseMode?: DatabaseConnectionMode
  databaseHost?: string
  databasePort?: number | string
  databaseName?: string
  databaseUsername?: string
  databasePassword?: string
  databaseSsl?: boolean
  articleTableName?: string
  adminUsername?: string
  adminPassword?: string
  adminSessionSecret?: string
}

let cachedConfig: StoredRuntimeSetup | null = null
let configLoaded = false
let cachedEncryptionKey: Buffer | null = null

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

function readStoredRuntimeSetup() {
  if (configLoaded) {
    return cachedConfig || {}
  }

  configLoaded = true

  try {
    const raw = readFileSync(RUNTIME_SETUP_FILE, 'utf8')
    cachedConfig = JSON.parse(raw) as StoredRuntimeSetup
  } catch {
    cachedConfig = null
  }

  return cachedConfig || {}
}

function writeStoredRuntimeSetup(config: StoredRuntimeSetup) {
  mkdirSync(dirname(RUNTIME_SETUP_FILE), { recursive: true })
  writeFileSync(RUNTIME_SETUP_FILE, `${JSON.stringify(config, null, 2)}\n`, 'utf8')
  cachedConfig = config
  configLoaded = true
}

function getEncryptionKey() {
  if (cachedEncryptionKey) {
    return cachedEncryptionKey
  }

  mkdirSync(dirname(RUNTIME_SETUP_KEY_FILE), { recursive: true })

  try {
    const existing = readFileSync(RUNTIME_SETUP_KEY_FILE)

    if (existing.length === 32) {
      cachedEncryptionKey = existing
      return cachedEncryptionKey
    }
  } catch {
    // Ignore and generate a fresh key below.
  }

  const key = randomBytes(32)
  writeFileSync(RUNTIME_SETUP_KEY_FILE, key)
  cachedEncryptionKey = key
  return key
}

function encryptJson(value: unknown): EncryptedPayload {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv)
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(JSON.stringify(value), 'utf8')),
    cipher.final(),
  ])

  return {
    data: encrypted.toString('base64url'),
    iv: iv.toString('base64url'),
    tag: cipher.getAuthTag().toString('base64url'),
  }
}

function decryptJson<T>(payload?: EncryptedPayload): T | null {
  if (!payload?.data || !payload.iv || !payload.tag) {
    return null
  }

  try {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      getEncryptionKey(),
      Buffer.from(payload.iv, 'base64url'),
    )
    decipher.setAuthTag(Buffer.from(payload.tag, 'base64url'))

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.data, 'base64url')),
      decipher.final(),
    ])

    return JSON.parse(decrypted.toString('utf8')) as T
  } catch {
    return null
  }
}

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString('hex')
}

function normalizeTableName(value: string) {
  return String(value || DEFAULT_ARTICLES_TABLE).trim().toLowerCase()
}

function validateTableName(value: string) {
  return /^[a-z_][a-z0-9_]*$/i.test(value)
}

function inferDatabaseModeFromHost(host: string): DatabaseConnectionMode {
  const normalizedHost = String(host || '').trim().toLowerCase()
  return ['localhost', '127.0.0.1', '::1'].includes(normalizedHost) ? 'local' : 'remote'
}

function parseDatabaseUrl(databaseUrl: string, articleTableName = DEFAULT_ARTICLES_TABLE): DatabaseConnectionConfig | null {
  try {
    const url = new URL(databaseUrl)
    const host = url.hostname.trim()

    if (!host) {
      return null
    }

    const sslmode = url.searchParams.get('sslmode')

    return {
      mode: inferDatabaseModeFromHost(host),
      host,
      port: Number.parseInt(url.port || `${DEFAULT_REMOTE_PORT}`, 10) || DEFAULT_REMOTE_PORT,
      databaseName: decodeURIComponent(url.pathname.replace(/^\/+/, '')).trim(),
      username: decodeURIComponent(url.username || '').trim(),
      password: decodeURIComponent(url.password || ''),
      ssl: sslmode === 'require' || sslmode === 'verify-full' || sslmode === 'verify-ca',
      articleTableName: normalizeTableName(articleTableName),
    }
  } catch {
    return null
  }
}

function normalizeDatabaseConnection(input: SaveRuntimeSetupInput): DatabaseConnectionConfig {
  const fallbackHost = input.databaseMode === 'local' ? DEFAULT_LOCAL_HOST : ''
  const host = String(input.databaseHost || fallbackHost).trim()
  const mode: DatabaseConnectionMode = input.databaseMode || inferDatabaseModeFromHost(host)
  const databaseName = String(input.databaseName || '').trim()
  const username = String(input.databaseUsername || '').trim()
  const password = String(input.databasePassword || '')
  const articleTableName = normalizeTableName(String(input.articleTableName || DEFAULT_ARTICLES_TABLE))
  const portInput = String(input.databasePort ?? DEFAULT_REMOTE_PORT).trim()
  const parsedPort = Number.parseInt(portInput, 10)
  const ssl = mode === 'remote'
    ? input.databaseSsl !== false
    : input.databaseSsl === true

  if (!host) {
    throw new Error('DATABASE_HOST_REQUIRED')
  }

  if (!databaseName) {
    throw new Error('DATABASE_NAME_REQUIRED')
  }

  if (!username) {
    throw new Error('DATABASE_USERNAME_REQUIRED')
  }

  if (!password) {
    throw new Error('DATABASE_PASSWORD_REQUIRED')
  }

  if (!/^\d+$/.test(portInput) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error('DATABASE_PORT_INVALID')
  }

  if (!validateTableName(articleTableName)) {
    throw new Error('DATABASE_TABLE_INVALID')
  }

  return {
    mode,
    host,
    port: parsedPort,
    databaseName,
    username,
    password,
    ssl,
    articleTableName,
  }
}

export function resolveDatabaseConnectionInput(input: SaveRuntimeSetupInput) {
  return normalizeDatabaseConnection(input)
}

function getStoredDatabaseConnection() {
  const stored = readStoredRuntimeSetup()
  const decrypted = decryptJson<DatabaseConnectionConfig>(stored.encryptedDatabaseConfig)

  if (decrypted) {
    return {
      ...decrypted,
      articleTableName: normalizeTableName(decrypted.articleTableName || stored.articleTableName || DEFAULT_ARTICLES_TABLE),
    }
  }

  if (stored.databaseUrl) {
    return parseDatabaseUrl(stored.databaseUrl, stored.articleTableName || DEFAULT_ARTICLES_TABLE)
  }

  return null
}

export function buildDatabaseUrl(config: DatabaseConnectionConfig) {
  const url = new URL('postgres://localhost')
  url.hostname = config.host
  url.port = String(config.port)
  url.pathname = `/${encodeURIComponent(config.databaseName)}`
  url.username = config.username
  url.password = config.password

  if (config.ssl) {
    url.searchParams.set('sslmode', 'require')
  }

  return url.toString()
}

export function getConfiguredDatabaseConnection() {
  const envTableName = normalizeTableName(process.env.ARTICLES_TABLE_NAME || DEFAULT_ARTICLES_TABLE)

  if (process.env.DATABASE_URL) {
    const parsed = parseDatabaseUrl(process.env.DATABASE_URL, envTableName)

    if (parsed) {
      return parsed
    }
  }

  const stored = getStoredDatabaseConnection()

  if (!stored) {
    return null
  }

  if (process.env.ARTICLES_TABLE_NAME) {
    return {
      ...stored,
      articleTableName: envTableName,
    }
  }

  return stored
}

export function getConfiguredDatabaseUrl() {
  const config = getConfiguredDatabaseConnection()
  return config ? buildDatabaseUrl(config) : ''
}

export function getConfiguredArticleTableName() {
  return getConfiguredDatabaseConnection()?.articleTableName || normalizeTableName(process.env.ARTICLES_TABLE_NAME || DEFAULT_ARTICLES_TABLE)
}

export function getConfiguredAdminUsername() {
  const stored = readStoredRuntimeSetup()
  return String(process.env.ADMIN_USERNAME || stored.adminUsername || DEFAULT_ADMIN_USERNAME).trim() || DEFAULT_ADMIN_USERNAME
}

export function getConfiguredSessionSecret() {
  const stored = readStoredRuntimeSetup()
  return String(process.env.ADMIN_SESSION_SECRET || stored.adminSessionSecret || process.env.ADMIN_PASSWORD || '').trim()
}

export function hasConfiguredAdminPassword() {
  const stored = readStoredRuntimeSetup()
  return Boolean(process.env.ADMIN_PASSWORD || (stored.adminPasswordHash && stored.adminPasswordSalt))
}

export function verifyConfiguredAdminPassword(password: string) {
  if (process.env.ADMIN_PASSWORD) {
    return safeCompare(password, String(process.env.ADMIN_PASSWORD))
  }

  const stored = readStoredRuntimeSetup()

  if (!stored.adminPasswordHash || !stored.adminPasswordSalt) {
    return false
  }

  return safeCompare(hashPassword(password, stored.adminPasswordSalt), stored.adminPasswordHash)
}

export function getRuntimeSetupState(): RuntimeSetupState {
  const stored = readStoredRuntimeSetup()
  const configuredDatabase = getConfiguredDatabaseConnection()
  const databaseSource = process.env.DATABASE_URL
    ? 'env'
    : configuredDatabase
      ? 'file'
      : 'missing'
  const authSource = process.env.ADMIN_PASSWORD
    ? 'env'
    : stored.adminPasswordHash && stored.adminPasswordSalt
      ? 'file'
      : 'missing'

  const databaseConfigured = databaseSource !== 'missing'
  const authConfigured = authSource !== 'missing'

  return {
    databaseConfigured,
    authConfigured,
    databaseSource,
    authSource,
    defaultUsername: getConfiguredAdminUsername(),
    sessionSecretConfigured: Boolean(getConfiguredSessionSecret()),
    setupComplete: databaseConfigured && authConfigured,
    requiresDatabaseSetup: !databaseConfigured,
    requiresAdminSetup: !authConfigured,
    databaseMode: configuredDatabase?.mode || null,
    databaseHost: configuredDatabase?.host || null,
    databasePort: configuredDatabase?.port || null,
    articleTableName: configuredDatabase?.articleTableName || normalizeTableName(process.env.ARTICLES_TABLE_NAME || stored.articleTableName || DEFAULT_ARTICLES_TABLE),
  }
}

export function saveRuntimeSetup(input: SaveRuntimeSetupInput) {
  const stored = readStoredRuntimeSetup()
  const state = getRuntimeSetupState()

  if (!state.requiresDatabaseSetup && !state.requiresAdminSetup) {
    throw new Error('SETUP_ALREADY_COMPLETED')
  }

  const nextConfig: StoredRuntimeSetup = { ...stored }

  if (state.requiresDatabaseSetup) {
    const databaseConfig = normalizeDatabaseConnection(input)
    nextConfig.encryptedDatabaseConfig = encryptJson(databaseConfig)
    delete nextConfig.articleTableName
    delete nextConfig.databaseUrl
  }

  if (state.requiresAdminSetup) {
    const adminPassword = String(input.adminPassword || '')

    if (!adminPassword) {
      throw new Error('ADMIN_PASSWORD_REQUIRED')
    }

    if (adminPassword.length < 8) {
      throw new Error('ADMIN_PASSWORD_TOO_SHORT')
    }

    const adminUsername = String(input.adminUsername || DEFAULT_ADMIN_USERNAME).trim() || DEFAULT_ADMIN_USERNAME
    const salt = randomBytes(16).toString('hex')

    nextConfig.adminUsername = adminUsername
    nextConfig.adminPasswordSalt = salt
    nextConfig.adminPasswordHash = hashPassword(adminPassword, salt)
    nextConfig.adminSessionSecret = String(input.adminSessionSecret || '').trim() || randomBytes(32).toString('hex')
  }

  if (!nextConfig.configuredAt) {
    nextConfig.configuredAt = new Date().toISOString()
  }

  writeStoredRuntimeSetup(nextConfig)
  return getRuntimeSetupState()
}
