import { createError, readFormData } from 'h3'
import { saveContentImage } from '../../../utils/contentImageStorage'

export default defineEventHandler(async (event) => {
  const form = await readFormData(event)
  const file = form.get('file')

  if (!(file instanceof File)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Image file is required',
    })
  }

  const image = await saveContentImage(file)

  return {
    image,
  }
})
