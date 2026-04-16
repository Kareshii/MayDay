import { createError, deleteCookie, getCookie, setCookie, type H3Event } from 'h3'
import { createHmac, timingSafeEqual } from 'node:crypto'
import {
  getConfiguredAdminUsername,
  getConfiguredSessionSecret,
  getRuntimeSetupState,
  hasConfiguredAdminPassword,
  verifyConfiguredAdminPassword,
} from './runtimeSetup'

const ADMIN_SESSION_COOKIE = 'mayday_admin_session'
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

interface AdminSessionPayload {
  username: string
  expiresAt: number
}

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString('base64url')
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function getSessionSecret() {
  return getConfiguredSessionSecret()
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

function signValue(value: string) {
  return createHmac('sha256', getSessionSecret()).update(value).digest('base64url')
}

function parseSessionPayload(token: string): AdminSessionPayload | null {
  const [encodedPayload, signature] = token.split('.')

  if (!encodedPayload || !signature) {
    return null
  }

  const expectedSignature = signValue(encodedPayload)

  if (!safeCompare(signature, expectedSignature)) {
    return null
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as Partial<AdminSessionPayload>

    if (typeof payload.username !== 'string' || typeof payload.expiresAt !== 'number') {
      return null
    }

    if (payload.expiresAt <= Date.now()) {
      return null
    }

    return {
      username: payload.username,
      expiresAt: payload.expiresAt,
    }
  } catch {
    return null
  }
}

export function isAdminAuthConfigured() {
  return hasConfiguredAdminPassword()
}

export function getAdminAuthSettings() {
  const state = getRuntimeSetupState()

  return {
    configured: isAdminAuthConfigured(),
    username: getConfiguredAdminUsername(),
    sessionSecretConfigured: state.sessionSecretConfigured,
    source: state.authSource,
    sessionTtlHours: ADMIN_SESSION_TTL_SECONDS / 60 / 60,
  }
}

export function verifyAdminCredentials(username: string, password: string) {
  if (!isAdminAuthConfigured()) {
    return false
  }

  return safeCompare(username.trim(), getConfiguredAdminUsername()) && verifyConfiguredAdminPassword(password)
}

export function createAdminSession(username: string) {
  const payload = encodeBase64Url(JSON.stringify({
    username,
    expiresAt: Date.now() + (ADMIN_SESSION_TTL_SECONDS * 1000),
  } satisfies AdminSessionPayload))

  return `${payload}.${signValue(payload)}`
}

export function readAdminSession(event: H3Event) {
  if (!isAdminAuthConfigured()) {
    return null
  }

  const token = getCookie(event, ADMIN_SESSION_COOKIE)

  if (!token) {
    return null
  }

  return parseSessionPayload(token)
}

export function setAdminSession(event: H3Event, username: string) {
  setCookie(event, ADMIN_SESSION_COOKIE, createAdminSession(username), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  })
}

export function clearAdminSession(event: H3Event) {
  deleteCookie(event, ADMIN_SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
}

export function requireAdminSession(event: H3Event) {
  const session = readAdminSession(event)

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  return session
}

export function requireAdminAuthConfiguration() {
  if (isAdminAuthConfigured()) {
    return
  }

  throw createError({
    statusCode: 503,
    statusMessage: 'Admin authentication is not configured. Complete the first-run setup before using /admin.',
  })
}
