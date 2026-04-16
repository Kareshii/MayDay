import { defineEventHandler } from 'h3'
import { getAdminAuthSettings, readAdminSession } from '../../utils/adminAuth'

export default defineEventHandler((event) => {
  const settings = getAdminAuthSettings()
  const session = readAdminSession(event)

  return {
    authenticated: Boolean(session),
    configured: settings.configured,
    username: session?.username || null,
    defaultUsername: settings.username,
  }
})
