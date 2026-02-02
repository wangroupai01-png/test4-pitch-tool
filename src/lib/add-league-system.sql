-- ==========================================
-- 联赛系统数据库架构
-- 版本: 1.0
-- 日期: 2026-01-28
-- ==========================================

-- 1. 联赛配置表
CREATE TABLE IF NOT EXISTS league_config (
  id TEXT PRIMARY KEY,                    -- 'bronze', 'silver', 'gold', 'diamond', 'master', 'legend'
  name TEXT NOT NULL,                     -- 联赛名称
  icon TEXT NOT NULL,                     -- emoji 图标
  color TEXT NOT NULL,                    -- 主题色 (Tailwind class)
  promotion_rate FLOAT DEFAULT 0.2,       -- 晋级比例 (前20%)
  demotion_rate FLOAT DEFAULT 0.2,        -- 降级比例 (后20%)
  xp_multiplier FLOAT DEFAULT 1.0,        -- XP 加成倍率
  weekly_bonus INTEGER DEFAULT 0,         -- 周结算奖励 XP
  sort_order INTEGER NOT NULL,            -- 排序顺序
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入联赛配置
INSERT INTO league_config (id, name, icon, color, promotion_rate, demotion_rate, xp_multiplier, weekly_bonus, sort_order) VALUES
  ('bronze', '青铜联赛', '🥉', 'from-amber-600 to-amber-800', 0.20, 0, 1.0, 50, 1),
  ('silver', '白银联赛', '🥈', 'from-slate-300 to-slate-500', 0.15, 0.20, 1.1, 100, 2),
  ('gold', '黄金联赛', '🥇', 'from-yellow-400 to-amber-500', 0.10, 0.20, 1.2, 200, 3),
  ('diamond', '钻石联赛', '💎', 'from-cyan-300 to-blue-500', 0.05, 0.20, 1.3, 350, 4),
  ('master', '大师联赛', '👑', 'from-purple-400 to-indigo-600', 0.03, 0.15, 1.5, 500, 5),
  ('legend', '传奇联赛', '🏆', 'from-amber-300 via-yellow-400 to-amber-500', 0, 0.10, 2.0, 1000, 6)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  promotion_rate = EXCLUDED.promotion_rate,
  demotion_rate = EXCLUDED.demotion_rate,
  xp_multiplier = EXCLUDED.xp_multiplier,
  weekly_bonus = EXCLUDED.weekly_bonus,
  sort_order = EXCLUDED.sort_order;

-- 2. 联赛赛季表
CREATE TABLE IF NOT EXISTS league_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_number INTEGER NOT NULL,           -- 赛季编号
  start_date DATE NOT NULL,                 -- 开始日期 (周一)
  end_date DATE NOT NULL,                   -- 结束日期 (周日)
  status TEXT DEFAULT 'upcoming',           -- 'upcoming', 'active', 'ended'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(season_number)
);

-- 3. 联赛分组表
CREATE TABLE IF NOT EXISTS league_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES league_seasons(id) ON DELETE CASCADE,
  league_id TEXT NOT NULL REFERENCES league_config(id),
  group_number INTEGER NOT NULL,            -- 组号
  max_members INTEGER DEFAULT 30,           -- 最大成员数
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(season_id, league_id, group_number)
);

-- 4. 用户联赛状态表
CREATE TABLE IF NOT EXISTS user_league (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_league TEXT NOT NULL REFERENCES league_config(id) DEFAULT 'bronze',
  current_season_id UUID REFERENCES league_seasons(id),
  current_group_id UUID REFERENCES league_groups(id),
  weekly_xp INTEGER DEFAULT 0,              -- 本周获得的 XP
  rank_in_group INTEGER,                    -- 组内排名
  joined_at TIMESTAMPTZ DEFAULT NOW(),      -- 加入联赛时间
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 联赛历史记录表
CREATE TABLE IF NOT EXISTS league_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES league_seasons(id) ON DELETE CASCADE,
  league_id TEXT NOT NULL REFERENCES league_config(id),
  group_id UUID REFERENCES league_groups(id),
  final_rank INTEGER,                       -- 最终排名
  final_xp INTEGER,                         -- 最终 XP
  result TEXT,                              -- 'promoted', 'stayed', 'demoted'
  bonus_xp INTEGER DEFAULT 0,               -- 获得的奖励 XP
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, season_id)
);

-- 6. 创建索引
CREATE INDEX IF NOT EXISTS idx_user_league_season ON user_league(current_season_id);
CREATE INDEX IF NOT EXISTS idx_user_league_group ON user_league(current_group_id);
CREATE INDEX IF NOT EXISTS idx_league_groups_season ON league_groups(season_id);
CREATE INDEX IF NOT EXISTS idx_league_history_user ON league_history(user_id);
CREATE INDEX IF NOT EXISTS idx_league_history_season ON league_history(season_id);

