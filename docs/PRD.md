# Melody Challenger 产品需求文档 (PRD)

> **版本**: v2.1 (扩展版)  
> **创建日期**: 2026-01-23  
> **产品名称**: Melody Challenger (音高大师)  
> **网站地址**: https://www.melodychallenger.com  
> **产品定位**: 游戏化音乐耳朵训练平台

---

## 一、产品愿景

### 1.1 一句话定义
**Melody Challenger = 多邻国 × 音乐练耳**

### 1.2 核心价值主张
- 🎮 **游戏化学习**：让枯燥的练耳变成有趣的闯关游戏
- 📈 **系统化进阶**：从零基础到专业水平的完整学习路径
- 🎯 **实时反馈**：独有的音高可视化技术，即时看到自己的表现
- 🏆 **社交激励**：排行榜、联赛、好友PK，激发持续练习动力

### 1.3 目标用户

| 用户群体 | 核心需求 | 产品价值 |
|---------|---------|---------|
| 零基础音乐爱好者 | 想学唱歌但不知从何开始 | 系统化入门课程 |
| K歌玩家 | 唱歌跑调想改进 | 针对性音准训练 |
| 音乐学生 | 视唱练耳考试备考 | 专业级音程/和弦训练 |
| 乐器学习者 | 提升音感辅助演奏 | 多乐器音色练习 |
| 音乐教师 | 教学辅助工具 | 学生进度追踪 |

---

## 二、产品架构

### 2.1 功能模块全景图

```
┌─────────────────────────────────────────────────────────────┐
│                    Melody Challenger                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  学习中心   │  │  练习场    │  │  竞技场    │          │
│  │  (课程系统) │  │ (自由练习) │  │ (排行竞技) │          │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                 │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐         │
│  │ • 技能树    │  │ • 自由哼唱  │  │ • 每日挑战  │         │
│  │ • 课程单元  │  │ • 听音辨位  │  │ • 周赛联赛  │         │
│  │ • 进度追踪  │  │ • 哼唱闯关  │  │ • 好友PK    │         │
│  │ • 复习系统  │  │ • 音高可视化│  │ • 全服排行  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    成长系统                          │   │
│  │  • XP经验值  • 等级系统  • 成就徽章  • 连续打卡     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 用户旅程

```
新用户注册 → 能力测试 → 推荐起点 → 开始第一课
     ↓
每日学习: 课程学习 → 获得XP → 升级 → 解锁新技能
     ↓
持续激励: 打卡streak → 每日挑战 → 联赛排名 → 成就解锁
     ↓
进阶成长: 完成技能树 → 解锁高级课程 → 成为音感达人
```

---

## 三、核心功能详细设计

### 3.1 技能树系统 [P0 核心]

#### 功能描述
结构化的学习路径，从基础到进阶，每个技能包含多个课程单元。

#### 技能树结构

```
🎵 音感之旅
│
├── 📗 基础篇 (必修)
│   │
│   ├── 🎯 单音识别 I
│   │   ├── 第1课: 认识中央C
│   │   ├── 第2课: Do-Re-Mi
│   │   ├── 第3课: Fa-Sol-La
│   │   ├── 第4课: Ti与高音Do
│   │   └── 第5课: 综合测验
│   │
│   ├── 🎯 单音识别 II
│   │   ├── 第1课: 低音区探索 (C3-B3)
│   │   ├── 第2课: 高音区探索 (C5-B5)
│   │   ├── 第3课: 全音域识别
│   │   └── 第4课: 综合测验
│   │
│   ├── 🎤 音准入门
│   │   ├── 第1课: 找到你的音域
│   │   ├── 第2课: 跟唱单音
│   │   ├── 第3课: 保持稳定
│   │   └── 第4课: 综合测验
│   │
│   └── 🎵 音程基础
│       ├── 第1课: 认识音程
│       ├── 第2课: 大二度与小二度
│       ├── 第3课: 大三度与小三度
│       ├── 第4课: 纯四度与纯五度
│       └── 第5课: 综合测验
│
├── 📘 进阶篇 (解锁条件: 完成基础篇)
│   │
│   ├── 🎯 快速识音
│   │   └── 限时挑战，提升反应速度
│   │
│   ├── 🎵 音程进阶
│   │   ├── 六度与七度
│   │   ├── 八度与复合音程
│   │   └── 音程听写
│   │
│   ├── 🎤 音准精修
│   │   ├── 音分级精准控制
│   │   ├── 滑音与颤音
│   │   └── 音程跳跃演唱
│   │
│   └── 🎹 和弦入门
│       ├── 大三和弦
│       ├── 小三和弦
│       └── 和弦分解
│
└── 📙 专业篇 (解锁条件: 完成进阶篇)
    │
    ├── 🎵 复杂音程
    ├── 🎹 七和弦与延伸和弦
    ├── 🎼 旋律听写
    └── 🎤 专业视唱
