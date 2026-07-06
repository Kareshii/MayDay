import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { asc, eq, inArray, sql } from 'drizzle-orm'
import { useDatabase } from '../database/client'
import {
  adminCategories,
  adminComments,
  adminFriendLinks,
  adminNavigation,
  adminSettings,
} from '../database/schema'
import { getConfiguredArticleTableName, getConfiguredDatabaseUrl } from './runtimeSetup'

type NavigationType = 'internal' | 'external'
type CommentStatus = 'pending' | 'approved' | 'spam'
type ThumbnailMode = 'contain' | 'longest' | 'cover'

export interface SiteSettings {
  siteName: string
  siteLogo: string
  homeHeroTitleLine1: string
  homeHeroTitleLine2: string
  homeHeroSubtitle: string
  icpNumber: string
  copyright: string
  adminPath: string
  siteEnabled: boolean
  closedMessage: string
}

export interface SeoSettings {
  title: string
  description: string
  keywords: string
}

export interface NavigationItem {
  id: string
  title: string
  path: string
  type: NavigationType
  parentId: string
  order: number
  enabled: boolean
}

export interface ContentSettings {
  autoFetchRemoteImages: boolean
  filterExternalLinks: boolean
  compressImages: boolean
  imageMaxWidth: number
  imageMaxHeight: number
  thumbnailWidth: number
  thumbnailHeight: number
  thumbnailMode: ThumbnailMode
  defaultThumbnail: string
}

export interface CategoryItem {
  id: string
  name: string
  slug: string
  parentId: string
  order: number
  description: string
}

export interface CommentItem {
  id: string
  author: string
  email: string
  articleSlug: string
  content: string
  status: CommentStatus
  createdAt: string
  updatedAt: string
}

export interface FriendLinkItem {
  id: string
  title: string
  url: string
  description: string
  order: number
  enabled: boolean
}

export interface FeatureSettings {
  robotsText: string
  sitemapEnabled: boolean
  sitemapFormat: 'txt' | 'xml'
  baiduPushToken: string
  bingPushToken: string
  searchPushScript: string
  friendLinks: FriendLinkItem[]
}

export interface AdminFeatureState {
  site: SiteSettings
  seo: SeoSettings
  navigation: NavigationItem[]
  content: ContentSettings
  categories: CategoryItem[]
  comments: CommentItem[]
  features: FeatureSettings
  updatedAt: string
}

interface AdminFeatureStateInput {
  site?: Partial<SiteSettings>
  seo?: Partial<SeoSettings>
  navigation?: Partial<NavigationItem>[]
  content?: Partial<ContentSettings>
  categories?: Partial<CategoryItem>[]
  comments?: Partial<CommentItem>[]
  features?: Partial<FeatureSettings>
  updatedAt?: string
}

export type AdminFeatureSection = keyof Pick<
  AdminFeatureState,
  'site' | 'seo' | 'navigation' | 'content' | 'categories' | 'comments' | 'features'
>

type SettingSection = Extract<AdminFeatureSection, 'site' | 'seo' | 'content' | 'features'>

export const ADMIN_FEATURE_SECTIONS: AdminFeatureSection[] = [
  'site',
  'seo',
  'navigation',
  'content',
  'categories',
  'comments',
  'features',
]

const SETTING_SECTIONS: SettingSection[] = ['site', 'seo', 'content', 'features']
const LEGACY_STORE_FILE = resolve(process.cwd(), '.data', 'admin-features.json')
const MIGRATION_SETTING_KEY = 'admin_features_migrated_from_file'

const nowIso = () => new Date().toISOString()
let adminFeatureBootstrapPromise: Promise<void> | null = null
let adminFeatureBootstrapKey: string | null = null

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'mayday.life',
  siteLogo: '',
  homeHeroTitleLine1: 'Hi，Kareshi',
  homeHeroTitleLine2: '继续唱。',
  homeHeroSubtitle: '星星在闪烁，你会怎么说。',
  icpNumber: '',
  copyright: 'Copyright © mayday.life',
  adminPath: '/admin',
  siteEnabled: true,
  closedMessage: '网站维护中，请稍后再访问。',
}

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  title: 'mayday.life',
  description: '五月天档案、文章和互动页面。',
  keywords: 'mayday, 五月天, blog',
}

