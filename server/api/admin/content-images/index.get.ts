import { listContentImages } from '../../../utils/contentImageStorage'

export default defineEventHandler(async () => {
  const images = await listContentImages()

  return {
    images,
  }
})
