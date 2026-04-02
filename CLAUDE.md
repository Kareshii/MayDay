# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

This repository is a Nuxt 3 / Vue 3 site with two parallel content systems:

- **Mayday public site content** is still driven by `@nuxt/content` and Markdown files in `content/`
- **Database-backed articles** live in **PostgreSQL (Neon)** and are managed through a CMS-style admin built with **Nuxt + Tailwind CSS v4 + TinyMCE + Drizzle ORM**

The project also contains:

- A public marketing/editorial homepage
- Static interactive pages such as `/balls`, `/mojo`, and `/design`
- A CMS-style admin area under `/admin`
- A local `blog-next/` folder used as a design and architecture reference only

## Important Constraint

`blog-next/` is **not** part of the running Nuxt app.

- Use it as a reference for layout, admin IA, and interaction patterns
- Do not treat it as active runtime code
- Do not wire imports from the Nuxt app into `blog-next/`

## Development Commands

```bash
# Development
pnpm dev                 # Start Nuxt dev server
pnpm build               # Production build
pnpm generate            # Static generate
pnpm preview             # Preview generated build

# Code Quality
pnpm lint                # ESLint
pnpm exec nuxi typecheck # Nuxt/Vue typecheck

# Database (Drizzle ORM)
pnpm db:generate         # Generate SQL migrations
pnpm db:push             # Push schema directly to DB (good for local/dev)
pnpm db:migrate          # Run migrations
pnpm db:studio           # Open Drizzle Studio
```

## Environment Variables

Required for the CMS/database-backed article system:

```bash
DATABASE_URL="postgres://USER:PASSWORD@YOUR-NEON-HOST.neon.tech/DATABASE?sslmode=require"
```

See [`.env.example`](/Users/if/Desktop/code-local/IF/mayday.life/.env.example).

## High-Level Architecture

### 1. Public Mayday Site

Static/public Mayday sections are still file-based:

- `content/1.index.md`
- `content/4.albums.md`
- `content/5.songs.md`
- `content/6.concerts.md`
- `content/7.members.md`
- `content/8.quiz.md`

These pages are rendered through:

- [`app/pages/[...slug].vue`](/Users/if/Desktop/code-local/IF/mayday.life/app/pages/[...slug].vue)

Supporting UI lives in:

- `app/components/content/`
- `app/components/AppNavbar.vue`
- `app/components/AppFooter.vue`
- `app/pages/index.vue`

### 2. Database-Backed Article System

Articles under `/posts` are **not** stored in `content/`.
They are stored in PostgreSQL via Drizzle.

Core files:

- [`server/database/schema.ts`](/Users/if/Desktop/code-local/IF/mayday.life/server/database/schema.ts)
- [`server/database/client.ts`](/Users/if/Desktop/code-local/IF/mayday.life/server/database/client.ts)
- [`server/utils/articleRepository.ts`](/Users/if/Desktop/code-local/IF/mayday.life/server/utils/articleRepository.ts)
- [`shared/types/articles.ts`](/Users/if/Desktop/code-local/IF/mayday.life/shared/types/articles.ts)
- [`shared/utils/articleSlug.ts`](/Users/if/Desktop/code-local/IF/mayday.life/shared/utils/articleSlug.ts)

Public article routes:

- [`app/pages/posts.vue`](/Users/if/Desktop/code-local/IF/mayday.life/app/pages/posts.vue)
- [`app/pages/posts/[slug].vue`](/Users/if/Desktop/code-local/IF/mayday.life/app/pages/posts/[slug].vue)

Public APIs:

- [`server/api/posts/index.get.ts`](/Users/if/Desktop/code-local/IF/mayday.life/server/api/posts/index.get.ts)
- [`server/api/posts/[slug].get.ts`](/Users/if/Desktop/code-local/IF/mayday.life/server/api/posts/[slug].get.ts)

### 3. Admin CMS

The admin area is modeled after `blog-next/app/(cms)/admin`, but adapted to Nuxt/Vue.

Routes:

- [`app/pages/admin/index.vue`](/Users/if/Desktop/code-local/IF/mayday.life/app/pages/admin/index.vue) - dashboard
- [`app/pages/admin/articles/index.vue`](/Users/if/Desktop/code-local/IF/mayday.life/app/pages/admin/articles/index.vue) - article list/search/filter
- [`app/pages/admin/articles/new.vue`](/Users/if/Desktop/code-local/IF/mayday.life/app/pages/admin/articles/new.vue) - create article
- [`app/pages/admin/articles/[id].vue`](/Users/if/Desktop/code-local/IF/mayday.life/app/pages/admin/articles/[id].vue) - edit article
- [`app/pages/admin/settings.vue`](/Users/if/Desktop/code-local/IF/mayday.life/app/pages/admin/settings.vue) - runtime/config summary

Layout and shell:

- [`app/layouts/admin.vue`](/Users/if/Desktop/code-local/IF/mayday.life/app/layouts/admin.vue)
- [`app/components/admin/AdminSidebar.vue`](/Users/if/Desktop/code-local/IF/mayday.life/app/components/admin/AdminSidebar.vue)
- [`app/components/admin/AdminHeader.vue`](/Users/if/Desktop/code-local/IF/mayday.life/app/components/admin/AdminHeader.vue)

