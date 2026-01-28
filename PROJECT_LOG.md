# 🎵 Melody Challenger 项目开发日志

## 项目概述
**项目名称**: Melody Challenger (音高大师 / PitchMaster)  
**域名**: www.melodychallenger.com  
**部署平台**: Vercel (自动部署)  
**仓库**: https://github.com/wangroupai01-png/test4-pitch-tool.git  

## 技术栈
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS (Neo-Brutalism 风格)
- **动画**: Framer Motion
- **路由**: React Router DOM
- **音频**: Web Audio API + Salamander Grand Piano 采样
- **音高检测**: Pitchfinder (YIN 算法)
- **特效**: canvas-confetti
- **后端**: Supabase (认证 + 数据库)
- **状态管理**: Zustand (带持久化)

---

## 关键开发节点

### 2026-01-28: 好友系统 + 专业篇课程

#### 新增功能

**1. 好友系统**
- 搜索用户（按用户名或邮箱）
- 发送/接受/拒绝好友请求
- 好友列表管理
- 好友 PK 挑战功能
- PK 记录和战绩统计

**相关文件**:
- `src/pages/Friends.tsx` - 好友页面
- `src/lib/add-friends-system.sql` - 数据库架构

**2. 专业篇课程**
- **复杂音程**: 增减音程、复合音程（九度、十度等）
- **七和弦**: 大七、小七、属七、减七、半减七和弦识别
- **旋律听写**: 3-5音符短旋律听记
- **专业视唱**: 大跳音程、变化音、复杂旋律

**相关文件**:
- `src/lib/add-advanced-skills.sql` - 专业课程数据
- `src/pages/LessonPage.tsx` - 扩展支持新题型

#### 数据库更新
需要运行:
- `src/lib/add-friends-system.sql` - 好友系统表
- `src/lib/add-advanced-skills.sql` - 专业课程内容

---

### 2026-01-28: 练习模式增强 + 协作规范

#### 新增功能

**1. 自由哼唱 - 录音回放功能**
- 使用 MediaRecorder API 录制用户声音
- 录音列表，最多保留5条
- 支持播放、删除录音
- 显示录音时长

**相关文件**:
- `src/pages/FreeMode.tsx` - 录音状态和UI
- `src/hooks/usePitchDetector.ts` - 暴露 mediaStream

**2. 自由哼唱 - 目标音辅助线**
- 可选开启的目标音参考线
- 滑动条选择目标音 (C3-C6)
- 试听目标音功能
- 可视化器中显示绿色目标线

**相关文件**:
- `src/pages/FreeMode.tsx` - 目标音控制UI
- `src/components/game/PitchVisualizer.tsx` - 已支持 targetMidi

**3. 哼唱闯关 - 技能道具系统**
- 跳过道具: 跳过当前关卡，不加分
- 提示道具: 播放目标音3次
- 重置道具: 重置进度但不扣命
- 每局游戏3个道具，用完不补充

**相关文件**:
- `src/pages/SingMode.tsx` - 道具状态和使用逻辑

**4. 协作开发规范**
- `.cursor/rules/development-workflow.mdc` - AI协作开发规则
- `PROJECT_STATUS.md` - 一眼能看懂的项目管理文件

#### 协作开发流程
1. 开发前：阅读 PRD、PROJECT_LOG、VERSION_HISTORY
2. 开发中：遵循规范，记录日志
3. 开发后：本地测试 → 通知验收 → 验收通过 → 推送 GitHub
4. 版本管理：更新 VERSION_HISTORY.md，创建 Git 标签

---

### 2026-01-26: Phase 4 - 智能学习系统 (v2.2)

#### 新增功能

**1. 间隔重复复习系统**
- 基于 SM-2 算法的智能复习调度
- 根据用户表现自动计算下次复习时间
- 难度因子自适应调整 (1.3 - 2.5)

**相关文件**:
- `src/utils/spacedRepetition.ts` - SM-2 算法实现
- `src/utils/reviewService.ts` - 复习服务（数据库操作）
- `src/lib/add-review-system.sql` - 复习系统数据表