const defaultState: AdminFeatureState = {
  site: { ...DEFAULT_SITE_SETTINGS },
  seo: { ...DEFAULT_SEO_SETTINGS },
  navigation: [
    {
      id: 'home',
      title: '主页',
      path: '/',
      type: 'internal',
      parentId: '',
      order: 1,
      enabled: true,
    },
    {
      id: 'posts',
      title: '文章',
      path: '/posts',
      type: 'internal',
      parentId: '',
      order: 2,
      enabled: true,
    },
  ],
  content: {
    autoFetchRemoteImages: false,
    filterExternalLinks: false,
    compressImages: false,
    imageMaxWidth: 1600,
    imageMaxHeight: 1600,
    thumbnailWidth: 250,
    thumbnailHeight: 250,
    thumbnailMode: 'cover',
    defaultThumbnail: '',
  },
  categories: [],
  comments: [],
  features: {
    robotsText: [
      'User-agent: *',
      'Allow: /',
      '',
      'Sitemap: /sitemap.txt',
    ].join('\n'),
    sitemapEnabled: true,
    sitemapFormat: 'txt',
    baiduPushToken: '',
    bingPushToken: '',
    searchPushScript: '',
    friendLinks: [],
  },
  updatedAt: nowIso(),
}

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(defaultState)) as AdminFeatureState
}

function normalizeBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeNumber(value: unknown, fallback: number) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : fallback
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeDateString(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString()
  }

  return normalizeString(value)
}

function normalizeNavigationType(value: unknown): NavigationType {
  return value === 'external' ? 'external' : 'internal'
}

function normalizeCommentStatus(value: unknown): CommentStatus {
  return value === 'approved' || value === 'spam' ? value : 'pending'
}

function normalizeThumbnailMode(value: unknown): ThumbnailMode {
  if (value === 'contain' || value === 'longest' || value === 'cover') {
    return value
  }

  return defaultState.content.thumbnailMode
}

function normalizeSiteSettings(input: Partial<SiteSettings> = {}): SiteSettings {
  return {
    siteName: normalizeString(input.siteName) || DEFAULT_SITE_SETTINGS.siteName,
    siteLogo: normalizeString(input.siteLogo),
    homeHeroTitleLine1: normalizeString(input.homeHeroTitleLine1) || DEFAULT_SITE_SETTINGS.homeHeroTitleLine1,
    homeHeroTitleLine2: normalizeString(input.homeHeroTitleLine2) || DEFAULT_SITE_SETTINGS.homeHeroTitleLine2,
    homeHeroSubtitle: normalizeString(input.homeHeroSubtitle) || DEFAULT_SITE_SETTINGS.homeHeroSubtitle,
    icpNumber: normalizeString(input.icpNumber),
    copyright: normalizeString(input.copyright) || DEFAULT_SITE_SETTINGS.copyright,
    adminPath: normalizeString(input.adminPath) || DEFAULT_SITE_SETTINGS.adminPath,
    siteEnabled: normalizeBoolean(input.siteEnabled, true),
    closedMessage: normalizeString(input.closedMessage) || DEFAULT_SITE_SETTINGS.closedMessage,
  }
}

function normalizeSeoSettings(input: Partial<SeoSettings> = {}): SeoSettings {
  return {
    title: normalizeString(input.title) || DEFAULT_SEO_SETTINGS.title,
    description: normalizeString(input.description),
    keywords: normalizeString(input.keywords),
  }
}

function normalizeNavigationItem(input: Partial<NavigationItem>, index: number): NavigationItem {
  return {
    id: normalizeString(input.id) || randomUUID(),
    title: normalizeString(input.title) || '未命名导航',
    path: normalizeString(input.path) || '/',
    type: normalizeNavigationType(input.type),
    parentId: normalizeString(input.parentId),
    order: normalizeNumber(input.order, index + 1),
    enabled: normalizeBoolean(input.enabled, true),
  }
}

