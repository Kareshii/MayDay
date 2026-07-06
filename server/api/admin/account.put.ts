import { createError, readBody } from 'h3'
import { setAdminSession } from '../../utils/adminAuth'
import { updateStoredAdminCredentials, type UpdateAdminCredentialsInput } from '../../utils/runtimeSetup'

function toAccountErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Account update failed'
  }

  switch (error.message) {
    case 'ADMIN_PASSWORD_MANAGED_BY_ENV':
      return 'Admin password is managed by environment variables and cannot be changed here.'
    case 'ADMIN_CURRENT_PASSWORD_INVALID':
      return 'Current password is incorrect.'
    case 'ADMIN_PASSWORD_REQUIRED':
      return 'Please enter a new password.'
    case 'ADMIN_PASSWORD_TOO_SHORT':
      return 'Admin password must be at least 8 characters long.'
    default:
      return error.message
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<UpdateAdminCredentialsInput>(event)

  try {
    const state = updateStoredAdminCredentials(body)
    setAdminSession(event, state.defaultUsername)

    return {
      auth: {
        username: state.defaultUsername,
        source: state.authSource,
        sessionSecretConfigured: state.sessionSecretConfigured,
      },
    }
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: toAccountErrorMessage(error),
    })
  }
})
