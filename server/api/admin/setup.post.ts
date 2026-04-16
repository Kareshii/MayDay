import { createError, defineEventHandler, readBody } from 'h3'
import { bootstrapDatabase, testDatabaseConnection } from '../../database/bootstrap'
import {
  getConfiguredAdminUsername,
  getRuntimeSetupState,
  resolveDatabaseConnectionInput,
  saveRuntimeSetup,
  type SaveRuntimeSetupInput,
} from '../../utils/runtimeSetup'
import { setAdminSession } from '../../utils/adminAuth'

type SetupBody = SaveRuntimeSetupInput & {
  dryRun?: boolean
}

function toSetupErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Setup failed'
  }

  switch (error.message) {
    case 'SETUP_ALREADY_COMPLETED':
      return 'Setup has already been completed.'
    case 'DATABASE_HOST_REQUIRED':
      return 'Please enter a database host.'
    case 'DATABASE_NAME_REQUIRED':
      return 'Please enter a database name.'
    case 'DATABASE_USERNAME_REQUIRED':
      return 'Please enter a database username.'
    case 'DATABASE_PASSWORD_REQUIRED':
      return 'Please enter a database password.'
    case 'DATABASE_PORT_INVALID':
      return 'Please enter a valid database port.'
    case 'DATABASE_TABLE_INVALID':
      return 'Table name can only contain letters, numbers, and underscores, and must not start with a number.'
    case 'ADMIN_PASSWORD_REQUIRED':
      return 'Please set an admin password.'
    case 'ADMIN_PASSWORD_TOO_SHORT':
      return 'Admin password must be at least 8 characters long.'
    default:
      return error.message
  }
}

export default defineEventHandler(async (event) => {
  const state = getRuntimeSetupState()

  if (state.setupComplete) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Setup has already been completed.',
    })
  }

  const body = await readBody<SetupBody>(event)

  try {
    if (body.dryRun) {
      const connection = resolveDatabaseConnectionInput(body)
      const result = await testDatabaseConnection(connection)

      return {
        ok: true,
        databaseName: result.databaseName,
        currentUser: result.currentUser,
      }
    }

    if (state.requiresDatabaseSetup) {
      const connection = resolveDatabaseConnectionInput(body)
      await bootstrapDatabase(connection)
    }

    const nextState = saveRuntimeSetup(body)

    if (nextState.authConfigured) {
      setAdminSession(event, getConfiguredAdminUsername())
    }

    return {
      ...nextState,
      redirectTo: '/admin',
    }
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: toSetupErrorMessage(error),
    })
  }
})