function normalizeContentSettings(input: Partial<ContentSettings> = {}): ContentSettings {
  return {
    autoFetchRemoteImages: normalizeBoolean(input.autoFetchRemoteImages),
    filterExternalLinks: normalizeBoolean(input.filterExternalLinks),
    compressImages: normalizeBoolean(input.compressImages),
    imageMaxWidth: normalizeNumber(input.imageMaxWidth, defaultState.content.imageMaxWidth),
    imageMaxHeight: normalizeNumber(input.imageMaxHeight, defaultState.content.imageMaxHeight),
    thumbnailWidth: normalizeNumber(input.thumbnailWidth, defaultState.content.thumbnailWidth),
    thumbnailHeight: normalizeNumber(input.thumbnailHeight, defaultState.content.thumbnailHeight),
    thumbnailMode: normalizeThumbnailMode(input.thumbnailMode),
    defaultThumbnail: normalizeString(input.defaultThumbnail),
  }
}

function normalizeCategoryItem(input: Partial<CategoryItem>, index: number): CategoryItem {
  return {
    id: normalizeString(input.id) || randomUUID(),
    name: normalizeString(input.name) || '未命名分类',
    slug: normalizeString(input.slug) || `category-${index + 1}`,
    parentId: normalizeString(input.parentId),
    order: normalizeNumber(input.order, index + 1),
    description: normalizeString(input.description),
  }
}

function normalizeCommentItem(input: Partial<CommentItem>): CommentItem {
  const createdAt = normalizeDateString(input.createdAt) || nowIso()

  return {
    id: normalizeString(input.id) || randomUUID(),
    author: normalizeString(input.author) || '匿名访客',
    email: normalizeString(input.email),
    articleSlug: normalizeString(input.articleSlug),
    content: normalizeString(input.content),
    status: normalizeCommentStatus(input.status),
    createdAt,
    updatedAt: normalizeDateString(input.updatedAt) || createdAt,
  }
}

function normalizeFriendLinkItem(input: Partial<FriendLinkItem>, index: number): FriendLinkItem {
  return {
    id: normalizeString(input.id) || randomUUID(),
    title: normalizeString(input.title) || '未命名友链',
    url: normalizeString(input.url) || 'https://example.com',
    description: normalizeString(input.description),
    order: normalizeNumber(input.order, index + 1),
    enabled: normalizeBoolean(input.enabled, true),
  }
}

function normalizeFeatureSettings(input: Partial<FeatureSettings> = {}): FeatureSettings {
  return {
    robotsText: typeof input.robotsText === 'string' ? input.robotsText : defaultState.features.robotsText,
    sitemapEnabled: normalizeBoolean(input.sitemapEnabled, true),
    sitemapFormat: input.sitemapFormat === 'xml' ? 'xml' : 'txt',
    baiduPushToken: normalizeString(input.baiduPushToken),
    bingPushToken: normalizeString(input.bingPushToken),
    searchPushScript: typeof input.searchPushScript === 'string' ? input.searchPushScript : '',
    friendLinks: Array.isArray(input.friendLinks)
      ? input.friendLinks.map(normalizeFriendLinkItem)
      : [],
  }
}

function normalizeState(input: AdminFeatureStateInput = {}): AdminFeatureState {
  return {
    site: normalizeSiteSettings(input.site),
    seo: normalizeSeoSettings(input.seo),
    navigation: Array.isArray(input.navigation)
      ? input.navigation.map(normalizeNavigationItem).sort((left, right) => left.order - right.order)
      : cloneDefaultState().navigation,
    content: normalizeContentSettings(input.content),
    categories: Array.isArray(input.categories)
      ? input.categories.map(normalizeCategoryItem).sort((left, right) => left.order - right.order)
      : [],
    comments: Array.isArray(input.comments)
      ? input.comments.map(normalizeCommentItem).sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      : [],
    features: normalizeFeatureSettings(input.features),
    updatedAt: normalizeDateString(input.updatedAt) || nowIso(),
  }
}