**2. 复习中心页面**
- 页面路由 `/review`
- 显示待复习课程列表（按优先级排序）
- 统计卡片：已过期、今日待复习、即将复习、已掌握
- 一键开始复习功能

**相关文件**:
- `src/pages/Review.tsx` - 复习中心页面

**3. 自动添加复习计划**
- 完成课程后自动创建/更新复习计划
- 根据得分计算质量评分 (0-5)
- 自动计算下次复习日期

**4. 薄弱点分析**
- 记录每道题的答题统计
- 分析正确率低于 70% 的薄弱点
- 在复习中心显示薄弱点列表

**5. 学习页面复习入口**
- 有待复习内容时显示醒目入口卡片
- 显示待复习数量

#### 数据库更新
需要运行以下 SQL 脚本：
- `src/lib/add-review-system.sql` - 复习系统表和薄弱点统计表

---

### 2026-01-25: Phase 2 - 激励系统 (v2.1)

#### 新增功能

**1. 成就系统扩展**
- 17种成就，按类型分组：学习成就、技能成就、打卡成就、等级成就、经验成就
- 成就解锁时显示全局弹窗 `AchievementToast`
- 成就页面 `/achievements`：展示所有成就和解锁进度
- 自动检测成就解锁条件

**相关文件**:
- `src/components/game/AchievementToast.tsx` - 成就弹窗
- `src/pages/Achievements.tsx` - 成就展示页
- `src/utils/achievementChecker.ts` - 成就检测逻辑
- `src/lib/add-achievements-data.sql` - 成就数据 SQL

**2. 连续打卡追踪**
- 完成课程时自动更新打卡记录
- 计算连续天数和最长连续天数
- 打卡记录存储在 `user_streaks` 表

**3. 每日挑战完整实现**
- 页面路由 `/daily-challenge`
- 每日生成随机题目（根据星期几变化难度）
- 完成后奖励 50 XP
- 分数保存在 `daily_challenge_scores` 表

**相关文件**:
- `src/pages/DailyChallenge.tsx` - 每日挑战页
- `src/lib/add-daily-challenge-table.sql` - 每日挑战数据表

**4. 升级动效**
- 升级时触发全屏动画 + 撒花特效
- 使用 `canvas-confetti` 实现

**相关文件**:
- `src/components/game/LevelUpToast.tsx` - 升级动画

**5. 音程课程支持**
- 课程页面支持音程类型题目
- 播放两个音符（基础音 + 音程音）
- 选项为音程名称（如"大二度"、"纯五度"）

**6. UI 优化**
- 技能详情页添加「更多课程敬请期待」卡片
- 修复已完成课程卡片透明度问题
- 增加底部导航栏与内容区间距

#### 数据库更新
需要运行以下 SQL 脚本：
- `src/lib/add-interval-lessons.sql` - 音程基础 5 节课程
- `src/lib/add-achievements-data.sql` - 成就数据
- `src/lib/add-daily-challenge-table.sql` - 每日挑战表

---

### 2026-01-23: Phase 1 - 学习系统重构 (v2.0 开发中)

#### 新增功能

**1. 底部 Tab 导航布局**
- 四个主 Tab：学习、练习、竞技、我的
- 入口 `/` 重定向到 `/learn`
- 原有页面（FreeMode、QuizMode、SingMode）保持全屏模式

**相关文件**:
- `src/components/layout/TabLayout.tsx`
- `src/App.tsx` (路由重构)

**2. 技能树系统**
- 按类别分组：基础篇、进阶篇、专业篇
- 技能进度显示、前置技能解锁逻辑
- 课程列表、星级评价

**相关文件**:
- `src/pages/Learn.tsx` - 学习中心
- `src/pages/SkillDetail.tsx` - 技能详情页
- `src/pages/LessonPage.tsx` - 课程学习页

**3. 课程学习流程**
- 播放目标音 → 选择答案 → 反馈 → 进入下一题
- 完成后显示得分和星级
- 自动解锁下一课程

