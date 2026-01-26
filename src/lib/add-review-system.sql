-- =============================================
-- 智能复习系统数据库表
-- 在 Supabase SQL Editor 中运行此脚本
-- =============================================

-- 1. 用户复习计划表
CREATE TABLE IF NOT EXISTS user_review_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT REFERENCES lessons(id) ON DELETE CASCADE,
  
  -- SM-2 算法参数
  ease_factor FLOAT DEFAULT 2.5,           -- 难度因子 (1.3 - 2.5)
  interval_days INTEGER DEFAULT 1,          -- 当前复习间隔(天)
  repetitions INTEGER DEFAULT 0,            -- 成功复习次数
  
  -- 复习日期
  next_review_date DATE NOT NULL,           -- 下次复习日期
  last_review_date DATE,                    -- 上次复习日期
  last_quality INTEGER,                     -- 上次复习评分 (0-5)
  
  -- 统计
  total_reviews INTEGER DEFAULT 0,          -- 总复习次数
  correct_count INTEGER DEFAULT 0,          -- 正确次数
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, lesson_id)
);

-- 2. 用户答题记录表（用于薄弱点分析）
CREATE TABLE IF NOT EXISTS user_question_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 题目类型和内容
  question_type TEXT NOT NULL,              -- 'note', 'interval', 'chord'
  target_value TEXT NOT NULL,               -- 目标值（如 MIDI 60, 或音程名称）
  
  -- 统计数据
  attempts INTEGER DEFAULT 0,               -- 尝试次数
  correct INTEGER DEFAULT 0,                -- 正确次数
  avg_response_time FLOAT,                  -- 平均响应时间(毫秒)
  last_attempt_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, question_type, target_value)
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_review_schedule_user_date 
  ON user_review_schedule(user_id, next_review_date);

CREATE INDEX IF NOT EXISTS idx_question_stats_user_type 
  ON user_question_stats(user_id, question_type);

-- 4. RLS 策略
ALTER TABLE user_review_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_stats ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果有）
DROP POLICY IF EXISTS "Users can manage own review schedule" ON user_review_schedule;
DROP POLICY IF EXISTS "Users can manage own question stats" ON user_question_stats;

-- 用户只能访问自己的数据
CREATE POLICY "Users can manage own review schedule" ON user_review_schedule
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own question stats" ON user_question_stats
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 完成！
-- =============================================
