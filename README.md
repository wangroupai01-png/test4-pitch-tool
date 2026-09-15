# Melody Challenger

面向音乐爱好者的游戏化音感与音准训练应用。支持听音辨位、实时音高反馈、哼唱闯关、课程技能树、智能复习和成长记录。

线上地址：https://www.melodychallenger.com

## 本地运行

需要 Node.js 24。

```bash
npm ci --ignore-scripts
npm run dev
```

应用默认连接生产 Supabase。云端不可达时，游客仍可使用听音辨位、自由哼唱和哼唱闯关；登录、课程和云端进度依赖 Supabase。

## 质量检查

```bash
npm run check
npm audit --omit=dev --audit-level=high
```

`npm run check` 依次运行 Lint、单元测试和生产构建。推送到 `master` 或创建 Pull Request 时，GitHub Actions 会执行相同门禁。

## 技术结构

- React 19 + TypeScript + Vite
- Tailwind CSS + Framer Motion
- Zustand + Supabase
- Web Audio API 音高检测
- Vitest 回归测试
- Vite PWA / Workbox

主要目录：

```text
src/components/  界面与游戏组件
src/hooks/       音频和音高生命周期
src/pages/       路由页面
src/store/       用户与游客状态
src/utils/       音乐、复习和业务算法
src/lib/         Supabase 配置与数据库脚本
work/logs/       开发与验证记录
```

## 发布与回滚

Vercel 通过 GitHub 集成监听 `master` 并部署到生产环境。发布前必须确保 `npm run check` 和生产依赖审计通过。

当前稳定性重启前的回滚点：

```bash
git checkout 3e00445d8d4685d9cd8f8f482728e8967f3e6e90
```

数据库脚本位于 `src/lib/`。不要把登录账号、密码、服务端密钥或访问令牌写入仓库。浏览器端 Supabase anon key 是公开客户端标识，数据安全必须由 RLS 和服务端函数保证。
