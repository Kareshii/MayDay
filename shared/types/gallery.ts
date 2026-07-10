export interface HomeGalleryItem {
  id: string
  title: string
  category: string
  image: string
  description: string
  content: string
  images: string[]
  order: number
  enabled: boolean
}

export interface HomeGallerySettings {
  enabled: boolean
  title: string
  subtitle: string
  items: HomeGalleryItem[]
}
