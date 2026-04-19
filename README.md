# MayDay Blog

一个以五月天为主题的全栈博客项目，基于 **Nuxt 3 + Nitro** 实现前后端一体化，包含：

- 前台内容展示（首页、文章、互动页面）
- 后台 CMS（登录、文章管理、仪表盘、首启配置向导）
- PostgreSQL 持久化（Drizzle ORM）


## 功能概览

- 内容前台
  - 首页视觉化入口（多模块聚合）
  - 文章列表 `/posts` 与详情 `/detail/:slug`
  - 基于 `content/` 的页面路由（如 `/quiz`）
  - `Mojo Family` 收藏页（本地存储状态）
  - `五球盲盒`互动页
- 后台 CMS
  - `/admin` 仪表盘（总量、发布数、草稿数、最近更新）
  - 文章管理（新建、编辑、删除、发布/草稿、预览）
  - 首次部署向导 `/admin/onboarding`
  - 登录态鉴权（HTTP Only Cookie 会话）
- 创意编辑页
  - `/design` 页面集成 Fabric.js + Three.js（仅客户端渲染）

## 技术栈

- 前端：Nuxt 3、Vue 3、TypeScript
- 服务端：Nitro（`server/api` + `server/middleware`）
- 内容：Nuxt Content v3（Markdown 内容集合）
- 样式：Tailwind CSS v4
- 数据库：PostgreSQL + Drizzle ORM / drizzle-kit
- 其他：TinyMCE、Iconify、VueUse

## 项目结构

```text
.
|-- app/                # 前端页面、组件、布局与样式
|-- server/             # API、鉴权中间件、数据库访问
|-- shared/             # 前后端共享类型与工具
|-- content/            # Nuxt Content 页面内容（Markdown）
|-- scripts/            # 安装前校验脚本等
|-- .data/              # 运行时配置（首启后生成）
|-- nuxt.config.ts
`-- package.json
```

## 快速开始

### 1) 环境要求

- Node.js `>= 22.5.0`
- pnpm `>= 10`

> 项目依赖 Nuxt Content 的 `node:sqlite` 能力，Node 版本过低会在 `pnpm install` 阶段被脚本拦截。

### 2) 安装依赖

```bash
pnpm install
```

### 3) 配置环境变量

复制 `.env.example` 到 `.env`，并至少配置以下项：

```env
DATABASE_URL="postgres://USER:PASSWORD@HOST:5432/DB?sslmode=require"
ADMIN_PASSWORD="change-me"
ADMIN_USERNAME="admin"
ADMIN_SESSION_SECRET="replace-with-a-long-random-string"
```

### 4) 启动开发环境

```bash
pnpm dev
```

默认访问：

- 前台：`http://localhost:3000`
- 后台：`http://localhost:3000/admin`

如果数据库/管理员尚未配置，可进入 `/admin/onboarding` 完成首启配置。

## 常用脚本

```bash
pnpm dev          # 本地开发
pnpm build        # 生产构建
pnpm preview      # 预览构建产物
pnpm generate     # 静态导出
pnpm lint         # 代码检查

pnpm db:generate  # 生成迁移
pnpm db:migrate   # 执行迁移
pnpm db:push      # 同步 schema 到数据库
pnpm db:studio    # 启动 drizzle studio
```

## 后端路由说明（摘要）

- 公共接口
  - `GET /api/posts`
  - `GET /api/posts/:slug`
- 管理接口（需登录）
  - `GET /api/admin/dashboard`
  - `GET /api/admin/articles`
  - `POST /api/admin/articles`
  - `GET /api/admin/articles/:id`
  - `PUT /api/admin/articles/:id`
  - `DELETE /api/admin/articles/:id`
  - `POST /api/admin/login`
  - `POST /api/admin/logout`
  - `GET /api/admin/session`
  - `GET/POST /api/admin/setup`

## 部署说明

生产环境标准流程：

```bash
pnpm install
pnpm build
node .output/server/index.mjs
```

推荐使用 Nginx / OpenResty 做反向代理，将流量转发到 Node 服务端口。

仓库已包含 GitHub Actions 工作流（`.github/workflows/nuxthub.yml`），可用于 NuxtHub 自动部署。

## 备注

- 首启向导会将运行时配置写入 `.data/runtime-setup.json`，并用 `.data/runtime-setup.key` 加密数据库连接信息。
- 管理员密码在本地文件中以 hash + salt 形式保存（若未通过环境变量提供）。
