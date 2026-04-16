import { defineEventHandler, readBody, createError } from 'h3'
import { getAdminAuthSettings, requireAdminAuthConfiguration, setAdminSession, verifyAdminCredentials } from '../../utils/adminAuth'

interface LoginBody {
  username?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  requireAdminAuthConfiguration()

  const body = await readBody<LoginBody>(event)
  const username = String(body.username || '')
  const password = String(body.password || '')

  if (!verifyAdminCredentials(username, password)) {
    throw createError({
      statusCode: 401,
      statusMessage: '用户名或密码错误',
    })
  }

  const settings = getAdminAuthSettings()
  setAdminSession(event, settings.username)

  return {
    authenticated: true,
    username: settings.username,
  }
})
