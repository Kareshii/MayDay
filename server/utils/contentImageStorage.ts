import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import { createError } from 'h3'

const MAX_IMAGE_SIZE = 8 * 1024 * 1024
const DEFAULT_R2_PREFIX = 'content-images'
const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000, immutable'

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

export interface ContentImageItem {
  name: string
  url: string
  size: number
  updatedAt: string
  type: string
}

interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicBaseUrl: string
  prefix: string
  cacheControl: string
}

let r2Client: S3Client | null = null
let cachedContentImageStats: ContentImageStats | null = null
let contentImageStatsFetchedAt = 0
let contentImageStatsRefresh: Promise<ContentImageStats> | null = null

const CONTENT_IMAGE_STATS_TTL = 5 * 60 * 1000

export interface ContentImageStats {
  count: number
  storageSize: number
}

function getR2Config(): R2Config {
  const config = {
    accountId: getEnvValue('R2_ACCOUNT_ID'),
    accessKeyId: getEnvValue('R2_ACCESS_KEY_ID'),
    secretAccessKey: getEnvValue('R2_SECRET_ACCESS_KEY'),
    bucket: getEnvValue('R2_BUCKET'),
    publicBaseUrl: getEnvValue('R2_PUBLIC_BASE_URL').replace(/\/+$/, ''),
    prefix: normalizePrefix(getEnvValue('R2_PREFIX') || DEFAULT_R2_PREFIX),
    cacheControl: getEnvValue('R2_CACHE_CONTROL') || DEFAULT_CACHE_CONTROL,
  }

  const missing = [
    ['R2_ACCOUNT_ID', config.accountId],
    ['R2_ACCESS_KEY_ID', config.accessKeyId],
    ['R2_SECRET_ACCESS_KEY', config.secretAccessKey],
    ['R2_BUCKET', config.bucket],
    ['R2_PUBLIC_BASE_URL', config.publicBaseUrl],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length) {
    throw createError({
      statusCode: 500,
      statusMessage: `R2 config is missing: ${missing.join(', ')}`,
    })
  }

  validateR2Config(config)

  return config
}

function getEnvValue(key: string) {
  const value = process.env[key] || ''
  return value.trim().replace(/^['"]|['"]$/g, '')
}

function normalizePrefix(prefix: string) {
  const normalized = prefix.trim().replace(/^\/+|\/+$/g, '')

  if (!normalized || normalized.includes('..') || !/^[a-zA-Z0-9/_-]+$/.test(normalized)) {
    throw createError({
      statusCode: 500,
      statusMessage: 'R2_PREFIX is invalid',
    })
  }

  return normalized
}

function validateR2Config(config: R2Config) {
  const values = {
    R2_ACCOUNT_ID: config.accountId,
    R2_ACCESS_KEY_ID: config.accessKeyId,
    R2_SECRET_ACCESS_KEY: config.secretAccessKey,
    R2_BUCKET: config.bucket,
  }

  const invalid = Object.entries(values)
    .filter(([, value]) => /[\r\n\t]/.test(value) || /[^\x21-\x7E]/.test(value))
    .map(([key]) => key)

  if (invalid.length) {
    throw createError({
      statusCode: 500,
      statusMessage: `R2 config contains invalid characters: ${invalid.join(', ')}`,
    })
  }
}

function getR2Client() {
  if (r2Client) {
    return r2Client
  }

  const config = getR2Config()
  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })

  return r2Client
}

function ensureUploadFileName(name: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(name) || name.includes('..')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid image name',
    })
  }

  return name
}

function getImageType(name: string) {
  const extension = extname(name).toLowerCase()

  if (extension === '.jpg' || extension === '.jpeg') {
    return 'JPEG'
  }

  if (extension === '.png') {
    return 'PNG'
  }

  if (extension === '.webp') {
    return 'WEBP'
  }

  if (extension === '.gif') {
    return 'GIF'
  }

  return 'IMAGE'
}

function getImageKey(name: string) {
  return `${getR2Config().prefix}/${ensureUploadFileName(name)}`
}