function mergeFeaturesForStorage(features: FeatureSettings) {
  return {
    ...features,
    friendLinks: [],
  }
}

function parseSettingValue<T>(value: string | undefined, fallback: T): T {
  if (!value) {
    return fallback
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function parseFeatureSettingRows(rows: { key: string, value: string }[]) {
  const settings = new Map(rows.map(row => [row.key, row.value]))

  return {
    site: normalizeSiteSettings(parseSettingValue<Partial<SiteSettings>>(settings.get('site'), defaultState.site)),
    seo: normalizeSeoSettings(parseSettingValue<Partial<SeoSettings>>(settings.get('seo'), defaultState.seo)),
    content: normalizeContentSettings(parseSettingValue<Partial<ContentSettings>>(settings.get('content'), defaultState.content)),
    features: normalizeFeatureSettings(parseSettingValue<Partial<FeatureSettings>>(
      settings.get('features'),
      defaultState.features,
    )),
  }
}

function serializeNavigationRows(rows: Array<typeof adminNavigation.$inferSelect>) {
  return rows.length
    ? rows.map((row, index) => normalizeNavigationItem({
        id: row.id,
        title: row.title,
        path: row.path,
        type: row.type as NavigationType,
        parentId: row.parentId,
        order: row.order,
        enabled: row.enabled,
      }, index))
    : cloneDefaultState().navigation
}

function serializeCategoryRows(rows: Array<typeof adminCategories.$inferSelect>) {
  return rows.map((row, index) => normalizeCategoryItem({
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parentId,
    order: row.order,
    description: row.description,
  }, index))
}

function serializeCommentRows(rows: Array<typeof adminComments.$inferSelect>) {
  return rows.map(row => normalizeCommentItem({
    id: row.id,
    author: row.author,
    email: row.email,
    articleSlug: row.articleSlug,
    content: row.content,
    status: row.status as CommentStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }))
}

function serializeFriendLinkRows(rows: Array<typeof adminFriendLinks.$inferSelect>) {
  return rows.map((row, index) => normalizeFriendLinkItem({
    id: row.id,
    title: row.title,
    url: row.url,
    description: row.description,
    order: row.order,
    enabled: row.enabled,
  }, index))
}

async function ensureAdminFeatureSchema() {
  const db = useDatabase()

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      key text PRIMARY KEY,
      value text NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `))
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS admin_navigation (
      id text PRIMARY KEY,
      title text NOT NULL,
      path text NOT NULL,
      link_type text NOT NULL,
      parent_id text NOT NULL DEFAULT '',
      sort_order integer NOT NULL DEFAULT 0,
      enabled boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `))
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS admin_categories (
      id text PRIMARY KEY,
      name text NOT NULL,
      slug text NOT NULL UNIQUE,
      parent_id text NOT NULL DEFAULT '',
      sort_order integer NOT NULL DEFAULT 0,
      description text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `))
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS admin_comments (
      id text PRIMARY KEY,
      author text NOT NULL,
      email text NOT NULL DEFAULT '',
      article_slug text NOT NULL DEFAULT '',
      content text NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `))
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS admin_friend_links (
      id text PRIMARY KEY,
      title text NOT NULL,
      url text NOT NULL,
      description text NOT NULL DEFAULT '',
      sort_order integer NOT NULL DEFAULT 0,
      enabled boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `))
  await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS admin_navigation_order_idx ON admin_navigation (sort_order)'))
  await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS admin_navigation_parent_idx ON admin_navigation (parent_id)'))
  await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS admin_categories_slug_idx ON admin_categories (slug)'))
  await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS admin_categories_parent_idx ON admin_categories (parent_id)'))
  await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS admin_categories_order_idx ON admin_categories (sort_order)'))
  await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS admin_comments_status_idx ON admin_comments (status)'))
  await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS admin_comments_article_slug_idx ON admin_comments (article_slug)'))
  await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS admin_comments_created_at_idx ON admin_comments (created_at)'))
  await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS admin_friend_links_order_idx ON admin_friend_links (sort_order)'))
  await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS admin_friend_links_enabled_idx ON admin_friend_links (enabled)'))
  await db.execute(sql.raw("ALTER TABLE admin_navigation ADD COLUMN IF NOT EXISTS link_type text NOT NULL DEFAULT 'internal'"))
  await db.execute(sql.raw(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'admin_navigation' AND column_name = 'type'
      ) THEN
        EXECUTE 'UPDATE admin_navigation SET link_type = COALESCE(NULLIF("type", ''''), link_type)';
        EXECUTE 'ALTER TABLE admin_navigation DROP COLUMN "type"';
      END IF;
    END $$;
  `))
}

