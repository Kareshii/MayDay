import { getAdminAuthSettings } from '../../utils/adminAuth'
import { getRuntimeSetupState, getConfiguredDatabaseUrl } from '../../utils/runtimeSetup'

export default defineEventHandler(async () => {
  const setup = getRuntimeSetupState()
  return {
    databaseConfigured: setup.databaseConfigured,
    databaseProvider: 'PostgreSQL',
    databaseUrl: getConfiguredDatabaseUrl(),
    orm: 'Drizzle ORM',
    editor: 'TinyMCE 富文本编辑器 + HTML 渲染',
    ui: 'Vue + Tailwind CSS v4 + shadcn 风格组件 + Reka UI primitives',
    databaseSource: setup.databaseSource,
    auth: getAdminAuthSettings(),
  }
})
