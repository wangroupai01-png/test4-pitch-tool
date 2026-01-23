# 🏷️ 版本历史记录

本文件记录项目的重要版本节点，便于随时回滚到指定版本。

---

## 如何回滚到指定版本

```powershell
# 查看所有标签
git tag -l

# 回滚到指定标签（只查看，不影响当前代码）
git checkout <标签名>

# 基于某个标签创建新分支继续开发
git checkout -b new-branch <标签名>

# 强制回滚 master 到某个标签（谨慎使用！）
git checkout master
git reset --hard <标签名>
git push origin master --force
```

---

## 版本列表

### v1.0-stable (2026-01-23)
**状态**: ✅ 基础功能完成，稳定可用

**包含功能**:
- 🏠 首页：三种模式入口
- 🎹 自由练习：实时音高检测 + 可视化
- 🎧 听音辨位：随机音符 + 钢琴键盘猜测 + 得分系统
- 🎤 哼唱闯关：目标音高 + 进度匹配 + 关卡递进
- 👤 用户系统：邮箱登录/注册 (Supabase)
- 🏆 排行榜：全服玩家分数排名
- ⚙️ 设置：昵称编辑
- 📱 移动端适配

**技术栈**:
- React 18 + TypeScript + Vite
- Tailwind CSS (Neo-Brutalism 风格)
- Supabase (认证 + 数据库)
- Web Audio API + Salamander Piano 采样
- YIN 音高检测算法

**回滚命令**:
```powershell
git checkout v1.0-stable
```

---

## 当前开发分支

### dev-major-update
**状态**: 🚧 开发中

**开发内容**: （待填写）

**切换到此分支**:
```powershell
git checkout dev-major-update
```

---

## 分支说明

| 分支名 | 用途 | 状态 |
|--------|------|------|
| `master` | 生产环境，自动部署到 Vercel | 稳定 |
| `dev-major-update` | 大版本改动开发分支 | 开发中 |

---

*最后更新: 2026-01-23*
