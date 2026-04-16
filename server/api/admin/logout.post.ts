import { defineEventHandler } from 'h3'
import { clearAdminSession } from '../../utils/adminAuth'

export default defineEventHandler((event) => {
  clearAdminSession(event)

  return {
    ok: true,
  }
})
