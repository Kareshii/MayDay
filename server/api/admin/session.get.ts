import { defineEventHandler } from 'h3'
import { getAdminAuthSettings, readAdminSession } from '../../utils/adminAuth'
import { getRuntimeSetupState } from '../../utils/runtimeSetup'

export default defineEventHandler((event) => {
  const settings = getAdminAuthSettings()
  const setup = getRuntimeSetupState()
  const session = readAdminSession(event)

  return {
    authenticated: Boolean(session),
    configured: settings.configured,
    databaseConfigured: setup.databaseConfigured,
    authConfigured: setup.authConfigured,
    username: session?.username || null,
    defaultUsername: settings.username,
  }
})