```

#### 数据库设计

```sql
-- 技能定义表
CREATE TABLE skills (
  id TEXT PRIMARY KEY,                    -- 如 'single_note_1'
  name TEXT NOT NULL,                     -- '单音识别 I'
  description TEXT,
  category TEXT NOT NULL,                 -- 'basic', 'intermediate', 'advanced'
  icon TEXT,                              -- emoji或图标
  sort_order INTEGER NOT NULL,
  prerequisite_skill_id TEXT REFERENCES skills(id), -- 前置技能
  xp_reward INTEGER DEFAULT 100,          -- 完成技能奖励XP
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 课程单元表
CREATE TABLE lessons (
  id TEXT PRIMARY KEY,                    -- 如 'single_note_1_lesson_1'
  skill_id TEXT REFERENCES skills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                     -- '认识中央C'
  description TEXT,
  lesson_order INTEGER NOT NULL,          -- 课程顺序
  lesson_type TEXT NOT NULL,              -- 'quiz', 'sing', 'listen', 'mixed'
  content JSONB NOT NULL,                 -- 课程内容配置
  xp_reward INTEGER DEFAULT 20,           -- 完成课程奖励XP
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户技能进度表
CREATE TABLE user_skill_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id TEXT REFERENCES skills(id),
  status TEXT DEFAULT 'locked',           -- 'locked', 'unlocked', 'in_progress', 'completed'
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, skill_id)
);

-- 用户课程进度表
CREATE TABLE user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT REFERENCES lessons(id),
  status TEXT DEFAULT 'locked',           -- 'locked', 'unlocked', 'completed'
  best_score INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);
```

#### 课程内容配置示例

```typescript
// lessons.content 字段的JSON结构
interface LessonContent {
  // 课程类型
  type: 'quiz' | 'sing' | 'listen' | 'theory';
  
  // 题目列表
  questions: Question[];
  
  // 通过条件
  passThreshold: number; // 正确率阈值，如 0.8
  
  // 可选：理论讲解
  theory?: {
    title: string;
    content: string;
    audioExample?: string;
  };
}

