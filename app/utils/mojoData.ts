export interface MojoItem {
  id: string
  name: string
  description: string
  image: string
}

export const mojoItems: MojoItem[] = [
  {
    id: 'mojo-1',
    name: 'Mojo Classic',
    description: 'The original Mojo that started it all.',
    image: 'https://placehold.co/400x400/orange/white?text=Mojo+Classic'
  },
  {
    id: 'mojo-2',
    name: 'Space Mojo',
    description: 'Ready for interstellar travel.',
    image: 'https://placehold.co/400x400/purple/white?text=Space+Mojo'
  },
  {
    id: 'mojo-3',
    name: 'Detective Mojo',
    description: 'Solving mysteries one carrot at a time.',
    image: 'https://placehold.co/400x400/brown/white?text=Detective+Mojo'
  },
  {
    id: 'mojo-4',
    name: 'Chef Mojo',
    description: 'Cooking up the best veggie stew.',
    image: 'https://placehold.co/400x400/white/black?text=Chef+Mojo'
  },
  {
    id: 'mojo-5',
    name: 'Ninja Mojo',
    description: 'Silent but adorable.',
    image: 'https://placehold.co/400x400/black/white?text=Ninja+Mojo'
  },
  {
    id: 'mojo-6',
    name: 'King Mojo',
    description: 'Ruler of the Carrot Kingdom.',
    image: 'https://placehold.co/400x400/gold/white?text=King+Mojo'
  }
]
