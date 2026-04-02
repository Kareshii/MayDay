import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    /**
     * This is collection for content-wind theme
     * Create `content.config.ts` in project root to overwrite this
     */
    content: defineCollection({
      type: 'page',
      source: '**',
      schema: z.object({
        layout: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        summary: z.string().optional(),
        coverImage: z.string().optional(),
        published: z.boolean().optional(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
      }),
    }),
  },
})