**4. XP 经验值系统**
- 完成课程获得 XP
- 完成技能获得额外 XP
- 等级进度条显示在 Tab 导航上方
- 等级配置表 (1-50级)

**相关文件**:
- `src/components/game/XPBar.tsx`
- `src/lib/supabase-schema-v2.sql` (数据库扩展)

**5. 竞技场页面**
- 每日挑战入口 (按星期显示不同类型)
- 排行榜入口
- 联赛系统 / 好友PK (即将上线占位)

**相关文件**:
- `src/pages/Compete.tsx`

**6. 个人中心页面**
- 用户头像、等级、XP 显示
- 统计数据：连续打卡、完成技能、完成课程、解锁成就
- 退出登录

**相关文件**:
- `src/pages/Profile.tsx`

**7. 数据库扩展 Schema**
- `skills` - 技能定义
- `lessons` - 课程内容 (JSONB 存储题目配置)
- `user_skill_progress` - 用户技能进度
- `user_lesson_progress` - 用户课程进度
- `user_xp` - 用户经验值和等级
- `xp_logs` - XP 获取记录
- `level_config` - 等级配置
- `user_streaks` - 打卡记录
- `achievements` - 成就定义
- `user_achievements` - 用户成就

**相关文件**:
- `src/lib/supabase-schema-v2.sql`

#### 注意事项
- 需要在 Supabase 中运行 `supabase-schema-v2.sql` 才能使用新功能
- 此分支为开发分支 `dev-major-update`，尚未合并到 master

---

### 2026-01-23: 音高检测升级 + 分数保存修复 + 昵称编辑功能

#### 有效改动

**1. 音高检测算法升级 (YIN 算法)**
- 从简单自相关升级为 YIN 算法，精度更高
- FFT 缓冲区从 2048 增加到 4096
- 添加中值滤波器消除检测抖动
- 禁用浏览器自动音频处理 (echoCancellation, noiseSuppression, autoGainControl)

**相关文件**:
- `src/utils/pitchDetection.ts` - YIN 算法实现
- `src/hooks/usePitchDetector.ts` - 添加平滑处理

**2. 分数保存逻辑修复**
- 跳过 score=0 的保存，避免创建空记录
- 添加详细的控制台日志 `[QuizMode]` / `[SingMode]`
- 使用 `.select()` 确认更新操作成功
- 正确比较新分数和数据库最高分

**相关文件**:
- `src/pages/QuizMode.tsx`
- `src/pages/SingMode.tsx`

**3. 排行榜和用户成绩修复**
- 使用 `.maybeSingle()` 替代 `.single()` 避免 406 错误
- 添加 profiles 查询获取用户名
- 简化错误处理，避免查询卡住

**相关文件**:
- `src/components/game/Leaderboard.tsx`
- `src/components/auth/UserButton.tsx`

**4. 昵称编辑功能**
- 在设置页面添加昵称编辑功能
- 昵称保存到 Supabase profiles 表
- 排行榜显示用户昵称

**相关文件**:
- `src/components/auth/UserButton.tsx` - 添加设置模态框
- `src/store/useUserStore.ts` - 添加 updateProfile 函数

**5. Vercel SPA 路由修复**
- 添加 `vercel.json` 配置文件
- 所有路由重写到 `index.html`

**相关文件**:
- `vercel.json`

#### 踩坑记录 (行不通的方法)

**1. 排行榜使用 `.single()` 查询**
- ❌ 问题：当没有匹配记录时抛出 406 错误
- ✅ 解决：改用 `.maybeSingle()`，无记录时返回 null

**2. 分数保存使用 upsert 直接覆盖**
- ❌ 问题：upsert 会用新值覆盖，不会保留最高分
- ✅ 解决：先查询现有记录，比较后再更新

**3. 排行榜同时查询 leaderboard + profiles 表**
- ❌ 问题：profiles 查询可能卡住导致排行榜无法加载
- ✅ 解决：用 try-catch 包裹 profiles 查询，失败时显示默认用户名