Admin CRUD API:

- [`server/api/admin/dashboard.get.ts`](/Users/if/Desktop/code-local/IF/mayday.life/server/api/admin/dashboard.get.ts)
- [`server/api/admin/settings.get.ts`](/Users/if/Desktop/code-local/IF/mayday.life/server/api/admin/settings.get.ts)
- [`server/api/admin/articles/index.get.ts`](/Users/if/Desktop/code-local/IF/mayday.life/server/api/admin/articles/index.get.ts)
- [`server/api/admin/articles/index.post.ts`](/Users/if/Desktop/code-local/IF/mayday.life/server/api/admin/articles/index.post.ts)
- [`server/api/admin/articles/[id].get.ts`](/Users/if/Desktop/code-local/IF/mayday.life/server/api/admin/articles/[id].get.ts)
- [`server/api/admin/articles/[id].put.ts`](/Users/if/Desktop/code-local/IF/mayday.life/server/api/admin/articles/[id].put.ts)
- [`server/api/admin/articles/[id].delete.ts`](/Users/if/Desktop/code-local/IF/mayday.life/server/api/admin/articles/[id].delete.ts)

## UI Stack

The user asked for:

- Tailwind CSS v4

Because this repository is **Vue**, the implementation uses the Vue-compatible equivalent:

- **Tailwind CSS v4**

Key files:

- [`app/components/ui/Button.vue`](/Users/if/Desktop/code-local/IF/mayday.life/app/components/ui/Button.vue)
- [`app/components/ui/Card.vue`](/Users/if/Desktop/code-local/IF/mayday.life/app/components/ui/Card.vue)
- [`app/components/ui/Input.vue`](/Users/if/Desktop/code-local/IF/mayday.life/app/components/ui/Input.vue)
- [`app/components/ui/Textarea.vue`](/Users/if/Desktop/code-local/IF/mayday.life/app/components/ui/Textarea.vue)
- [`app/components/ui/Badge.vue`](/Users/if/Desktop/code-local/IF/mayday.life/app/components/ui/Badge.vue)
- [`app/components/ui/Checkbox.vue`](/Users/if/Desktop/code-local/IF/mayday.life/app/components/ui/Checkbox.vue)
- [`app/utils/cn.ts`](/Users/if/Desktop/code-local/IF/mayday.life/app/utils/cn.ts)

## Rich Text Editing

TinyMCE is used for article editing.

Editor component:

- [`app/components/admin/TinyMceEditor.client.vue`](/Users/if/Desktop/code-local/IF/mayday.life/app/components/admin/TinyMceEditor.client.vue)

Form wrapper:

- [`app/components/admin/ArticleForm.vue`](/Users/if/Desktop/code-local/IF/mayday.life/app/components/admin/ArticleForm.vue)

Notes:

- TinyMCE is self-hosted via npm packages in this repo
- The editor outputs HTML
- Public article detail pages render trusted admin-authored HTML via `v-html`

## Route and Layout Notes

Public shell behavior is controlled in:

- [`app/app.vue`](/Users/if/Desktop/code-local/IF/mayday.life/app/app.vue)

Important:

- Public navbar/footer are hidden on `/design`
- Public navbar/footer are hidden on `/admin`
- `/balls` is intentionally preserved as a standalone interactive page
- `/design` is an experimental editor route and should not be treated as CMS code

## Content Source Rules

When adding or editing content, be clear which system you are touching:

- Use `content/` for **Mayday site sections**
- Use PostgreSQL + Drizzle for **articles under `/posts`**

Do not mix the two systems unless there is a deliberate migration task.

## Database Rules

Schema changes belong in:

- [`server/database/schema.ts`](/Users/if/Desktop/code-local/IF/mayday.life/server/database/schema.ts)

After schema changes:

1. Update the Drizzle schema
2. Run `pnpm db:generate` or `pnpm db:push`
3. Verify admin APIs that depend on the changed columns

## Working Conventions

- Prefer editing Vue/Nuxt runtime code under `app/`, `server/`, and `shared/`
- Treat `blog-next/` as read-only reference unless explicitly asked otherwise
- Prefer adding new admin functionality under the `/admin` layout instead of overloading public pages
- Keep public editorial pages visually aligned with the existing homepage/content design language
- Keep CMS UI aligned with the `blog-next` admin information architecture, but implement it in Vue

## Known Caveats

- `app/utils/editor-core/` is legacy/experimental and may have noisy type issues unrelated to the CMS
- `blog-next/` contains a full separate React/Next app and should not be included in feature work for the Nuxt runtime
- If `DATABASE_URL` is missing, the CMS APIs will fail intentionally

## If You Are Adding CMS Features

The normal path is:

1. Extend the Drizzle schema in `server/database/schema.ts`
2. Update repository methods in `server/utils/articleRepository.ts`
3. Add or update Nitro APIs in `server/api/admin/` or `server/api/posts/`
4. Update admin pages/components under `app/pages/admin/` and `app/components/admin/`
5. Run `pnpm lint`
6. Run `pnpm exec nuxi typecheck`

