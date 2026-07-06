import { createError, getRouterParam, readBody } from 'h3'
import {
  ADMIN_FEATURE_SECTIONS,
  type AdminFeatureSection,
  updateAdminFeatureSection,
} from '../../../utils/adminFeatureStore'

function normalizeSection(value: string | undefined): AdminFeatureSection {
  if (ADMIN_FEATURE_SECTIONS.includes(value as AdminFeatureSection)) {
    return value as AdminFeatureSection
  }

  throw createError({
    statusCode: 404,
    statusMessage: 'Admin feature section not found',
  })
}

export default defineEventHandler(async (event) => {
  const section = normalizeSection(getRouterParam(event, 'section'))
  const body = await readBody<Record<string, unknown>>(event)
  const value = body[section]

  if (value === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Section payload is required',
    })
  }

  return {
    [section]: await updateAdminFeatureSection(section, value),
  }
})