**4. 音高检测简单自相关算法**
- ❌ 问题：容易受噪音干扰，检测不稳定
- ✅ 解决：改用 YIN 算法 + 中值滤波

**5. 浏览器音频自动处理**
- ❌ 问题：echoCancellation/noiseSuppression 会干扰音高检测
- ✅ 解决：在 getUserMedia 时显式禁用这些功能

---

### 2026-01-20: Supabase 集成 (用户系统 + 排行榜 + 分享)
**新增功能**:
- 游客模式：数据存储在本地 localStorage
- 邮箱登录/注册：使用 Supabase Auth
- 排行榜系统：展示全服玩家最高分
- 分享功能：Web Share API + 复制链接

**相关文件**:
- `src/lib/supabase.ts` - Supabase 客户端配置
- `src/lib/supabase-schema.sql` - 数据库表结构
- `src/store/useUserStore.ts` - 用户状态管理 (Zustand)
- `src/components/auth/AuthModal.tsx` - 登录/注册弹窗
- `src/components/auth/UserButton.tsx` - 用户按钮组件
- `src/components/ui/ShareButton.tsx` - 分享按钮
- `src/components/game/Leaderboard.tsx` - 排行榜组件

**Supabase 配置**:
- Project ID: `xuxfmetjjfeaexwllpyd`
- 数据库表: `profiles`, `leaderboard`
- RLS 策略已启用

---

### 2026-01-20: 移动端适配优化
**变更内容**:
- 所有页面响应式布局优化 (Home, FreeMode, QuizMode, SingMode)
- 钢琴键盘响应式尺寸 + 横向滚动支持
- 禁用页面缩放，添加 PWA meta 标签
- 添加 safe-area 适配刘海屏
- 隐藏滚动条工具类 `.hide-scrollbar`

**相关文件**:
- `src/pages/*.tsx` - 所有页面
- `src/components/game/PianoKeyboard.tsx`
- `src/index.css`
- `index.html`

---

### 2026-01-20: 钢琴音色优化
**问题**: 合成音色电子感太重  
**解决方案**: 改用 Salamander Grand Piano 采样 (CDN 加载)

**相关文件**:
- `src/hooks/useAudioPlayer.ts`

**技术细节**:
```typescript
// 采样 CDN 地址
const SAMPLE_BASE_URL = 'https://cdn.jsdelivr.net/gh/surikov/webaudio-tinysynth@gh-pages/sounds/salamander/';
// 预加载 C3-C6 范围的音符
// 加载失败时回退到 sine 波形
```

---

### 2026-01-20: 音高可视化器修复
**问题**: 
1. 可视化器下方出现黑色空白区域
2. 视图随用户音高浮动，视觉混乱
3. 可见音符范围不够 (C5 不够，需要到 G5)

**解决方案**:
- `NOTE_HEIGHT` 设为 15px (每半音)
- `centerMidi` 固定为 64 (E4)，不再跟随用户音高
- `visibleSemitones` 缓冲区增加到 +48
- Canvas 使用 `position: absolute; inset: 0` 填满容器

**相关文件**:
- `src/components/game/PitchVisualizer.tsx`

---

### 2026-01-20: 哼唱闯关 (SingMode) 实现
**功能**:
- 随机生成目标音高 (F3-C5)
- 实时音高检测匹配
- 进度条 (需保持 1.5 秒完成匹配)
- 成功后播放和弦 + 撒花特效
- 关卡递进

**相关文件**:
- `src/pages/SingMode.tsx`

---

### 初始功能
**首页 (Home)**:
- 三种模式卡片入口
- Neo-Brutalism 设计风格

**自由练习 (FreeMode)**:
- 实时音高检测 + 可视化
- 显示当前音高、音分偏差

**听音辨位 (QuizMode)**:
- 播放随机音符
- 用户点击钢琴键猜测
- 得分 + 连击系统

---