-- 7. RLS 策略
ALTER TABLE league_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_league ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_history ENABLE ROW LEVEL SECURITY;

-- 联赛配置：所有人可读
CREATE POLICY "Anyone can read league_config" ON league_config
  FOR SELECT USING (true);

-- 联赛赛季：所有人可读
CREATE POLICY "Anyone can read league_seasons" ON league_seasons
  FOR SELECT USING (true);

-- 联赛分组：所有人可读
CREATE POLICY "Anyone can read league_groups" ON league_groups
  FOR SELECT USING (true);

-- 用户联赛状态：自己可读写，其他人可读
CREATE POLICY "Users can read all user_league" ON user_league
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own user_league" ON user_league
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_league" ON user_league
  FOR UPDATE USING (auth.uid() = user_id);

-- 联赛历史：所有人可读，自己可写
CREATE POLICY "Anyone can read league_history" ON league_history
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own league_history" ON league_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. 辅助函数：获取当前活跃赛季
CREATE OR REPLACE FUNCTION get_current_season()
RETURNS UUID AS $$
DECLARE
  season_id UUID;
BEGIN
  SELECT id INTO season_id
  FROM league_seasons
  WHERE status = 'active'
  ORDER BY start_date DESC
  LIMIT 1;
  
  RETURN season_id;
END;
$$ LANGUAGE plpgsql;

-- 9. 辅助函数：加入联赛（自动分配到合适的组）
CREATE OR REPLACE FUNCTION join_league(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_season_id UUID;
  v_group_id UUID;
  v_existing_league TEXT;
BEGIN
  -- 获取当前赛季
  SELECT id INTO v_season_id FROM league_seasons WHERE status = 'active' LIMIT 1;
  
  IF v_season_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 检查用户是否已有联赛记录
  SELECT current_league INTO v_existing_league FROM user_league WHERE user_id = p_user_id;
  
  IF v_existing_league IS NULL THEN
    -- 新用户，分配到青铜联赛
    -- 查找有空位的青铜组
    SELECT lg.id INTO v_group_id
    FROM league_groups lg
    LEFT JOIN user_league ul ON ul.current_group_id = lg.id
    WHERE lg.season_id = v_season_id AND lg.league_id = 'bronze'
    GROUP BY lg.id, lg.max_members
    HAVING COUNT(ul.user_id) < lg.max_members
    ORDER BY lg.group_number
    LIMIT 1;
    
    -- 如果没有可用组，创建新组
    IF v_group_id IS NULL THEN
      INSERT INTO league_groups (season_id, league_id, group_number)
      SELECT v_season_id, 'bronze', COALESCE(MAX(group_number), 0) + 1
      FROM league_groups
      WHERE season_id = v_season_id AND league_id = 'bronze'
      RETURNING id INTO v_group_id;
    END IF;
    
    -- 创建用户联赛记录
    INSERT INTO user_league (user_id, current_league, current_season_id, current_group_id, weekly_xp)
    VALUES (p_user_id, 'bronze', v_season_id, v_group_id, 0);
  ELSE
    -- 已有用户，更新赛季和分组
    -- 查找当前联赛有空位的组
    SELECT lg.id INTO v_group_id
    FROM league_groups lg
    LEFT JOIN user_league ul ON ul.current_group_id = lg.id
    WHERE lg.season_id = v_season_id AND lg.league_id = v_existing_league
    GROUP BY lg.id, lg.max_members
    HAVING COUNT(ul.user_id) < lg.max_members
    ORDER BY lg.group_number
    LIMIT 1;
    
    -- 如果没有可用组，创建新组
    IF v_group_id IS NULL THEN
      INSERT INTO league_groups (season_id, league_id, group_number)
      SELECT v_season_id, v_existing_league, COALESCE(MAX(group_number), 0) + 1
      FROM league_groups
      WHERE season_id = v_season_id AND league_id = v_existing_league
      RETURNING id INTO v_group_id;
    END IF;
    
    -- 更新用户联赛记录
    UPDATE user_league
    SET current_season_id = v_season_id,
        current_group_id = v_group_id,
        weekly_xp = 0,
        rank_in_group = NULL,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 触发器：更新 updated_at
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

-- 11. 创建第一个赛季（当前周）
DO $$
DECLARE
  v_start DATE;
  v_end DATE;
BEGIN
  -- 计算本周一和周日
  v_start := date_trunc('week', CURRENT_DATE)::DATE;
  v_end := v_start + INTERVAL '6 days';
  
  -- 插入当前赛季
  INSERT INTO league_seasons (season_number, start_date, end_date, status)
  VALUES (1, v_start, v_end, 'active')
  ON CONFLICT (season_number) DO UPDATE SET
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    status = 'active';
END $$;
