Nuxt 3 + Nitro 一体化部署。

核心是这几点：

开发时跑的是 nuxi dev --host，见 package.json (line 8)。
生产构建时跑 nuxi build，Nitro 会把页面 SSR、server/api/* 接口、server/middleware/* 中间件一起打成一个 Node 服务，见 package.json (line 8) 和 .output/nitro.json (line 3)。
生产启动入口不是你自己再写一个 Express/Koa，而是直接跑 node .output/server/index.mjs。Nitro 产物里已经写明了 preview: node server/index.mjs，见 .output/nitro.json (line 11)。
接口是怎么“生成”的
Nuxt/Nitro 会按目录约定自动注册接口，不需要额外写路由表。

例如这些文件会直接变成 HTTP 接口：

server/api/posts/index.get.ts (line 1)
对应 GET /api/posts
server/api/posts/[slug].get.ts (line 1)
对应 GET /api/posts/:slug
server/api/admin/articles/index.post.ts (line 1)
对应 POST /api/admin/articles
server/api/admin/articles/[id].put.ts (line 1)
对应 PUT /api/admin/articles/:id
也就是说，文件名就是路由和方法定义：

index.get.ts -> GET
index.post.ts -> POST
[id].put.ts -> 动态参数 + PUT
服务端是怎么工作的
这个项目的服务端逻辑主要分三层：

页面 SSR
Nuxt 负责把 app/pages/* 渲染成 HTML 返回给浏览器。

API 层
server/api/* 处理数据请求，比如文章列表、文章详情、后台管理接口。

中间件层
像后台鉴权这种逻辑，会在 server/middleware/* 里统一拦截，再决定放行、401 或 302 跳转。你现在这套后台鉴权就是这样接进去的，见 server/middleware/admin-auth.ts (line 19)。

数据库是在什么时候连上的
数据库不是启动时强连，而是请求命中需要数据库的接口时，才通过 Drizzle + postgres 初始化一个单例连接，见 server/database/client.ts (line 14)。
它依赖 DATABASE_URL，没有这个环境变量时会直接报 503，见 server/database/client.ts (line 19)。

生产环境怎么部署
这项目线上通常是这么跑：

服务器安装 Node / pnpm
拉代码
配环境变量
DATABASE_URL
ADMIN_PASSWORD
ADMIN_USERNAME
ADMIN_SESSION_SECRET
首次同步数据库
pnpm db:push
构建
pnpm build
启动 Node 服务
node .output/server/index.mjs
用 OpenResty/Nginx 反向代理到这个 Node 端口
所以线上拓扑通常是：

OpenResty：处理域名、HTTPS、反向代理、静态缓存
Node/Nitro：处理 SSR 页面和 /api/*
PostgreSQL：存文章和后台数据

严格说可以跑 pnpm generate，但那是静态导出模式，适合纯内容站。

你现在这个仓库已经有：

数据库读写
/api/posts/*
/api/admin/*
登录态鉴权