async function replaceSettings(values: Pick<AdminFeatureState, SettingSection>) {
  const db = useDatabase()
  const now = new Date()

  for (const key of SETTING_SECTIONS) {
    await db
      .insert(adminSettings)
      .values({
        key,
        value: JSON.stringify(values[key]),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: adminSettings.key,
        set: {
          value: JSON.stringify(values[key]),
          updatedAt: now,
        },
      })
  }
}

async function replaceNavigation(items: NavigationItem[]) {
  const db = useDatabase()
  const normalized = items.map(normalizeNavigationItem)

  await db.delete(adminNavigation)

  if (!normalized.length) {
    return
  }

  const now = new Date()
  await db.insert(adminNavigation).values(normalized.map(item => ({
    id: item.id,
    title: item.title,
    path: item.path,
    type: item.type,
    parentId: item.parentId,
    order: item.order,
    enabled: item.enabled,
    createdAt: now,
    updatedAt: now,
  })))
}

async function replaceCategories(items: CategoryItem[]) {
  const db = useDatabase()
  const normalized = items.map(normalizeCategoryItem)

  await db.delete(adminCategories)

  if (!normalized.length) {
    return
  }

  const now = new Date()
  await db.insert(adminCategories).values(normalized.map(item => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    parentId: item.parentId,
    order: item.order,
    description: item.description,
    createdAt: now,
    updatedAt: now,
  })))
}

async function replaceComments(items: CommentItem[]) {
  const db = useDatabase()
  const normalized = items.map(normalizeCommentItem)

  await db.delete(adminComments)

  if (!normalized.length) {
    return
  }

  const now = new Date()
  await db.insert(adminComments).values(normalized.map(item => ({
    id: item.id,
    author: item.author,
    email: item.email,
    articleSlug: item.articleSlug,
    content: item.content,
    status: item.status,
    createdAt: new Date(item.createdAt),
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : now,
  })))
}

async function replaceFriendLinks(items: FriendLinkItem[]) {
  const db = useDatabase()
  const normalized = items.map(normalizeFriendLinkItem)

  await db.delete(adminFriendLinks)

  if (!normalized.length) {
    return
  }

  const now = new Date()
  await db.insert(adminFriendLinks).values(normalized.map(item => ({
    id: item.id,
    title: item.title,
    url: item.url,
    description: item.description,
    order: item.order,
    enabled: item.enabled,
    createdAt: now,
    updatedAt: now,
  })))
}

async function saveStateToDatabase(state: AdminFeatureState) {
  const normalized = normalizeState(state)
  await replaceSettings(normalized)
  await replaceNavigation(normalized.navigation)
  await replaceCategories(normalized.categories)
  await replaceComments(normalized.comments)
  await replaceFriendLinks(normalized.features.friendLinks)
}

async function readLegacyState() {
  try {
    const raw = await readFile(LEGACY_STORE_FILE, 'utf8')
    return normalizeState(JSON.parse(raw) as Partial<AdminFeatureState>)
  } catch {
    return null
  }
}

async function hasMigratedLegacyFile() {
  const db = useDatabase()
  const rows = await db
    .select({ value: adminSettings.value })
    .from(adminSettings)
    .where(eq(adminSettings.key, MIGRATION_SETTING_KEY))
    .limit(1)

  return rows[0]?.value === 'true'
}