function getImageNameFromKey(key: string) {
  const prefix = `${getR2Config().prefix}/`

  if (!key.startsWith(prefix)) {
    return ''
  }

  return ensureUploadFileName(key.slice(prefix.length))
}

function getImageUrl(name: string) {
  const { publicBaseUrl, prefix } = getR2Config()
  return `${publicBaseUrl}/${prefix}/${encodeURIComponent(ensureUploadFileName(name))}`
}

export async function listContentImages(): Promise<ContentImageItem[]> {
  const config = getR2Config()
  const client = getR2Client()
  const images: ContentImageItem[] = []
  let continuationToken: string | undefined

  do {
    const result = await client.send(new ListObjectsV2Command({
      Bucket: config.bucket,
      Prefix: `${config.prefix}/`,
      ContinuationToken: continuationToken,
    }))

    for (const object of result.Contents || []) {
      if (!object.Key || object.Key.endsWith('/')) {
        continue
      }

      const name = getImageNameFromKey(object.Key)

      if (!name) {
        continue
      }

      images.push({
        name,
        url: getImageUrl(name),
        size: object.Size || 0,
        updatedAt: object.LastModified?.toISOString() || new Date(0).toISOString(),
        type: getImageType(name),
      })
    }

    continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined
  } while (continuationToken)

  const sortedImages = images.sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
  setCachedContentImageStats({
    count: sortedImages.length,
    storageSize: sortedImages.reduce((total, image) => total + image.size, 0),
  })

  return sortedImages
}

function setCachedContentImageStats(stats: ContentImageStats) {
  cachedContentImageStats = stats
  contentImageStatsFetchedAt = Date.now()
}

function isContentImageStatsFresh() {
  return Boolean(cachedContentImageStats && Date.now() - contentImageStatsFetchedAt < CONTENT_IMAGE_STATS_TTL)
}

async function refreshContentImageStats() {
  const images = await listContentImages()
  return {
    count: images.length,
    storageSize: images.reduce((total, image) => total + image.size, 0),
  }
}

export function readCachedContentImageStats(): ContentImageStats {
  if (isContentImageStatsFresh()) {
    return cachedContentImageStats!
  }

  if (!contentImageStatsRefresh) {
    contentImageStatsRefresh = refreshContentImageStats()
      .catch((error) => {
        console.error('[content-images] stats refresh failed:', error)
        const fallback = cachedContentImageStats || { count: 0, storageSize: 0 }
        setCachedContentImageStats(fallback)
        return fallback
      })
      .finally(() => {
        contentImageStatsRefresh = null
      })
  }

  return cachedContentImageStats || { count: 0, storageSize: 0 }
}

export async function saveContentImage(file: File) {
  const type = file.type || ''
  const extension = IMAGE_EXTENSIONS[type]

  if (!extension) {
    throw createError({
      statusCode: 415,
      statusMessage: 'Only JPG, PNG, WEBP and GIF images are supported',
    })
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Image is larger than 8MB',
    })
  }

  const config = getR2Config()
  const client = getR2Client()
  const buffer = Buffer.from(await file.arrayBuffer())
  const name = `${Date.now()}-${randomUUID()}${extension}`
  const key = getImageKey(name)

  await client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: buffer,
    ContentType: type,
    CacheControl: config.cacheControl,
  }))

  const image = {
    name,
    url: getImageUrl(name),
    size: buffer.length,
    updatedAt: new Date().toISOString(),
    type: getImageType(name),
  } satisfies ContentImageItem

  if (cachedContentImageStats) {
    setCachedContentImageStats({
      count: cachedContentImageStats.count + 1,
      storageSize: cachedContentImageStats.storageSize + image.size,
    })
  }

  return image
}

export async function deleteContentImage(name: string) {
  const config = getR2Config()
  const client = getR2Client()

  await client.send(new DeleteObjectCommand({
    Bucket: config.bucket,
    Key: getImageKey(name),
  }))

  contentImageStatsFetchedAt = 0
}
