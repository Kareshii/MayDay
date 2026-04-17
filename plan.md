CMS 视觉重构计划（Nuxt 主项目，按 stitch* 体系）
Summary
目标是把 Nuxt 主项目后台（含登录与初始化向导）重构为 stitch* 的“Architectural Curator”视觉语言，不改后端接口与业务模型。
实施顺序采用 4 层：设计 token 与主题作用域、后台壳层（Sidebar/Header/Layout）、页面重排、共享 UI 控件统一。
你确认的关键取舍会落地为默认策略：偏原型顶部栏、仅文章页可用顶部搜索、登录/向导保留居中卡片、保留明暗双主题、不新增 taxonomy 功能页。
Implementation Changes
在 app/assets/css/main.css 增加后台专用主题作用域（如 .cms-theme）与 light/dark token 集合。
后台 token 采用 stitch\_ 的层级语义（surface/container/primary/tertiary/focus glow），并落实“弱边框/背景分层优先”规则，避免硬分割线。
在 app/app.vue 对 /admin\* 路由挂载后台主题作用域，确保前台页面视觉不被污染。
重构 app/layouts/admin.vue 为原型壳层：左侧浮动侧栏 + 右侧内容区 + 轻玻璃顶栏，保留移动端抽屉行为。
重构 AdminSidebar：品牌区、导航激活态、底部 “Create New Post” 渐变 CTA、顶部与底部留白（blade/floating 感）。
重构 AdminHeader：按“偏原型”改为搜索主导顶部栏，保留退出登录与主题切换；页面标题下沉到各页面内容区。
顶部搜索行为只在 /admin/articles 生效：输入联动 search 查询参数；其他后台页隐藏或禁用搜索输入。
统一后台 UI 组件（Button/Card/Input/Textarea/Checkbox/Badge）视觉风格，保持现有 API 用法不破坏页面调用。
仪表盘页改为原型结构：标题区 + 三统计卡 + 主洞察卡 + 最近动态侧卡，数据继续来自 /api/admin/dashboard。
文章管理页改为原型式列表容器与工具条，保留现有筛选/刷新/编辑/预览能力，不引入无后端支撑的“批量删除”真实动作。
文章编辑（新建/编辑）与 ArticleEditorForm 改为左主编辑区 + 右设置栏布局，保留 slug/summary/published/cover 等现有字段与保存删除逻辑。
设置页采用原型风格的“设置面板+字段行”布局，但维持当前只读数据能力（不新增保存接口）。
登录页与初始化向导保持“居中卡片”结构，仅替换为同一后台视觉 token 与控件样式。
TinyMCE 外层容器与工具区做视觉融合（面板、圆角、间距、焦点态），不改其核心编辑能力。
Public APIs / Interfaces / Types
不修改任何服务端 API 路由、请求体、响应体、数据库 schema。
不新增后台业务路由（本轮不创建 taxonomy 管理功能页）。
前端行为约定保持并强化：/admin/articles 使用 URL query search 与 status 作为筛选状态来源。
Test Plan
手工验收路由：/admin/login、/admin/onboarding、/admin、/admin/articles、/admin/articles/new、/admin/articles/:id、/admin/settings。
功能回归：登录/退出、文章列表筛选、文章新建/编辑/删除、设置页加载、初始化向导分步提交。
交互验收：顶部搜索仅文章页可输入并触发筛选；其他页不触发搜索联动。
视觉验收：light/dark 均完整、移动端侧栏可开合、卡片层次与间距符合原型语言。
质量校验采用“改动文件定向 lint”；不以全仓 pnpm lint 作为通过门槛（当前基线已有大量与本次无关错误）。
Assumptions
仅改 Nuxt 主项目后台，不触碰 blog-next CMS。
本轮是“视觉语言一致”而非像素级复刻。
taxonomy 原型仅作为视觉参考，不实现新数据模型与新页面功能。
图标体系继续沿用现有 lucide/Icon，不引入新的图标依赖体系。
