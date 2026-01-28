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

### v2.4-practice-enhance (2026-01-28) - 待验收
**状态**: ⏳ 待用户验收

**新增功能**:
- 🎤 **录音回放**: 自由哼唱模式可录制并回放声音
- 🎯 **目标音辅助线**: 可视化器中显示目标音参考线
- 🛠️ **技能道具**: 哼唱闯关新增跳过/提示/重置道具
- 📋 **协作规范**: 开发规则文档和项目状态总览

**修改文件**:
- `src/pages/FreeMode.tsx` - 录音功能、目标音UI
- `src/pages/SingMode.tsx` - 道具系统
- `src/hooks/usePitchDetector.ts` - 暴露 mediaStream
- `.cursor/rules/development-workflow.mdc` - 开发规范
- `PROJECT_STATUS.md` - 项目状态总览

**回滚命令**:
```powershell
git checkout v2.3-phase5
```

---

### v2.3-phase5 (2026-01-26)
**状态**: ✅ Phase 5 完成 - 内容扩展

**新增功能**:
- ⚡ **快速识音**: 限时挑战模式，2-5秒内识别音符
- 🎵 **音程进阶**: 六度、七度、三全音等高级音程课程
- 🎤 **音准精修**: 高难度哼唱，更小容差，音程跳跃
- 🎹 **和弦入门**: 大三和弦、小三和弦识别训练
- ⏱️ **限时模式**: 支持倒计时UI，超时自动判错
- 📚 **18节新课程**: 进阶篇完整课程内容

**数据库更新** (需要运行):
- `src/lib/add-intermediate-skills.sql` - 进阶篇技能和课程

**回滚命令**:
```powershell
git checkout v2.3-phase5
```

---

### v2.2-phase4 (2026-01-26)
**状态**: ✅ Phase 4 完成 - 智能学习系统

**新增功能**:
- 🧠 **SM-2 间隔重复算法**: 智能计算复习时间
- 📅 **复习计划**: 自动为完成的课程生成复习计划
- 📊 **薄弱点分析**: 记录答题统计，识别需要加强的内容
- 🔔 **复习中心**: `/review` 页面展示待复习内容

**修复问题**:
- 🔓 修复技能解锁逻辑: 现在正确解锁所有以当前技能为前置条件的技能
- ⚡ 缩短缓存时间从5分钟到30秒，加快数据更新
- 🔄 完成课程后立即清除缓存
- 📍 复习入口始终显示在学习页面

**数据库更新** (需要运行):
- `src/lib/add-review-system.sql` - 复习系统表和统计表

**回滚命令**:
```powershell
git checkout v2.2-phase4
```

---

### v2.1-phase2 (2026-01-25)
**状态**: ✅ Phase 2 完成 - 激励系统

**新增功能**:
- 🏆 **成就系统**: 17种成就，自动检测解锁，弹窗动画
- 📋 **成就页面**: `/achievements` 展示所有成就和解锁进度
- 🔥 **连续打卡**: 完成课程自动更新打卡记录
- ⚔️ **每日挑战**: `/daily-challenge` 完整实现，每日随机题目，+50 XP
- ⬆️ **升级动效**: 升级时全屏动画 + canvas-confetti 撒花特效
- 🎵 **音程课程**: 支持音程类型题目（播放两个音符，识别音程）
- 📚 **课程卡片**: 技能详情页添加「更多课程敬请期待」占位卡片

**数据库更新** (需要运行以下 SQL):
- `src/lib/add-interval-lessons.sql` - 音程基础 5 节课程
- `src/lib/add-achievements-data.sql` - 17 种成就数据
- `src/lib/add-daily-challenge-table.sql` - 每日挑战分数表

**回滚命令**:
```powershell
git checkout v2.1-phase2
```

---

### v2.0-phase1 (2026-01-23)
**状态**: ✅ Phase 1 完成 - 学习系统基础

**包含功能**:
- 📱 底部 Tab 导航布局 (学习/练习/竞技/我的)
- 🌳 技能树页面 UI (按类别分组，进度显示)
- 📖 课程学习流程 (技能详情 → 课程列表 → 答题界面)
- ⭐ XP 经验值系统 (获取/显示/等级计算)
- 📊 等级进度条显示
- 💾 数据库扩展 Schema

**回滚命令**:
```powershell
git checkout v2.0-phase1
```

---

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

## 分支说明

| 分支名 | 用途 | 状态 |
|--------|------|------|
| `master` | 生产环境，自动部署到 Vercel | 稳定 |

---

*最后更新: 2026-01-26*
