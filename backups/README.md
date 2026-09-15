# 数据备份与恢复

## 当前保护层

1. Supabase 控制台显示项目每天自动备份，可用于平台内部恢复。
2. `src/lib/*.sql` 保存数据库结构、RPC 与 RLS 收紧/回滚脚本。
3. `public-content-2026-09-15.json` 保存可公开迁移的课程配置，不含用户数据。
4. `backups/private/` 专门留给本地敏感备份，已被 Git 忽略，禁止提交。

## 公开内容快照

- 技能：12 条
- 课程：51 条
- 等级配置：24 条
- 成就：30 条
- SHA-256：`3aae6edb9c716634cca7a14edb0575d5c2056c96841bc82275bd2c1ac2417cc2`

校验：

```bash
npm run backup:verify
```

## 恢复顺序

1. 在新 Supabase 项目运行 `src/lib/supabase-schema.sql`。
2. 依次运行 `src/lib/supabase-schema-v2.sql` 和其余 `add-*.sql` 内容迁移。
3. 运行 `src/lib/backend-hardening-v1.sql` 创建受控结算 RPC。
4. 客户端部署 v3.3 或更高版本后，运行 `src/lib/backend-hardening-lockdown-v1.sql`。
5. 从公开 JSON 恢复技能、课程、等级和成就时使用主键 upsert，先父表后子表。
6. 用户、认证身份和进度只能从 Supabase 平台备份或本地 `backups/private/` 的管理员导出恢复。
7. 恢复后验证技能 12、课程 51、Auth 健康检查 200、匿名 RPC 401、登录 RPC 200。

## 限制

仓库备份不包含邮箱、用户 ID、登录凭据或用户进度。当前免费套餐的外部下载/时间点恢复能力有限；开始正式运营前应升级套餐或建立受控的加密管理员导出流程。
