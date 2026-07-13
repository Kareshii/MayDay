export type ManagedRouteKind = 'page' | 'section'

export interface ManagedRouteItem {
  id: string
  title: string
  path: string
  description: string
  kind: ManagedRouteKind
  enabled: boolean
  parentId?: string
}

export interface ManagedRouteGroup {
  id: string
  title: string
  icon: string
  children: ManagedRouteItem[]
}

export interface PublicRouteVisibility {
  id: string
  path: string
  kind: ManagedRouteKind
  enabled: boolean
}

export const DEFAULT_MANAGED_ROUTE_GROUPS: ManagedRouteGroup[] = [
  {
    id: 'main-pages',
    title: '主要页面',
    icon: 'lucide:panels-top-left',
    children: [
      {
        id: 'home',
        title: '首页',
        path: '/',
        description: '站点首页与主要内容入口',
        kind: 'page',
        enabled: true,
      },
      {
        id: 'home-gallery',
        title: '首页图册',
        path: '/#gallery',
        description: '首页图册标题与卡片区域',
        kind: 'section',
        enabled: true,
        parentId: 'home',
      },
      {
        id: 'posts',
        title: '文章列表',
        path: '/posts',
        description: '已发布文章的聚合列表',
        kind: 'page',
        enabled: true,
      },
      {
        id: 'article-detail',
        title: '文章详情',
        path: '/detail/:slug',
        description: '单篇文章与评论详情',
        kind: 'page',
        enabled: true,
      },
    ],
  },
  {
    id: 'interactive-pages',
    title: '互动页面',
    icon: 'lucide:mouse-pointer-click',
    children: [
      {
        id: 'balls',
        title: '五球盲盒',
        path: '/balls',
        description: '成员随机抽取互动页',
        kind: 'page',
        enabled: true,
      },
      {
        id: 'mojo',
        title: 'Mojo Family',
        path: '/mojo',
        description: 'Mojo 收藏展示页',
        kind: 'page',
        enabled: true,
      },
      {
        id: 'design',
        title: '设计工坊',
        path: '/design',
        description: '在线设计与 3D 预览页',
        kind: 'page',
        enabled: true,
      },
    ],
  },
]

export function cloneManagedRouteGroups(groups = DEFAULT_MANAGED_ROUTE_GROUPS) {
  return groups.map(group => ({
    ...group,
    children: group.children.map(route => ({ ...route })),
  }))
}

export function flattenManagedRoutes(groups: ManagedRouteGroup[]): ManagedRouteItem[] {
  return groups.flatMap(group => group.children)
}

export function toPublicRouteVisibility(groups: ManagedRouteGroup[]): PublicRouteVisibility[] {
  return flattenManagedRoutes(groups).map(route => ({
    id: route.id,
    path: route.path,
    kind: route.kind,
    enabled: route.enabled,
  }))
}

export function isPublicRouteEnabled(routes: PublicRouteVisibility[], id: string) {
  return routes.find(route => route.id === id)?.enabled ?? true
}

export function matchesManagedRoutePath(pattern: string, path: string) {
  const patternSegments = pattern.split('/').filter(Boolean)
  const pathSegments = path.split('/').filter(Boolean)

  if (patternSegments.length !== pathSegments.length) {
    return false
  }

  return patternSegments.every((segment, index) => {
    return segment.startsWith(':') || segment === pathSegments[index]
  })
}