// 示例：单音识别课程
const lesson1Content: LessonContent = {
  type: 'quiz',
  questions: [
    { type: 'identify', targetMidi: 60, options: [60, 62, 64, 65] }, // C4
    { type: 'identify', targetMidi: 62, options: [60, 62, 64, 65] }, // D4
    // ... 共10题
  ],
  passThreshold: 0.8,
  theory: {
    title: '认识中央C',
    content: '中央C是钢琴键盘正中间的C音，MIDI编号60，频率约261.6Hz...',
    audioExample: 'c4_demo.mp3'
  }
};
```

---

### 3.2 XP经验值系统 [P0 核心]

#### 功能描述
统一的进度激励机制，所有活动都能获得XP，XP累计升级。

#### XP获取规则

| 活动 | 基础XP | 加成条件 |
|------|-------|---------|
| 完成1道题 | +10 | 连击×1.5, 首次×2 |
| 完成1节课 | +20 | 满分通过×2 |
| 完成1个技能 | +100 | - |
| 每日挑战 | +50 | 排名前10%×2 |
| 连续打卡 | +10×天数 | 7天连续×2 |
| 好友PK胜利 | +30 | - |

#### 等级系统

| 等级 | 名称 | 所需累计XP | 解锁内容 |
|-----|------|-----------|---------|
| 1 | 音乐新手 | 0 | 基础课程 |
| 5 | 初学者 | 500 | 自定义头像框 |
| 10 | 音感学徒 | 2,000 | 联赛系统 |
| 15 | 进阶学员 | 5,000 | 进阶课程 |
| 20 | 音乐达人 | 10,000 | 专业课程 |
| 25 | 练耳高手 | 20,000 | 特殊称号 |
| 30 | 音感大师 | 35,000 | 金色徽章 |
| 40 | 绝对音感 | 60,000 | 传奇称号 |
| 50 | 音乐之神 | 100,000 | 专属皮肤 |

#### 数据库设计

```sql
-- 用户XP与等级表
CREATE TABLE user_xp (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  xp_today INTEGER DEFAULT 0,             -- 今日获得XP
  last_xp_date DATE,                      -- 上次获得XP的日期
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- XP记录表（可选，用于详细追踪）
CREATE TABLE xp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_amount INTEGER NOT NULL,
  source TEXT NOT NULL,                   -- 'lesson', 'daily', 'streak', 'pk'
  source_id TEXT,                         -- 关联的课程/挑战ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 等级配置表
CREATE TABLE level_config (
  level INTEGER PRIMARY KEY,
  required_xp INTEGER NOT NULL,
  title TEXT NOT NULL,
  rewards JSONB                           -- 解锁奖励
);

-- 插入等级配置
INSERT INTO level_config (level, required_xp, title) VALUES
(1, 0, '音乐新手'),
(5, 500, '初学者'),
(10, 2000, '音感学徒'),
(15, 5000, '进阶学员'),
(20, 10000, '音乐达人'),
(25, 20000, '练耳高手'),
(30, 35000, '音感大师'),
(40, 60000, '绝对音感'),
(50, 100000, '音乐之神');
```

---

### 3.3 联赛系统 [P1 重要]

#### 功能描述
周期性竞技，按周XP排名，晋级/降级机制增加紧张感。

#### 联赛等级

```
🥉 青铜联赛 (所有人起点)
      ↓ 前20%晋级
🥈 白银联赛
      ↓ 前15%晋级
🥇 黄金联赛
      ↓ 前10%晋级
💎 钻石联赛
      ↓ 前5%晋级
👑 大师联赛
      ↓ 前3名
🏆 传奇联赛 (最高荣誉)
```

#### 规则设计

| 规则 | 说明 |
|------|------|
| 赛季周期 | 每周一 00:00 重置 |
| 分组人数 | 每组30人随机匹配 |
| 晋级规则 | 本组排名前20%晋级 |
| 保级规则 | 本组排名后20%降级 |
| 奖励 | 每周结算XP奖励 + 联赛专属徽章 |

#### 数据库设计

```sql
-- 联赛配置
CREATE TABLE league_config (
  id TEXT PRIMARY KEY,                    -- 'bronze', 'silver', 'gold', 'diamond', 'master', 'legend'
  name TEXT NOT NULL,
  icon TEXT,
  promotion_rate FLOAT,                   -- 晋级比例
  demotion_rate FLOAT,                    -- 降级比例
  xp_multiplier FLOAT DEFAULT 1.0,        -- XP加成
  sort_order INTEGER
);

-- 联赛赛季
CREATE TABLE league_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active',           -- 'upcoming', 'active', 'ended'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户联赛状态
CREATE TABLE user_league (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_league TEXT REFERENCES league_config(id) DEFAULT 'bronze',
  current_season_id UUID REFERENCES league_seasons(id),
  group_id UUID,                          -- 分组ID
  weekly_xp INTEGER DEFAULT 0,
  rank_in_group INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 联赛分组
CREATE TABLE league_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES league_seasons(id),
  league_id TEXT REFERENCES league_config(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 联赛历史记录
CREATE TABLE league_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id UUID REFERENCES league_seasons(id),
  league_id TEXT REFERENCES league_config(id),
  final_rank INTEGER,
  final_xp INTEGER,
  result TEXT,                            -- 'promoted', 'stayed', 'demoted'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3.4 间隔重复复习系统 [P1 重要]

#### 功能描述
基于遗忘曲线的智能复习推荐，强化薄弱知识点。

#### 算法设计

使用简化版SM-2算法：

```typescript
interface ReviewItem {
  lessonId: string;
  easeFactor: number;      // 难度因子 (1.3 - 2.5)
  interval: number;        // 复习间隔(天)
  nextReviewDate: Date;
  repetitions: number;     // 复习次数
}

function calculateNextReview(item: ReviewItem, quality: number): ReviewItem {
  // quality: 0-5 评分 (0=完全忘记, 5=轻松记住)
  
  if (quality < 3) {
    // 回答不好，重置
    return {
      ...item,
      repetitions: 0,
      interval: 1,
      nextReviewDate: addDays(new Date(), 1)
    };
  }
  
  let newInterval: number;
  if (item.repetitions === 0) {
    newInterval = 1;
  } else if (item.repetitions === 1) {
    newInterval = 3;
  } else {
    newInterval = Math.round(item.interval * item.easeFactor);
  }
  
  const newEaseFactor = Math.max(1.3, 
    item.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );
  
  return {
    ...item,
    repetitions: item.repetitions + 1,
    interval: newInterval,
    easeFactor: newEaseFactor,
    nextReviewDate: addDays(new Date(), newInterval)
  };
}
```

#### 数据库设计

```sql
-- 用户复习计划
CREATE TABLE user_review_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT REFERENCES lessons(id),
  ease_factor FLOAT DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  repetitions INTEGER DEFAULT 0,
  next_review_date DATE NOT NULL,
  last_review_date DATE,
  last_quality INTEGER,                   -- 上次复习评分 0-5
  UNIQUE(user_id, lesson_id)
);

-- 索引：查询待复习内容
CREATE INDEX idx_review_schedule_date 
  ON user_review_schedule(user_id, next_review_date);
```

#### UI设计

```
┌─────────────────────────────────────┐
│  📚 今日复习                         │
│                                     │
│  你有 3 个课程需要复习               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🎵 大二度识别      ⏰ 已到期  │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🎤 中音区哼唱      ⏰ 今日    │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🎯 快速识音        ⏰ 今日    │   │
│  └─────────────────────────────┘   │
│                                     │
│  [开始复习] [稍后提醒]              │
└─────────────────────────────────────┘
```

---

### 3.5 练习场 - 特色功能保留 [P0 核心]

#### 设计理念
保留原有三种练习模式作为**自由练习区**，与课程系统并行存在。

#### 功能矩阵

| 模式 | 特色 | 与课程的关系 |
|------|------|-------------|
| 🎤 自由哼唱 | 实时音高可视化，无评分压力 | 独立存在 |
| 🎧 听音辨位 | 快速练习，无限制 | 课程的自由练习版 |
| 🎵 哼唱闯关 | 挑战极限，刷高分 | 课程的自由练习版 |

#### 增强设计

**自由哼唱模式增强：**
- 新增：音域测试功能，找到用户舒适音域
- 新增：录音回放功能
- 新增：目标音辅助线（可选开启）

**听音辨位模式增强：**
- 新增：难度选择（音域范围）
- 新增：题目数量选择（10/20/50/无限）
- 新增：限时模式

**哼唱闯关模式增强：**
- 新增：难度递进（随关卡音域扩大）
- 新增：生命值机制（3条命）
- 新增：技能道具（跳过、提示、重听）

---

### 3.6 成就系统扩展 [P0 核心]

#### 成就分类

**🎓 学习成就**
| ID | 名称 | 条件 | 奖励XP |
|----|------|------|--------|
| first_lesson | 开始旅程 | 完成第一节课 | 50 |
| skill_1 | 技能解锁 | 完成第一个技能 | 100 |
| skill_5 | 五星学员 | 完成5个技能 | 200 |
| all_basic | 基础毕业 | 完成基础篇所有技能 | 500 |
| all_intermediate | 进阶达人 | 完成进阶篇所有技能 | 1000 |
| all_advanced | 专业认证 | 完成专业篇所有技能 | 2000 |

**🎮 练习成就**
| ID | 名称 | 条件 | 奖励XP |
|----|------|------|--------|
| streak_5 | 小有成就 | 单局连击5次 | 30 |
| streak_10 | 耳朵灵敏 | 单局连击10次 | 50 |
| streak_20 | 音感达人 | 单局连击20次 | 100 |
| perfect_10 | 完美表现 | 10题全对 | 80 |
| speed_demon | 闪电反应 | 10题内平均反应<1秒 | 100 |

**📅 坚持成就**
| ID | 名称 | 条件 | 奖励XP |
|----|------|------|--------|
| daily_3 | 初露锋芒 | 连续3天练习 | 30 |
| daily_7 | 周周向上 | 连续7天练习 | 100 |
| daily_30 | 月度达人 | 连续30天练习 | 500 |
| daily_100 | 百日坚持 | 连续100天练习 | 2000 |
| daily_365 | 年度传奇 | 连续365天练习 | 10000 |

**🏆 竞技成就**
| ID | 名称 | 条件 | 奖励XP |
|----|------|------|--------|
| daily_top10 | 今日之星 | 每日挑战前10名 | 50 |
| daily_top3 | 三甲荣耀 | 每日挑战前3名 | 100 |
| daily_champion | 日冠军 | 每日挑战第1名 | 200 |
| league_promote | 晋级之路 | 联赛晋级1次 | 100 |
| league_gold | 黄金玩家 | 进入黄金联赛 | 300 |
| league_diamond | 钻石之心 | 进入钻石联赛 | 500 |
| league_legend | 传奇诞生 | 进入传奇联赛 | 2000 |

**🎵 专项成就**
| ID | 名称 | 条件 | 奖励XP |
|----|------|------|--------|
| perfect_pitch_test | 音感测试 | 完成音域测试 | 20 |
| interval_master | 音程大师 | 所有音程正确率>90% | 500 |
| sing_stable | 稳如泰山 | 哼唱偏差<10音分持续10秒 | 200 |

---

### 3.7 每日挑战 [P0 核心]

（保留原PRD设计，增加以下内容）

#### 挑战类型轮换

| 星期 | 挑战类型 | 说明 |
|------|---------|------|
| 周一 | 听音辨位 | 10题单音识别 |
| 周二 | 哼唱挑战 | 5个目标音 |
| 周三 | 音程识别 | 10题音程题 |
| 周四 | 混合挑战 | 听+唱混合 |
| 周五 | 极速挑战 | 限时30秒 |
| 周六 | 高难挑战 | 扩展音域 |
| 周日 | 自由挑战 | 随机类型 |

---

### 3.8 数据统计与分析 [P0 核心]

（保留原PRD设计，增加以下内容）

#### 统计维度

```
个人数据中心
│
├── 📊 学习概览
│   ├── 总XP / 当前等级
│   ├── 技能完成度 (已完成/总数)
│   ├── 累计学习时长
│   └── 连续打卡天数
│
├── 📈 进步趋势
│   ├── 每日XP获取曲线
│   ├── 正确率变化趋势
│   └── 平均反应时间变化
│
├── 🎯 能力分析
│   ├── 各音符正确率热力图
│   ├── 音程识别雷达图
│   └── 薄弱点TOP5
│
├── 🏆 成就展示
│   ├── 已解锁成就
│   ├── 进行中成就
│   └── 稀有度统计
│
└── 📅 历史记录
    ├── 每日挑战历史
    ├── 联赛战绩
    └── 最佳成绩记录
```

---

### 3.9 音程与和弦训练 [P1 重要]

#### 音程训练

```typescript
const INTERVALS = [
  // 基础音程
  { id: 'm2', name: '小二度', semitones: 1, difficulty: 'hard' },
  { id: 'M2', name: '大二度', semitones: 2, difficulty: 'medium' },
  { id: 'm3', name: '小三度', semitones: 3, difficulty: 'easy' },
  { id: 'M3', name: '大三度', semitones: 4, difficulty: 'easy' },
  { id: 'P4', name: '纯四度', semitones: 5, difficulty: 'easy' },
  { id: 'TT', name: '三全音', semitones: 6, difficulty: 'hard' },
  { id: 'P5', name: '纯五度', semitones: 7, difficulty: 'easy' },
  { id: 'm6', name: '小六度', semitones: 8, difficulty: 'medium' },
  { id: 'M6', name: '大六度', semitones: 9, difficulty: 'medium' },
  { id: 'm7', name: '小七度', semitones: 10, difficulty: 'hard' },
  { id: 'M7', name: '大七度', semitones: 11, difficulty: 'hard' },
  { id: 'P8', name: '纯八度', semitones: 12, difficulty: 'easy' },
];

// 难度分级
const DIFFICULTY_LEVELS = {
  beginner: ['m3', 'M3', 'P4', 'P5', 'P8'],           // 5种
  intermediate: ['M2', 'm3', 'M3', 'P4', 'P5', 'm6', 'M6', 'P8'],  // 8种
  advanced: Object.keys(INTERVALS),                    // 全部12种
};
```

#### 和弦训练（P2）

```typescript
const CHORDS = [
  { id: 'major', name: '大三和弦', intervals: [0, 4, 7] },
  { id: 'minor', name: '小三和弦', intervals: [0, 3, 7] },
  { id: 'dim', name: '减三和弦', intervals: [0, 3, 6] },
  { id: 'aug', name: '增三和弦', intervals: [0, 4, 8] },
  { id: 'maj7', name: '大七和弦', intervals: [0, 4, 7, 11] },
  { id: 'min7', name: '小七和弦', intervals: [0, 3, 7, 10] },
  { id: 'dom7', name: '属七和弦', intervals: [0, 4, 7, 10] },
];
```

---

## 四、UI/UX设计指南

### 4.1 页面结构

```
┌─────────────────────────────────────────────────┐
│  Header: Logo | XP进度条 | 等级 | 用户头像     │
├─────────────────────────────────────────────────┤
│                                                 │
│                  主内容区                        │
│                                                 │
├─────────────────────────────────────────────────┤
│  Tab Bar: 学习 | 练习 | 竞技 | 我的            │
└─────────────────────────────────────────────────┘
```

### 4.2 新增页面列表

| 页面 | 路由 | 说明 |
|------|------|------|
| 技能树 | /learn | 学习中心主页 |
| 课程详情 | /learn/skill/:id | 技能下的课程列表 |
| 课程学习 | /lesson/:id | 课程学习界面 |
| 复习中心 | /review | 待复习内容 |
| 竞技中心 | /compete | 每日挑战+联赛入口 |
| 联赛详情 | /league | 联赛排名和分组 |
| 个人中心 | /profile | 数据统计+成就 |
| 设置 | /settings | 账号+偏好设置 |

### 4.3 动效设计

| 场景 | 动效 |
|------|------|
| 获得XP | 数字飞入动画 + 进度条增长 |
| 升级 | 全屏庆祝动画 + 撒花 |
| 解锁成就 | Toast滑入 + 徽章放大 |
| 连击 | 数字放大 + 火焰特效 |
| 完成课程 | 星星评级动画 |
| 晋级联赛 | 奖杯升起动画 |

---

## 五、技术规范

### 5.1 已知问题避坑清单

> ⚠️ **重要：以下是项目开发中验证过的问题和解决方案**

| 问题 | ❌ 错误方法 | ✅ 正确方法 |
|------|-----------|-----------|
| 查询可能为空的记录 | `.single()` 抛406错误 | `.maybeSingle()` 返回null |
| 保存最高分 | `upsert` 直接覆盖 | 先查询比较再更新 |
| profiles查询失败 | 阻塞整个功能 | try-catch + 默认值降级 |
| 音高检测不稳定 | 简单自相关算法 | YIN算法 + 中值滤波 |
| 浏览器干扰检测 | 默认音频设置 | 禁用echoCancellation等 |
| SPA路由404 | 无配置 | vercel.json重写规则 |
| 音频首次延迟 | 点击时加载 | 预加载采样 |

### 5.2 新增数据表汇总

```sql
-- 完整的新增表清单
-- 1. 技能系统
CREATE TABLE skills (...);
CREATE TABLE lessons (...);
CREATE TABLE user_skill_progress (...);
CREATE TABLE user_lesson_progress (...);

-- 2. XP系统
CREATE TABLE user_xp (...);
CREATE TABLE xp_logs (...);
CREATE TABLE level_config (...);

-- 3. 联赛系统
CREATE TABLE league_config (...);
CREATE TABLE league_seasons (...);
CREATE TABLE user_league (...);
CREATE TABLE league_groups (...);
CREATE TABLE league_history (...);

-- 4. 复习系统
CREATE TABLE user_review_schedule (...);

-- 5. 成就系统 (扩展)
CREATE TABLE achievements (...);
CREATE TABLE user_achievements (...);
CREATE TABLE user_streaks (...);

-- 6. 每日挑战 (扩展)
CREATE TABLE daily_challenges (...);
CREATE TABLE daily_challenge_scores (...);

-- 7. 练习记录
CREATE TABLE practice_records (...);
CREATE TABLE daily_stats (...);
```

### 5.3 性能优化要点

1. **课程内容预加载**：进入技能页时预加载下一课内容
2. **音频采样懒加载**：仅加载当前课程需要的音域
3. **统计数据缓存**：使用SWR或React Query缓存API响应
4. **列表虚拟化**：排行榜超过50条时使用虚拟滚动
5. **XP动画节流**：快速获得XP时合并动画

---

## 六、开发里程碑

### Phase 1：学习系统基础 (核心)
- [ ] 技能树页面UI
- [ ] 课程学习流程
- [ ] XP系统实现
- [ ] 等级系统实现
- [ ] 课程进度存储

### Phase 2：激励系统 (核心)
- [ ] 成就系统扩展
- [ ] 连续打卡追踪
- [ ] 每日挑战增强
- [ ] 升级/成就动效

### Phase 3：竞技系统
- [ ] 联赛系统实现
- [ ] 分组匹配逻辑
- [ ] 周结算流程
- [ ] 联赛排行榜

### Phase 4：智能学习
- [ ] 间隔重复算法
- [ ] 复习提醒系统
- [ ] 薄弱点分析
- [ ] 个性化推荐

### Phase 5：内容扩展
- [ ] 音程训练模式
- [ ] 和弦训练模式
- [ ] 多乐器音色
- [ ] 课程内容填充

### Phase 6：社交功能
- [ ] 好友系统
- [ ] 好友PK
- [ ] 分享增强

---

## 七、成功指标

| 指标 | 目标值 | 说明 |
|------|-------|------|
| 次日留存率 | >40% | 新用户第二天返回 |
| 7日留存率 | >25% | 核心用户留存 |
| 日均使用时长 | >5分钟 | 用户粘性 |
| 课程完成率 | >60% | 开始的课程被完成 |
| 每日挑战参与率 | >30% | 日活用户参与 |
| 联赛参与率 | >50% | 达到等级的用户参与 |

---

*文档最后更新: 2026-01-23*
*版本: v2.1 扩展版*