async function markLegacyMigrationDone() {
  const db = useDatabase()
  await db
    .insert(adminSettings)
    .values({
      key: MIGRATION_SETTING_KEY,
      value: 'true',
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: adminSettings.key,
      set: {
        value: 'true',
        updatedAt: new Date(),
      },
    })
}

async function migrateLegacyFileIfNeeded() {
  if (await hasMigratedLegacyFile()) {
    return
  }

  const legacyState = await readLegacyState()

  if (legacyState) {
    await saveStateToDatabase(legacyState)
  }

  await markLegacyMigrationDone()
}

async function readStateFromDatabase() {
  const db = useDatabase()
  const [settingsRows, navigationRows, categoryRows, commentRows, friendLinkRows] = await Promise.all([
    db
      .select()
      .from(adminSettings)
      .where(inArray(adminSettings.key, SETTING_SECTIONS)),
    db.select().from(adminNavigation).orderBy(asc(adminNavigation.order)),
    db.select().from(adminCategories).orderBy(asc(adminCategories.order)),
    db.select().from(adminComments).orderBy(sql`${adminComments.createdAt} desc`),
    db.select().from(adminFriendLinks).orderBy(asc(adminFriendLinks.order)),
  ])

  const settings = parseFeatureSettingRows(settingsRows)

  return normalizeState({
    site: settings.site,
    seo: settings.seo,
    content: settings.content,
    features: {
      ...settings.features,
      friendLinks: serializeFriendLinkRows(friendLinkRows),
    },
    navigation: serializeNavigationRows(navigationRows),
    categories: serializeCategoryRows(categoryRows),
    comments: serializeCommentRows(commentRows),
    updatedAt: nowIso(),
  })
}

async function ensureDefaultSettings() {
  const db = useDatabase()
  const rows = await db
    .select({ key: adminSettings.key })
    .from(adminSettings)
    .where(inArray(adminSettings.key, SETTING_SECTIONS))

  const existingKeys = new Set(rows.map(row => row.key))
  const missingValues = SETTING_SECTIONS
    .filter(key => !existingKeys.has(key))
    .map(key => ({
      key,
      value: JSON.stringify(key === 'features'
        ? mergeFeaturesForStorage(defaultState.features)
        : defaultState[key]),
      updatedAt: new Date(),
    }))

  if (missingValues.length) {
    await db.insert(adminSettings).values(missingValues).onConflictDoNothing()
  }

  const navigationCount = await db.select({ count: sql<number>`count(*)::int` }).from(adminNavigation)

  if (!navigationCount[0]?.count) {
    await replaceNavigation(defaultState.navigation)
  }
}

function getAdminFeatureBootstrapKey() {
  return `${getConfiguredDatabaseUrl() || ''}::${getConfiguredArticleTableName()}`
}

async function ensureAdminFeatureStoreReady() {
  const bootstrapKey = getAdminFeatureBootstrapKey()

  if (!adminFeatureBootstrapPromise || adminFeatureBootstrapKey !== bootstrapKey) {
    adminFeatureBootstrapKey = bootstrapKey
    adminFeatureBootstrapPromise = (async () => {
      await ensureAdminFeatureSchema()
      await migrateLegacyFileIfNeeded()
      await ensureDefaultSettings()
    })().catch((error) => {
      adminFeatureBootstrapPromise = null
      adminFeatureBootstrapKey = null
      throw error
    })
  }

  await adminFeatureBootstrapPromise
}

export async function readAdminFeatureState() {
  await ensureAdminFeatureStoreReady()
  return await readStateFromDatabase()
}

export async function readAdminSettingSections() {
  await ensureAdminFeatureStoreReady()
  const db = useDatabase()
  const [settingsRows, navigationRows] = await Promise.all([
    db
      .select()
      .from(adminSettings)
      .where(inArray(adminSettings.key, ['site', 'seo', 'content'])),
    db.select().from(adminNavigation).orderBy(asc(adminNavigation.order)),
  ])
  const settings = parseFeatureSettingRows(settingsRows)

  return {
    site: settings.site,
    seo: settings.seo,
    navigation: serializeNavigationRows(navigationRows),
    content: settings.content,
  }
}

