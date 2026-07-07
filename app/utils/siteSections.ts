import { mojoItems } from '@/utils/mojoData'

export interface SiteSection {
  path: string
  navTitle: string
  title: string
  eyebrow: string
  description: string
  image: string
  badgeClass: string
  overlayClass: string
  cardClass: string
}

const coverImage = '/cover.jpg'

export const siteSections: SiteSection[] = [
  {
    path: '/',
    navTitle: '主页',
    title: '纯真之后，继续唱',
    eyebrow: 'MAYDAY ARCHIVE',
    description: '把文章、收藏和互动页面收进同一座五月天档案馆。',
    image: coverImage,
    badgeClass: 'border-white/20 bg-white/10 text-white/80',
    overlayClass: 'from-slate-950/88 via-slate-950/58 to-slate-950/30',
    cardClass:
      'hover:border-cyan-400/45 hover:shadow-[0_28px_90px_-55px_rgba(34,211,238,0.8)]',
  },
  {
    path: '/posts',
    navTitle: '文章',
    title: '文章',
    eyebrow: 'POSTS',
    description: '',
    image: coverImage,
    badgeClass: 'border-slate-200/30 bg-slate-100/15 text-slate-50',
    overlayClass: 'from-[#0f172a]/94 via-[#1e293b]/62 to-[#64748b]/18',
    cardClass:
      'hover:border-slate-300/40 hover:shadow-[0_28px_90px_-55px_rgba(100,116,139,0.72)]',
  },
  {
    path: '/balls',
    navTitle: '五球',
    title: '五球盲盒',
    eyebrow: 'BLIND BOX',
    description: '',
    image: coverImage,
    badgeClass: 'border-rose-200/30 bg-rose-100/15 text-rose-50',
    overlayClass: 'from-[#1e0a11]/94 via-[#7f1d1d]/58 to-[#fb7185]/18',
    cardClass:
      'hover:border-rose-300/40 hover:shadow-[0_28px_90px_-55px_rgba(244,63,94,0.72)]',
  },
  {
    path: '/mojo',
    navTitle: 'Mojo Family',
    title: 'Mojo Family',
    eyebrow: 'COLLECTION',
    description: '',
    image: mojoItems[0]?.image ?? coverImage,
    badgeClass: 'border-orange-200/30 bg-orange-100/15 text-orange-50',
    overlayClass: 'from-[#1d1208]/94 via-[#9a3412]/58 to-[#fb923c]/18',
    cardClass:
      'hover:border-orange-300/40 hover:shadow-[0_28px_90px_-55px_rgba(249,115,22,0.72)]',
  },
]

export const primaryNavigation = siteSections.filter(section => section.path !== '/').map(section => ({
  title: section.navTitle,
  path: section.path,
}))

export const showcaseSections = siteSections.filter(section => section.path !== '/')

export const featuredShowcase = showcaseSections[0]

export function getSiteSection(path: string) {
  return siteSections.find(section => section.path === path)
}
