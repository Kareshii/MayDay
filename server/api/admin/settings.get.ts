import { getAdminAuthSettings } from '../../utils/adminAuth'
import { getRuntimeSetupState } from '../../utils/runtimeSetup'

export default defineEventHandler(async () => {
  const setup = getRuntimeSetupState()
  return {
    databaseConfigured: setup.databaseConfigured,
    databaseProvider: 'PostgreSQL',
    orm: 'Drizzle ORM',
    editor: 'TinyMCE',
    ui: 'Vue + Tailwind CSS v4 + shadcn 风格组件 + Reka UI primitives',
    databaseSource: setup.databaseSource,
    auth: getAdminAuthSettings(),
  }
})
