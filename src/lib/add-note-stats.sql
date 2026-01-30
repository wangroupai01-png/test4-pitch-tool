-- =====================================================
-- 音符统计和能力分析增强
-- 运行位置: Supabase Dashboard -> SQL Editor
-- =====================================================

-- 1. 创建音符答题统计表
CREATE TABLE IF NOT EXISTS note_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  midi_note INTEGER NOT NULL,           -- MIDI 音符编号 (0-127)
  note_name TEXT NOT NULL,              -- 音符名称 (如 C4, D#5)
  correct_count INTEGER DEFAULT 0,       -- 正确次数
  total_count INTEGER DEFAULT 0,         -- 总答题次数
  avg_response_time_ms INTEGER,          -- 平均反应时间(毫秒)
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, midi_note)
);

-- 2. 创建音程统计表
CREATE TABLE IF NOT EXISTS interval_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  interval_semitones INTEGER NOT NULL,   -- 音程半音数 (1-12)
  interval_name TEXT NOT NULL,           -- 音程名称 (如 大二度)
  correct_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, interval_semitones)
);

-- 3. 创建每日能力快照表 (用于历史趋势)
CREATE TABLE IF NOT EXISTS daily_ability_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  pitch_score INTEGER DEFAULT 0,         -- 音高识别分数 (0-100)
  interval_score INTEGER DEFAULT 0,      -- 音程识别分数
  speed_score INTEGER DEFAULT 0,         -- 反应速度分数
  stability_score INTEGER DEFAULT 0,     -- 稳定性分数
  overall_score INTEGER DEFAULT 0,       -- 综合分数
  total_xp INTEGER DEFAULT 0,            -- 当日总XP
  lessons_completed INTEGER DEFAULT 0,   -- 当日完成课程数
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

-- 4. RLS 策略
ALTER TABLE note_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE interval_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_ability_snapshots ENABLE ROW LEVEL SECURITY;

-- note_stats 策略
DROP POLICY IF EXISTS "Users can view own note_stats" ON note_stats;
CREATE POLICY "Users can view own note_stats" ON note_stats
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own note_stats" ON note_stats;
CREATE POLICY "Users can insert own note_stats" ON note_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own note_stats" ON note_stats;
CREATE POLICY "Users can update own note_stats" ON note_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- interval_stats 策略
DROP POLICY IF EXISTS "Users can view own interval_stats" ON interval_stats;
CREATE POLICY "Users can view own interval_stats" ON interval_stats
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own interval_stats" ON interval_stats;
CREATE POLICY "Users can insert own interval_stats" ON interval_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own interval_stats" ON interval_stats;
CREATE POLICY "Users can update own interval_stats" ON interval_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- daily_ability_snapshots 策略
DROP POLICY IF EXISTS "Users can view own snapshots" ON daily_ability_snapshots;
CREATE POLICY "Users can view own snapshots" ON daily_ability_snapshots
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own snapshots" ON daily_ability_snapshots;
CREATE POLICY "Users can insert own snapshots" ON daily_ability_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own snapshots" ON daily_ability_snapshots;
CREATE POLICY "Users can update own snapshots" ON daily_ability_snapshots
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. 索引优化
CREATE INDEX IF NOT EXISTS idx_note_stats_user_id ON note_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_interval_stats_user_id ON interval_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_snapshots_user_date ON daily_ability_snapshots(user_id, snapshot_date);

-- 6. 更新触发器
DROP TRIGGER IF EXISTS update_note_stats_updated_at ON note_stats;
CREATE TRIGGER update_note_stats_updated_at
  BEFORE UPDATE ON note_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interval_stats_updated_at ON interval_stats;
CREATE TRIGGER update_interval_stats_updated_at
  BEFORE UPDATE ON interval_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 完成！此脚本添加了以下表:
-- - note_stats: 记录每个音符的正确率
-- - interval_stats: 记录每个音程的正确率
-- - daily_ability_snapshots: 记录每日能力快照
-- =====================================================
