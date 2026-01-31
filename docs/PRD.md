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

## 八、下阶段规划：用户体验与商业化 (v3.0)

> **更新日期**: 2026-01-30  
> **规划周期**: 2026 Q1-Q2  
> **核心目标**: 优化新用户体验 + 建立可持续商业模式

### 8.1 阶段目标

| 阶段 | 时间 | 核心指标 | 目标值 |
|------|------|----------|--------|
| Phase 7 | 2周 | 新用户首日完课率 | ≥60% |
| Phase 8 | 3周 | 7日留存率 | ≥30% |
| Phase 9 | 4周 | 付费转化率 | ≥3% |
| Phase 10 | 持续 | 月均 ARPU | ≥¥8 |

---

## 九、用户体验优化方案 (Phase 7)

### 9.1 新用户引导系统 [P0 核心]

#### 问题诊断
当前新用户直接进入技能树页面，存在以下问题：
- 没有欢迎仪式感，缺乏"被重视"的体验
- 不知道自己的水平，无法选择合适起点
- 首课体验未经优化，放弃率高

#### 解决方案：4步引导流程

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: 欢迎页 (3秒)                                            │
│  ┌─────────────────────────────────────────────┐                │
│  │  🎵 欢迎来到 Melody Challenger              │                │
│  │                                             │                │
│  │  「让每个人都能拥有好音感」                   │                │
│  │                                             │                │
│  │  [开始我的音乐之旅 →]                        │                │
│  └─────────────────────────────────────────────┘                │
├─────────────────────────────────────────────────────────────────┤
│  Step 2: 快速能力测试 (60秒，5题)                                │
│  ┌─────────────────────────────────────────────┐                │
│  │  🎧 让我们先听一听你的音感水平               │                │
│  │                                             │                │
│  │  ● ○ ○ ○ ○                                  │                │
│  │                                             │                │
│  │  [播放音符] → [选择答案]                     │                │
│  │                                             │                │
│  │  💡 不用担心，这不是考试，只是帮你找到起点   │                │
│  └─────────────────────────────────────────────┘                │
├─────────────────────────────────────────────────────────────────┤
│  Step 3: 结果 + 目标设定                                         │
│  ┌─────────────────────────────────────────────┐                │
│  │  🌟 测试完成！你的音感水平：初级             │                │
│  │                                             │                │
│  │  推荐你从「单音识别 I」开始                  │                │
│  │                                             │                │
│  │  设定你的学习目标：                          │                │
│  │  ○ 每天5分钟，轻松入门                       │                │
│  │  ● 每天10分钟，稳步提升 (推荐)               │                │
│  │  ○ 每天15分钟，快速进阶                      │                │
│  │                                             │                │
│  │  [设定目标，开始学习]                        │                │
│  └─────────────────────────────────────────────┘                │
├─────────────────────────────────────────────────────────────────┤
│  Step 4: 首课引导 (特殊优化版)                                   │
│  - 题目数量减少到 5 题（正常课程 10 题）                          │
│  - 每题都有鼓励性反馈                                            │
│  - 完成后大幅庆祝动画                                            │
│  - 解锁「开始旅程」成就                                          │
└─────────────────────────────────────────────────────────────────┘
```

#### 数据库设计

```sql
-- 用户引导状态表
CREATE TABLE user_onboarding (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  ability_test_score INTEGER,                    -- 能力测试得分 (0-5)
  recommended_skill TEXT,                        -- 推荐起始技能
  daily_goal_minutes INTEGER DEFAULT 10,         -- 每日目标分钟数
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 能力测试题目配置
CREATE TABLE ability_test_questions (
  id SERIAL PRIMARY KEY,
  question_order INTEGER NOT NULL,
  question_type TEXT NOT NULL,                   -- 'identify', 'compare'
  difficulty TEXT NOT NULL,                      -- 'easy', 'medium', 'hard'
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 前端实现要点

```typescript
// src/pages/Onboarding.tsx
interface OnboardingState {
  step: 'welcome' | 'test' | 'result' | 'first_lesson';
  testScore: number;
  recommendedSkill: string;
  dailyGoal: number;
}

// 能力等级映射
const ABILITY_LEVELS = {
  0: { level: '完全新手', skill: 'single_note_1', message: '从零开始，稳扎稳打' },
  1: { level: '初级', skill: 'single_note_1', message: '有基础概念，继续加油' },
  2: { level: '入门', skill: 'single_note_1', message: '音感不错，可以快速进步' },
  3: { level: '中级', skill: 'interval_basic', message: '有一定基础，挑战音程吧' },
  4: { level: '进阶', skill: 'fast_recognition', message: '很棒！试试限时挑战' },
  5: { level: '高级', skill: 'complex_intervals', message: '专业水准，直接进阶' },
};
```

---

### 9.2 答题反馈优化 [P0 核心]

#### 问题诊断
当前答题反馈仅显示"正确/错误"，用户无法学习：
- 不知道正确答案是什么音
- 不理解自己为什么错
- 没有"学到东西"的感觉

#### 解决方案：丰富反馈内容

```typescript
// 答错反馈设计
interface WrongAnswerFeedback {
  userAnswer: string;        // "你选择了 D4"
  correctAnswer: string;     // "正确答案是 C4"
  tip: string;               // "小技巧：C4 听起来比 D4 低一个全音"
  listenAgain: boolean;      // 提供重听按钮
}

// 各类型题目的反馈模板
const FEEDBACK_TEMPLATES = {
  identify: {
    correct: '太棒了！{note} 听得很准 🎉',
    wrong: '你选择了 {userAnswer}，正确答案是 {correctAnswer}。\n💡 {correctAnswer} 听起来{comparison}。'
  },
  interval: {
    correct: '没错！这是{interval}，{semitones}个半音 ✨',
    wrong: '这个是{correctInterval}，不是{userInterval}。\n💡 记忆技巧：{mnemonic}'
  },
  chord: {
    correct: '正确！{chord}和弦辨别准确 🎹',
    wrong: '这是{correctChord}，不是{userChord}。\n💡 {correctChord}听起来{characteristic}。'
  }
};

// 音程记忆口诀
const INTERVAL_MNEMONICS = {
  'm2': '小二度像"大白鲨"主题的开头两个音',
  'M2': '大二度是"两只老虎"的前两个音',
  'm3': '小三度有种淡淡的忧伤感',
  'M3': '大三度明亮开朗，像"小星星"开头',
  'P4': '纯四度是"婚礼进行曲"开头',
  'P5': '纯五度是"星球大战"主题开头',
  // ...
};
```

#### UI 设计

```
答错反馈弹窗:
┌─────────────────────────────────────────┐
│  ❌ 再想想                              │
│                                         │
│  你选择了 D4                            │
│  正确答案是 C4                          │
│                                         │
│  💡 C4（中央C）是钢琴中间的那个C，      │
│     听起来比D4低一个全音                │
│                                         │
│  [🔊 重听正确答案]    [继续 →]          │
└─────────────────────────────────────────┘
```

---

### 9.3 渐进式登录引导 [P1 重要]

#### 问题诊断
当前游客体验：
- 复习中心、好友系统完全锁定，体验割裂
- 没有渐进式引导，用户突然被拦截
- 登录动机不足

#### 解决方案：渐进式价值展示

```
游客体验路径设计:
┌───────────────────────────────────────────────────────────────────┐
│  阶段1: 自由体验 (前2课)                                           │
│  - 完全开放，无任何限制                                            │
│  - 数据存储在本地                                                  │
│  - 底部显示"登录可云同步进度"提示条                                │
├───────────────────────────────────────────────────────────────────┤
│  阶段2: 软性提醒 (第3课前)                                         │
│  ┌─────────────────────────────────────────────┐                  │
│  │  🎉 太棒了！你已经完成了2节课                │                  │
│  │                                             │                  │
│  │  登录后可以：                                │                  │
│  │  ✓ 云端同步，换设备也不丢进度               │                  │
│  │  ✓ 参与排行榜，和全服玩家比拼               │                  │
│  │  ✓ 解锁成就系统                             │                  │
│  │                                             │                  │
│  │  [登录/注册]    [稍后再说]                   │                  │
│  └─────────────────────────────────────────────┘                  │
│  点击"稍后再说"可继续，但每完成2课提醒一次                         │
├───────────────────────────────────────────────────────────────────┤
│  阶段3: 功能限制提示                                               │
│  - 访问复习中心："登录后开启智能复习"                              │
│  - 访问好友系统："登录后添加好友"                                  │
│  - 参与每日挑战："登录后参与排名"                                  │
└───────────────────────────────────────────────────────────────────┘
```

#### 第三方登录支持

```typescript
// 登录方式优先级
const LOGIN_METHODS = [
  { id: 'wechat', name: '微信登录', icon: '💬', priority: 1 },    // 国内首选
  { id: 'google', name: 'Google 登录', icon: '🔍', priority: 2 }, // 海外首选
  { id: 'apple', name: 'Apple 登录', icon: '🍎', priority: 3 },   // iOS 用户
  { id: 'email', name: '邮箱登录', icon: '✉️', priority: 4 },     // 备选
];
```

---

### 9.4 课程理论模块 [P1 重要]

#### 问题诊断
当前课程只有做题，缺少"教"的环节：
- 用户不理解音乐理论
- 只知道对错，不知道为什么
- 学习深度不足

#### 解决方案：每课前置理论讲解

```typescript
// 课程结构扩展
interface LessonContent {
  // 新增：理论讲解模块
  theory?: {
    title: string;                    // "什么是中央C？"
    content: string;                  // Markdown 格式讲解
    audioExamples: AudioExample[];    // 音频示例
    keyPoints: string[];              // 知识要点
    estimatedTime: number;            // 预计阅读时间（秒）
  };
  
  // 原有：题目配置
  questions: Question[];
  passThreshold: number;
}

// 示例：单音识别第1课
const LESSON_1_CONTENT: LessonContent = {
  theory: {
    title: '认识中央C',
    content: `
## 中央C是什么？

中央C（C4）是钢琴键盘正中间的那个C音，是音乐学习的重要参考点。

### 为什么叫"中央C"？
- 位于大字组和小字组的分界处
- 在五线谱上，刚好在高音谱号和低音谱号之间
- MIDI 编号是 60

### 如何记住它的声音？
中央C的频率约为 261.6Hz，听起来不高不低，非常"中正"。
    `,
    audioExamples: [
      { label: '中央C (C4)', midi: 60 },
      { label: '低八度C (C3)', midi: 48 },
      { label: '高八度C (C5)', midi: 72 },
    ],
    keyPoints: [
      '中央C = C4 = MIDI 60',
      '位于钢琴键盘中间位置',
      '是音乐学习的基准参考音',
    ],
    estimatedTime: 60,
  },
  questions: [
    // ... 10道练习题
  ],
  passThreshold: 0.8,
};
```

#### UI 设计

```
理论讲解页面:
┌─────────────────────────────────────────┐
│  📖 认识中央C                           │
│                                         │
│  [进度条: ■■■□□□□□□□ 30%]               │
│                                         │
│  中央C（C4）是钢琴键盘正中间的那个C音...│
│                                         │
│  🔊 听一听                              │
│  ┌─────────────────────────────────┐   │
│  │ [▶️ C4] [▶️ C3] [▶️ C5]          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  📝 知识要点                            │
│  • 中央C = C4 = MIDI 60                 │
│  • 位于钢琴键盘中间位置                  │
│                                         │
│  [我学会了，开始练习 →]                  │
└─────────────────────────────────────────┘
```

---

### 9.5 学习提醒系统 [P2 增强]

#### 功能设计

```typescript
// 提醒设置
interface ReminderSettings {
  enabled: boolean;
  time: string;              // "20:00" 
  timezone: string;          // "Asia/Shanghai"
  channels: {
    push: boolean;           // 浏览器推送
    email: boolean;          // 邮件提醒
    wechat: boolean;         // 微信服务号（未来）
  };
  smartReminder: boolean;    // 智能提醒（根据习惯调整）
}

// 提醒消息模板
const REMINDER_TEMPLATES = [
  '🎵 今天还没练习哦，来完成一节课吧！',
  '🔥 你的连续打卡记录是 {streak} 天，别断了！',
  '📚 你有 {reviewCount} 个课程需要复习',
  '🏆 距离下一个等级还差 {xpNeeded} XP',
];
```

---

## 十、商业化变现方案 (Phase 8-9)

### 10.1 付费体系设计 [P0 核心]

#### 设计原则

1. **免费版足够好**：用户能感受完整价值，付费是加速而非解锁
2. **付费即刻可见**：付费后立即感受到差异
3. **社交炫耀价值**：专属标识让付费用户有荣誉感
4. **灵活选择**：多种付费档位满足不同需求

#### 会员权益对比

| 功能 | 免费版 | 月度会员 | 年度会员 | 终身会员 |
|------|--------|----------|----------|----------|
| **基础课程** | ✅ 全部 | ✅ 全部 | ✅ 全部 | ✅ 全部 |
| **进阶课程** | ⚠️ 前2节 | ✅ 全部 | ✅ 全部 | ✅ 全部 |
| **专业课程** | ❌ 锁定 | ✅ 全部 | ✅ 全部 | ✅ 全部 |
| **每日练习次数** | 10次 | 无限 | 无限 | 无限 |
| **每日挑战** | ✅ 参与 | ✅ 参与 | ✅ 参与 | ✅ 参与 |
| **详细统计分析** | ❌ 基础 | ✅ 完整 | ✅ 完整 | ✅ 完整 |
| **离线模式** | ❌ | ✅ | ✅ | ✅ |
| **广告** | 有 | 无 | 无 | 无 |
| **专属头像框** | ❌ | ✅ 银色 | ✅ 金色 | ✅ 钻石 |
| **专属称号** | ❌ | ❌ | ✅ "年度学员" | ✅ "终身挚友" |
| **优先客服** | ❌ | ❌ | ✅ | ✅ |
| **未来功能** | 需付费 | 需付费 | 需付费 | ✅ 免费 |
| **定价** | ¥0 | ¥18/月 | ¥128/年 | ¥298 |

#### 数据库设计

```sql
-- 会员订阅表
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,                      -- 'monthly', 'yearly', 'lifetime'
  status TEXT NOT NULL DEFAULT 'active',        -- 'active', 'cancelled', 'expired'
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,                       -- NULL for lifetime
  cancelled_at TIMESTAMPTZ,
  payment_provider TEXT,                        -- 'stripe', 'wechat', 'alipay'
  payment_id TEXT,                              -- 外部支付ID
  amount_paid INTEGER,                          -- 实际支付金额（分）
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 会员权益配置
CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY,                          -- 'monthly', 'yearly', 'lifetime'
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,                 -- 价格（分）
  duration_days INTEGER,                        -- 有效期天数，NULL=永久
  features JSONB NOT NULL,                      -- 权益配置
  sort_order INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入会员配置
INSERT INTO subscription_plans (id, name, price_cents, duration_days, features, sort_order) VALUES
('monthly', '月度会员', 1800, 30, 
  '{"unlimited_practice": true, "advanced_courses": true, "no_ads": true, "detailed_stats": true, "offline_mode": true, "badge_color": "silver"}', 
  1),
('yearly', '年度会员', 12800, 365, 
  '{"unlimited_practice": true, "advanced_courses": true, "no_ads": true, "detailed_stats": true, "offline_mode": true, "badge_color": "gold", "title": "年度学员", "priority_support": true}', 
  2),
('lifetime', '终身会员', 29800, NULL, 
  '{"unlimited_practice": true, "advanced_courses": true, "no_ads": true, "detailed_stats": true, "offline_mode": true, "badge_color": "diamond", "title": "终身挚友", "priority_support": true, "future_features": true}', 
  3);

-- 支付记录表
CREATE TABLE payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'CNY',
  payment_provider TEXT NOT NULL,
  payment_id TEXT,
  status TEXT DEFAULT 'pending',               -- 'pending', 'completed', 'failed', 'refunded'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status, expires_at);
```

---

### 10.2 付费转化漏斗设计 [P0 核心]

#### 转化触发点

```
免费用户旅程中的付费触发点:
┌───────────────────────────────────────────────────────────────────┐
│  触发点1: 进阶课程锁定                                             │
│  场景：用户完成基础篇，想学进阶课程                                  │
│  ┌─────────────────────────────────────────────┐                  │
│  │  🔒 进阶课程                                 │                  │
│  │                                             │                  │
│  │  音程进阶、和弦入门等进阶内容                │                  │
│  │  需要会员才能完整学习                        │                  │
│  │                                             │                  │
│  │  [解锁会员 ¥18/月]  [免费试学2节]            │                  │
│  └─────────────────────────────────────────────┘                  │
├───────────────────────────────────────────────────────────────────┤
│  触发点2: 练习次数用尽                                             │
│  场景：用户当日已练习10次                                          │
│  ┌─────────────────────────────────────────────┐                  │
│  │  😅 今日免费练习次数已用完                   │                  │
│  │                                             │                  │
│  │  升级会员，无限练习                          │                  │
│  │                                             │                  │
│  │  [成为会员]    [明天再来]                    │                  │
│  └─────────────────────────────────────────────┘                  │
├───────────────────────────────────────────────────────────────────┤
│  触发点3: 统计分析锁定                                             │
│  场景：用户想查看详细能力分析                                       │
│  ┌─────────────────────────────────────────────┐                  │
│  │  📊 你的音符热力图                           │                  │
│  │                                             │                  │
│  │  [🔒 模糊预览图]                             │                  │
│  │                                             │                  │
│  │  解锁完整分析，精准定位薄弱点                │                  │
│  │                                             │                  │
│  │  [解锁会员]                                  │                  │
│  └─────────────────────────────────────────────┘                  │
├───────────────────────────────────────────────────────────────────┤
│  触发点4: 去广告诉求                                               │
│  场景：课程间出现广告                                              │
│  ┌─────────────────────────────────────────────┐                  │
│  │  [广告倒计时 5s]                             │                  │
│  │                                             │                  │
│  │  ✨ 会员专享无广告体验                       │                  │
│  └─────────────────────────────────────────────┘                  │
└───────────────────────────────────────────────────────────────────┘
```

#### 限时优惠策略

```typescript
// 新用户专享优惠
interface NewUserOffer {
  type: 'first_purchase';
  discount: 0.5;                              // 5折
  validHours: 72;                             // 72小时有效
  applicablePlans: ['monthly', 'yearly'];
  message: '🎁 新用户专享5折优惠，72小时内有效';
}

// 流失用户召回
interface WinbackOffer {
  type: 'winback';
  triggerDays: 7;                             // 7天未活跃触发
  discount: 0.6;                              // 6折
  validHours: 48;
  message: '🌟 好久不见！专属6折优惠等你回来';
}

// 连续打卡奖励
interface StreakReward {
  type: 'streak_reward';
  streakDays: 30;                             // 连续30天
  reward: 'yearly_discount_20';               // 年费8折
  message: '🔥 30天坚持达成！年费会员8折奖励';
}
```

---

### 10.3 付费页面设计 [P1 重要]

```
会员订阅页面:
┌─────────────────────────────────────────────────────────────────┐
│  ← 返回                                    👑 成为会员           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    🎵 解锁完整音乐之旅                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  月度会员                                    ¥18/月      │   │
│  │  ○ 无限练习 · 进阶课程 · 无广告                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  年度会员                              ⭐ 最受欢迎        │   │
│  │  ● ¥128/年 (¥10.7/月，省¥88)                             │   │
│  │                                                          │   │
│  │  ✓ 月度会员全部权益                                      │   │
│  │  ✓ 金色专属头像框                                        │   │
│  │  ✓ "年度学员" 专属称号                                   │   │
│  │  ✓ 优先客服支持                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  终身会员                              💎 一次付费永久    │   │
│  │  ○ ¥298 (相当于1.9年年费)                                │   │
│  │                                                          │   │
│  │  ✓ 年度会员全部权益                                      │   │
│  │  ✓ 钻石专属头像框                                        │   │
│  │  ✓ "终身挚友" 专属称号                                   │   │
│  │  ✓ 未来所有新功能免费                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    [立即订阅]                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  💡 7天内不满意可全额退款                                       │
│                                                                 │
│  🔐 支付方式: 微信支付 · 支付宝 · Apple Pay                     │
└─────────────────────────────────────────────────────────────────┘
```

---

### 10.4 广告变现 [P2 补充]

#### 广告位设计原则

1. **不打断核心体验**：答题过程中不出广告
2. **自然融入**：在自然停顿点展示
3. **可控跳过**：付费或观看后可跳过

#### 广告位规划

| 广告位 | 位置 | 频率 | 类型 |
|--------|------|------|------|
| 课程间插屏 | 完成一课后 | 每3课1次 | 激励视频/插屏 |
| 首页横幅 | 学习中心底部 | 常驻 | 原生横幅 |
| 能量恢复 | 练习次数用尽时 | 触发式 | 激励视频 |

---

### 10.5 商业化指标体系 [P0 核心]

| 指标 | 定义 | 目标值 | 监控频率 |
|------|------|--------|----------|
| **付费转化率** | 付费用户/注册用户 | ≥3% | 每日 |
| **ARPU** | 总收入/活跃用户 | ≥¥8/月 | 每月 |
| **ARPPU** | 总收入/付费用户 | ≥¥50/月 | 每月 |
| **LTV** | 用户生命周期价值 | ≥¥150 | 每季度 |
| **CAC** | 获客成本 | ≤¥30 | 每月 |
| **LTV/CAC** | 投资回报比 | ≥5 | 每月 |
| **续费率** | 续费用户/到期用户 | ≥60% | 每月 |
| **退款率** | 退款订单/总订单 | ≤5% | 每周 |

---

## 十一、实施路线图

### Phase 7：用户体验优化 (预计2周)

| 周次 | 任务 | 产出 |
|------|------|------|
| Week 1 | 新用户引导流程设计 + 开发 | Onboarding 页面上线 |
| Week 1 | 答题反馈优化 | 错误反馈系统上线 |
| Week 2 | 渐进式登录引导 | 登录转化提升 |
| Week 2 | 课程理论模块框架 | 首批3课理论内容 |

### Phase 8：商业化基础 (预计3周)

| 周次 | 任务 | 产出 |
|------|------|------|
| Week 3 | 会员体系数据库设计 | Schema 完成 |
| Week 3 | 会员权益判断逻辑 | 免费/付费差异化 |
| Week 4 | 付费页面 UI | 订阅页面上线 |
| Week 4 | 支付接入（微信/支付宝） | 支付流程打通 |
| Week 5 | 付费触发点植入 | 转化漏斗完成 |
| Week 5 | 会员专属功能 | 头像框/称号上线 |

### Phase 9：商业化优化 (预计4周)

| 周次 | 任务 | 产出 |
|------|------|------|
| Week 6 | 新用户优惠策略 | 首购5折上线 |
| Week 6 | 广告位接入 | 课程间广告上线 |
| Week 7 | 数据埋点完善 | 转化漏斗分析 |
| Week 7 | A/B 测试框架 | 定价测试能力 |
| Week 8-9 | 优化迭代 | 根据数据调整 |

---

## 十二、风险与应对

| 风险 | 概率 | 影响 | 应对策略 |
|------|------|------|----------|
| 付费转化率低于预期 | 中 | 高 | 多档位测试、优惠策略调整 |
| 用户对付费墙反感 | 中 | 中 | 确保免费版体验完整、价值清晰 |
| 支付渠道审核延迟 | 中 | 高 | 提前申请、多渠道备份 |
| 竞品低价竞争 | 低 | 中 | 强调差异化价值、内容质量 |
| 退款纠纷 | 低 | 低 | 7天无理由退款、客服响应 |

---

## 十三、下阶段成功指标

### 用户体验指标

| 指标 | 当前值 | 目标值 | 衡量方式 |
|------|--------|--------|----------|
| 新用户首日完课率 | ~40% | ≥60% | 新用户当天完成≥1课的比例 |
| 引导流程完成率 | N/A | ≥80% | 完成4步引导的用户比例 |
| 课程放弃率 | ~30% | ≤20% | 开始但未完成的课程比例 |
| NPS 净推荐值 | N/A | ≥40 | 用户调研 |

### 商业化指标

| 指标 | 当前值 | Phase 8 目标 | Phase 9 目标 |
|------|--------|--------------|--------------|
| 付费转化率 | 0% | ≥1% | ≥3% |
| ARPU | ¥0 | ≥¥3 | ≥¥8 |
| 月收入 | ¥0 | ≥¥500 | ≥¥3,000 |

---

*文档最后更新: 2026-01-30*
*版本: v3.0 用户体验与商业化扩展版*
