-- ==========================================
-- 联赛系统数据库架构 v2.0
-- 版本: 2.0 (个人晋级制)
-- 日期: 2026-01-28
-- 说明: 简化版联赛系统，基于累计XP自动晋级
-- ==========================================

-- 1. 联赛配置表
CREATE TABLE IF NOT EXISTS league_config (
  id TEXT PRIMARY KEY,                    -- 'bronze', 'silver', 'gold', 'diamond', 'master', 'legend'
  name TEXT NOT NULL,                     -- 联赛名称
  icon TEXT NOT NULL,                     -- emoji 图标
  color TEXT NOT NULL,                    -- 主题色 (Tailwind class)
  required_xp INTEGER DEFAULT 0,          -- 晋级所需累计XP
  xp_multiplier FLOAT DEFAULT 1.0,        -- XP 加成倍率
  sort_order INTEGER NOT NULL,            -- 排序顺序
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入联赛配置 (个人晋级制)
INSERT INTO league_config (id, name, icon, color, required_xp, xp_multiplier, sort_order) VALUES
  ('bronze', '青铜', '🥉', 'from-amber-600 to-amber-800', 0, 1.0, 1),
  ('silver', '白银', '🥈', 'from-slate-300 to-slate-500', 500, 1.1, 2),
  ('gold', '黄金', '🥇', 'from-yellow-400 to-amber-500', 2000, 1.2, 3),
  ('diamond', '钻石', '💎', 'from-cyan-300 to-blue-500', 5000, 1.3, 4),
  ('master', '大师', '👑', 'from-purple-400 to-indigo-600', 15000, 1.5, 5),
  ('legend', '传奇', '🏆', 'from-amber-300 via-yellow-400 to-amber-500', 50000, 2.0, 6)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  required_xp = EXCLUDED.required_xp,
  xp_multiplier = EXCLUDED.xp_multiplier,
  sort_order = EXCLUDED.sort_order;

-- 2. 用户联赛状态表 (简化版)
CREATE TABLE IF NOT EXISTS user_league (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_league TEXT NOT NULL REFERENCES league_config(id) DEFAULT 'bronze',
  total_xp INTEGER DEFAULT 0,             -- 累计获得的 XP
  joined_at TIMESTAMPTZ DEFAULT NOW(),    -- 加入联赛时间
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 联赛晋级历史
CREATE TABLE IF NOT EXISTS league_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_league TEXT NOT NULL REFERENCES league_config(id),
  to_league TEXT NOT NULL REFERENCES league_config(id),
  xp_at_promotion INTEGER NOT NULL,       -- 晋级时的累计XP
  promoted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_user_league_total_xp ON user_league(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_league_league ON user_league(current_league);
CREATE INDEX IF NOT EXISTS idx_league_promotions_user ON league_promotions(user_id);

-- 5. RLS 策略
ALTER TABLE league_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_league ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_promotions ENABLE ROW LEVEL SECURITY;

-- 联赛配置：所有人可读
DROP POLICY IF EXISTS "Anyone can read league_config" ON league_config;
CREATE POLICY "Anyone can read league_config" ON league_config
  FOR SELECT USING (true);

-- 用户联赛状态：所有人可读，自己可写
DROP POLICY IF EXISTS "Users can read all user_league" ON user_league;
CREATE POLICY "Users can read all user_league" ON user_league
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own user_league" ON user_league;
CREATE POLICY "Users can insert own user_league" ON user_league
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own user_league" ON user_league;
CREATE POLICY "Users can update own user_league" ON user_league
  FOR UPDATE USING (auth.uid() = user_id);

-- 晋级历史：所有人可读
DROP POLICY IF EXISTS "Anyone can read league_promotions" ON league_promotions;
CREATE POLICY "Anyone can read league_promotions" ON league_promotions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own league_promotions" ON league_promotions;
CREATE POLICY "Users can insert own league_promotions" ON league_promotions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. 触发器：更新 updated_at
CREATE OR REPLACE FUNCTION update_user_league_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_league_updated_at ON user_league;
CREATE TRIGGER user_league_updated_at
  BEFORE UPDATE ON user_league
  FOR EACH ROW
  EXECUTE FUNCTION update_user_league_timestamp();

-- 7. 函数：根据累计XP计算应该在哪个联赛
CREATE OR REPLACE FUNCTION calculate_league_for_xp(p_total_xp INTEGER)
RETURNS TEXT AS $$
DECLARE
  v_league TEXT := 'bronze';
BEGIN
  SELECT id INTO v_league
  FROM league_config
  WHERE required_xp <= p_total_xp
  ORDER BY required_xp DESC
  LIMIT 1;
  
  RETURN COALESCE(v_league, 'bronze');
END;
$$ LANGUAGE plpgsql;

-- 8. 函数：初始化用户联赛（基于现有XP）
CREATE OR REPLACE FUNCTION init_user_league(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_total_xp INTEGER;
  v_league TEXT;
BEGIN
  -- 从 profiles 表获取用户的 total_xp
  SELECT COALESCE(total_xp, 0) INTO v_total_xp
  FROM profiles
  WHERE id = p_user_id;
  
  -- 计算应该在哪个联赛
  v_league := calculate_league_for_xp(v_total_xp);
  
  -- 创建或更新用户联赛记录
  INSERT INTO user_league (user_id, current_league, total_xp)
  VALUES (p_user_id, v_league, v_total_xp)
  ON CONFLICT (user_id) DO UPDATE SET
    current_league = v_league,
    total_xp = v_total_xp,
    updated_at = NOW();
  
  RETURN v_league;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