## 项目文件结构
```
src/
├── components/
│   ├── auth/
│   │   ├── AuthModal.tsx          # 登录/注册弹窗
│   │   ├── UserButton.tsx         # 用户按钮
│   │   ├── UserStatsModal.tsx     # 用户成绩弹窗
│   │   └── UserSettingsModal.tsx  # 用户设置弹窗
│   ├── game/
│   │   ├── Leaderboard.tsx        # 排行榜弹窗
│   │   ├── PianoKeyboard.tsx      # 钢琴键盘组件
│   │   ├── PitchVisualizer.tsx    # 音高可视化器
│   │   └── XPBar.tsx              # XP 进度条 (v2.0)
│   ├── layout/
│   │   └── TabLayout.tsx          # Tab 导航布局 (v2.0)
│   └── ui/
│       ├── Button.tsx             # 通用按钮
│       ├── Card.tsx               # 通用卡片
│       └── ShareButton.tsx        # 分享按钮
├── hooks/
│   ├── useAudioPlayer.ts          # 音频播放 (钢琴采样)
│   ├── usePitchDetector.ts        # 音高检测
│   └── useAudioContext.ts         # AudioContext 管理
├── lib/
│   ├── supabase.ts                # Supabase 客户端
│   ├── supabase-schema.sql        # 数据库 Schema (v1.0)
│   └── supabase-schema-v2.sql     # 数据库扩展 Schema (v2.0)
├── pages/
│   ├── Home.tsx                   # 首页 (旧版)
│   ├── FreeMode.tsx               # 自由练习
│   ├── QuizMode.tsx               # 听音辨位
│   ├── SingMode.tsx               # 哼唱闯关
│   ├── Learn.tsx                  # 学习中心 (v2.0)
│   ├── Practice.tsx               # 练习场 (v2.0)
│   ├── Compete.tsx                # 竞技场 (v2.0)
│   ├── Profile.tsx                # 个人中心 (v2.0)
│   ├── SkillDetail.tsx            # 技能详情 (v2.0)
│   └── LessonPage.tsx             # 课程学习页 (v2.0)
├── store/
│   ├── useGameStore.ts            # 游戏状态管理
│   └── useUserStore.ts            # 用户状态管理
├── utils/
│   ├── musicTheory.ts             # 音乐理论工具函数
│   └── pitchDetection.ts          # 音高检测算法
├── App.tsx                        # 路由配置
├── main.tsx                       # 入口文件
└── index.css                      # 全局样式
```

---

## 重要技术决策

### 1. 音高检测
使用 `pitchfinder` 库的 YIN 算法，精度约 ±10 音分。
```typescript
// usePitchDetector.ts
const detector = Pitchfinder.YIN({ sampleRate });
```

### 2. 音频播放
- 全局单例 `AudioContext` 避免重复创建
- 播放前调用 `audioContext.resume()` 处理浏览器自动播放策略
- 停止当前音频再播放新音频，避免重叠

### 3. Canvas 可视化
- 使用 `requestAnimationFrame` 实现 60fps 动画
- 音高历史存储在 `historyRef` 中，绘制轨迹线
- 动态渲染音符网格线

### 4. 样式系统
Tailwind CSS 自定义配置:
```javascript
// tailwind.config.js
colors: {
  primary: '#7F5AF0',    // 紫色
  secondary: '#2CB67D',  // 绿色
  accent: '#FF8906',     // 橙色
  dark: '#16161a',       // 深色
  'light-bg': '#FFFFFE', // 背景色
}
```

---

## 已知问题 & 待优化

1. **音频延迟**: 首次播放采样可能有加载延迟 (已通过预加载缓解)
2. **低端设备**: Canvas 动画可能在低端手机上卡顿
3. **浏览器兼容**: 需要支持 Web Audio API 的现代浏览器

---

## 部署信息

**Git 分支**: master  
**自动部署**: GitHub 推送后 Vercel 自动构建  
**构建命令**: `npm run build`  
**输出目录**: `dist/`

---

*最后更新: 2026-01-23 (Phase 1 完成)*
