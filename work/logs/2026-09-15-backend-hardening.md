# Melody Challenger 后端安全与核心重构日志

## 目标

1. 将 XP、排行榜和关键结算从客户端直接写表迁移到受控 RPC。
2. 为登录、进度和结算建立可重复的云端验收方法。
3. 从 `LessonPage` 提取数据库访问与结算职责，降低页面耦合。

## 基线

- 分支：`codex/backend-hardening`。
- 起点：`b908b9a`。
- Supabase 项目已恢复：Auth 200、12 个技能、51 节课程。
- 当前风险：客户端可直接更新自己的 XP、排行榜和 PK 分数；服务端只校验行归属，不校验奖励真实性。
- 当前 `LessonPage.tsx` 超过 1500 行，数据访问、答题状态、音频和结算混在同一组件。

## 计划

- 先只读检查线上表结构、策略与现有函数。
- 编写向前兼容迁移与 RPC 契约测试。
- 在本地代码中引入 repository/service 层并替换直接写入。
- 在 Supabase SQL Editor 执行迁移，验证匿名拒绝、登录用户允许和幂等性。
- 完成 CI、生产构建、浏览器核心路径与生产部署。

## 进展

- 只读确认线上真实表结构与关键唯一约束。
- 新增 9 个数据库函数，其中 7 个 authenticated 公共 RPC、2 个仅内部调用。
- 完整 SQL 在真实数据库中先经 `BEGIN/ROLLBACK` 演练，再正式创建函数；旧表写策略尚未撤销。
- 匿名调用结算 RPC 返回 `401 / permission denied`。
- authenticated 回滚断言验证：已完成课程不重复奖励、每日挑战最多奖励一次、排行榜局数原子累加、最高分不回退。
- 客户端课程、每日挑战、普通游戏、PK、打卡和成就结算均改用 RPC。
- 游客课程计数不再兑换 XP；游客最高分通过 RPC 合并。
- `LessonPage.tsx` 从 1569 行降至 1277 行，删除约 300 行持久化/解锁职责。
- 新增 settlement service 测试与后端安全架构守卫。

## 证据边界

- RPC 解决越权、重复奖励、并发覆盖与多表事务问题。
- 游戏和 PK 分数仍由浏览器提交，只能做范围和状态校验；强反作弊需要服务端题目会话。
- 旧客户端仍在线期间暂保留旧 RLS 写策略；v3.3 生产验证完成后再撤销。

## 生产切换与锁定

- v3.3 提交 `9384c3b` 通过 GitHub Actions并由 Vercel 发布，生产 HTML 标记为 `3.3.0`。
- 生产 bundle 包含全部 7 个 RPC 调用，登录会话保持有效。
- 首次 authenticated 实测发现线上历史列为 `user_streaks.last_active_date`，旧代码与初版 RPC 误用 `last_activity_date`；修正后打卡 RPC 返回 HTTP 200。
- 成就领取 RPC 返回 HTTP 200；匿名调用结算函数返回 `401 / permission denied`。
- 正式撤销 15 条奖励、进度和结果表直接写策略；保留所有读取策略和好友挑战创建策略。
- 锁定后验证：登录用户 RPC 返回 200，直接 PATCH `user_xp` 影响 0 行；策略清单只剩 SELECT 与挑战 CREATE。
- 课程、每日、打卡和成就 RPC 增加按用户事务级 advisory lock，防止并发首次请求重复奖励。
- RLS 收紧脚本附带完整回滚策略参考。

## 最终门禁

- 23 项测试通过；生产构建通过；生产依赖 high/critical 为 0。
- `LessonPage.tsx` 1277 行，较基线减少 292 行。
- 已知 21 条 Hook 依赖 warning 仍保留，未用禁用规则掩盖。
