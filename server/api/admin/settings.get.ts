export default defineEventHandler(async () => {
  return {
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    databaseProvider: 'PostgreSQL',
    orm: 'Drizzle ORM',
    editor: 'TinyMCE',
    ui: 'Vue + Tailwind CSS v4 + shadcn 风格组件 + Reka UI primitives',
  }
})