export async function readAdminSiteSettings() {
  await ensureAdminFeatureStoreReady()
  const db = useDatabase()
  const rows = await db.select().from(adminSettings).where(eq(adminSettings.key, 'site')).limit(1)
  const settings = parseFeatureSettingRows(rows)

  return settings.site
}

export async function readAdminSeoSettings() {
  await ensureAdminFeatureStoreReady()
  const db = useDatabase()
  const rows = await db.select().from(adminSettings).where(eq(adminSettings.key, 'seo')).limit(1)
  const settings = parseFeatureSettingRows(rows)

  return settings.seo
}

export async function readAdminContentSettings() {
  await ensureAdminFeatureStoreReady()
  const db = useDatabase()
  const rows = await db.select().from(adminSettings).where(eq(adminSettings.key, 'content')).limit(1)
  const settings = parseFeatureSettingRows(rows)

  return settings.content
}

export async function readAdminNavigation() {
  await ensureAdminFeatureStoreReady()
  const db = useDatabase()
  const rows = await db.select().from(adminNavigation).orderBy(asc(adminNavigation.order))

  return serializeNavigationRows(rows)
}

export async function readAdminCategories() {
  await ensureAdminFeatureStoreReady()
  const db = useDatabase()
  const rows = await db.select().from(adminCategories).orderBy(asc(adminCategories.order))

  return serializeCategoryRows(rows)
}

export async function readAdminComments() {
  await ensureAdminFeatureStoreReady()
  const db = useDatabase()
  const rows = await db.select().from(adminComments).orderBy(sql`${adminComments.createdAt} desc`)

  return serializeCommentRows(rows)
}

export async function readAdminFeatureSettings() {
  await ensureAdminFeatureStoreReady()
  const db = useDatabase()
  const [settingsRows, friendLinkRows] = await Promise.all([
    db.select().from(adminSettings).where(eq(adminSettings.key, 'features')).limit(1),
    db.select().from(adminFriendLinks).orderBy(asc(adminFriendLinks.order)),
  ])
  const settings = parseFeatureSettingRows(settingsRows)

  return {
    ...settings.features,
    friendLinks: serializeFriendLinkRows(friendLinkRows),
  }
}

export async function readAdminExtensionStats() {
  await ensureAdminFeatureStoreReady()
  const db = useDatabase()
  const [categoryCount, commentCount, pendingCommentCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(adminCategories),
    db.select({ count: sql<number>`count(*)::int` }).from(adminComments),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(adminComments)
      .where(eq(adminComments.status, 'pending')),
  ])

  return {
    categories: categoryCount[0]?.count || 0,
    comments: commentCount[0]?.count || 0,
    pendingComments: pendingCommentCount[0]?.count || 0,
  }
}

export async function initializeAdminFeatureStore() {
  adminFeatureBootstrapPromise = null
  adminFeatureBootstrapKey = null
  await ensureAdminFeatureStoreReady()
}

export async function updateAdminFeatureSection<K extends AdminFeatureSection>(key: K, value: unknown) {
  await ensureAdminFeatureStoreReady()

  const current = await readStateFromDatabase()
  const next = normalizeState({
    ...current,
    [key]: value,
    features: key === 'features'
      ? normalizeFeatureSettings(value as Partial<FeatureSettings>)
      : current.features,
    updatedAt: nowIso(),
  })

  if (key === 'site' || key === 'seo' || key === 'content') {
    await replaceSettings({
      site: next.site,
      seo: next.seo,
      content: next.content,
      features: mergeFeaturesForStorage(next.features),
    })
  } else if (key === 'features') {
    await replaceSettings({
      site: next.site,
      seo: next.seo,
      content: next.content,
      features: mergeFeaturesForStorage(next.features),
    })
    await replaceFriendLinks(next.features.friendLinks)
  } else if (key === 'navigation') {
    await replaceNavigation(next.navigation)
  } else if (key === 'categories') {
    await replaceCategories(next.categories)
  } else if (key === 'comments') {
    await replaceComments(next.comments)
  }

  return next[key]
}
