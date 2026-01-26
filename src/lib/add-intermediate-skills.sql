-- =============================================
-- Phase 5: 进阶篇技能和课程
-- 在 Supabase SQL Editor 中运行此脚本
-- =============================================

-- 1. 添加进阶篇技能
INSERT INTO skills (id, name, description, category, icon, sort_order, xp_reward) VALUES
  ('speed_identify', '快速识音', '限时挑战，提升反应速度', 'intermediate', '⚡', 5, 150),
  ('interval_advanced', '音程进阶', '学习六度、七度等高级音程', 'intermediate', '🎵', 6, 150),
  ('pitch_advanced', '音准精修', '音分级精准控制，挑战高难度音准', 'intermediate', '🎤', 7, 150),
  ('chord_basic', '和弦入门', '认识大三和弦与小三和弦', 'intermediate', '🎹', 8, 200)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon;

-- 2. 设置前置技能（需要完成基础篇全部4个技能）
UPDATE skills SET prerequisite_skill_id = 'interval_basic' WHERE id = 'speed_identify';
UPDATE skills SET prerequisite_skill_id = 'interval_basic' WHERE id = 'interval_advanced';
UPDATE skills SET prerequisite_skill_id = 'pitch_basic' WHERE id = 'pitch_advanced';
UPDATE skills SET prerequisite_skill_id = 'interval_basic' WHERE id = 'chord_basic';

-- =============================================
-- 3. 快速识音课程 (4课) - 限时挑战模式
-- =============================================
INSERT INTO lessons (id, skill_id, name, description, lesson_order, lesson_type, xp_reward, content) VALUES
  ('speed_l1', 'speed_identify', '热身练习', '5秒内识别每个音符，共8题', 1, 'quiz', 25,
   '{"type":"quiz","timeLimit":5,"questions":[
     {"type":"identify","targetMidi":60,"options":[60,62,64,65]},
     {"type":"identify","targetMidi":64,"options":[62,64,65,67]},
     {"type":"identify","targetMidi":67,"options":[65,67,69,71]},
     {"type":"identify","targetMidi":62,"options":[60,62,64,65]},
     {"type":"identify","targetMidi":65,"options":[64,65,67,69]},
     {"type":"identify","targetMidi":69,"options":[67,69,71,72]},
     {"type":"identify","targetMidi":71,"options":[69,71,72,74]},
     {"type":"identify","targetMidi":72,"options":[69,71,72,74]}
   ],"passThreshold":0.7}'::jsonb),
   
  ('speed_l2', 'speed_identify', '提速挑战', '4秒内识别，难度提升', 2, 'quiz', 25,
   '{"type":"quiz","timeLimit":4,"questions":[
     {"type":"identify","targetMidi":60,"options":[60,61,62,63]},
     {"type":"identify","targetMidi":63,"options":[62,63,64,65]},
     {"type":"identify","targetMidi":66,"options":[65,66,67,68]},
     {"type":"identify","targetMidi":69,"options":[68,69,70,71]},
     {"type":"identify","targetMidi":72,"options":[71,72,73,74]},
     {"type":"identify","targetMidi":61,"options":[60,61,62,63]},
     {"type":"identify","targetMidi":68,"options":[67,68,69,70]},
     {"type":"identify","targetMidi":75,"options":[74,75,76,77]}
   ],"passThreshold":0.7}'::jsonb),
   
  ('speed_l3', 'speed_identify', '极速模式', '3秒限时，音域扩展', 3, 'quiz', 30,
   '{"type":"quiz","timeLimit":3,"questions":[
     {"type":"identify","targetMidi":48,"options":[48,50,52,53]},
     {"type":"identify","targetMidi":55,"options":[53,55,57,59]},
     {"type":"identify","targetMidi":60,"options":[60,62,64,65]},
     {"type":"identify","targetMidi":67,"options":[65,67,69,71]},
     {"type":"identify","targetMidi":72,"options":[72,74,76,77]},
     {"type":"identify","targetMidi":79,"options":[77,79,81,83]},
     {"type":"identify","targetMidi":84,"options":[81,83,84,86]},
     {"type":"identify","targetMidi":52,"options":[48,50,52,55]}
   ],"passThreshold":0.75}'::jsonb),
   
  ('speed_l4', 'speed_identify', '闪电反应', '2秒极限挑战，考验你的音感极限', 4, 'quiz', 40,
   '{"type":"quiz","timeLimit":2,"questions":[
     {"type":"identify","targetMidi":60,"options":[60,62,64,65,67]},
     {"type":"identify","targetMidi":64,"options":[62,64,65,67,69]},
     {"type":"identify","targetMidi":67,"options":[64,65,67,69,71]},
     {"type":"identify","targetMidi":71,"options":[67,69,71,72,74]},
     {"type":"identify","targetMidi":72,"options":[69,71,72,74,76]},
     {"type":"identify","targetMidi":76,"options":[72,74,76,77,79]},
     {"type":"identify","targetMidi":55,"options":[52,53,55,57,59]},
     {"type":"identify","targetMidi":59,"options":[55,57,59,60,62]},
     {"type":"identify","targetMidi":62,"options":[60,62,64,65,67]},
     {"type":"identify","targetMidi":65,"options":[62,64,65,67,69]}
   ],"passThreshold":0.8}'::jsonb)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  content = EXCLUDED.content;

-- =============================================
-- 4. 音程进阶课程 (5课) - 六度、七度、复杂音程
-- =============================================
INSERT INTO lessons (id, skill_id, name, description, lesson_order, lesson_type, xp_reward, content) VALUES
  ('interval_adv_l1', 'interval_advanced', '六度音程', '学习大六度与小六度的区别', 1, 'quiz', 25,
   '{"type":"quiz","questions":[
     {"type":"interval","baseMidi":60,"intervalSemitones":8,"options":["小六度","大六度"],"answer":"小六度"},
     {"type":"interval","baseMidi":60,"intervalSemitones":9,"options":["小六度","大六度"],"answer":"大六度"},
     {"type":"interval","baseMidi":64,"intervalSemitones":8,"options":["小六度","大六度"],"answer":"小六度"},
     {"type":"interval","baseMidi":65,"intervalSemitones":9,"options":["小六度","大六度"],"answer":"大六度"},
     {"type":"interval","baseMidi":67,"intervalSemitones":8,"options":["小六度","大六度"],"answer":"小六度"},
     {"type":"interval","baseMidi":69,"intervalSemitones":9,"options":["小六度","大六度"],"answer":"大六度"}
   ],"passThreshold":0.7}'::jsonb),
   
  ('interval_adv_l2', 'interval_advanced', '七度音程', '学习大七度与小七度，感受紧张感', 2, 'quiz', 25,
   '{"type":"quiz","questions":[
     {"type":"interval","baseMidi":60,"intervalSemitones":10,"options":["小七度","大七度"],"answer":"小七度"},
     {"type":"interval","baseMidi":60,"intervalSemitones":11,"options":["小七度","大七度"],"answer":"大七度"},
     {"type":"interval","baseMidi":62,"intervalSemitones":10,"options":["小七度","大七度"],"answer":"小七度"},
     {"type":"interval","baseMidi":64,"intervalSemitones":11,"options":["小七度","大七度"],"answer":"大七度"},
     {"type":"interval","baseMidi":65,"intervalSemitones":10,"options":["小七度","大七度"],"answer":"小七度"},
     {"type":"interval","baseMidi":67,"intervalSemitones":11,"options":["小七度","大七度"],"answer":"大七度"}
   ],"passThreshold":0.7}'::jsonb),
   
  ('interval_adv_l3', 'interval_advanced', '三全音', '学习最不和谐的音程——增四度/减五度', 3, 'quiz', 25,
   '{"type":"quiz","questions":[
     {"type":"interval","baseMidi":60,"intervalSemitones":6,"options":["纯四度","三全音","纯五度"],"answer":"三全音"},
     {"type":"interval","baseMidi":62,"intervalSemitones":5,"options":["纯四度","三全音","纯五度"],"answer":"纯四度"},
     {"type":"interval","baseMidi":64,"intervalSemitones":6,"options":["纯四度","三全音","纯五度"],"answer":"三全音"},
     {"type":"interval","baseMidi":65,"intervalSemitones":7,"options":["纯四度","三全音","纯五度"],"answer":"纯五度"},
     {"type":"interval","baseMidi":67,"intervalSemitones":6,"options":["纯四度","三全音","纯五度"],"answer":"三全音"},
     {"type":"interval","baseMidi":69,"intervalSemitones":5,"options":["纯四度","三全音","纯五度"],"answer":"纯四度"}
   ],"passThreshold":0.7}'::jsonb),
   
  ('interval_adv_l4', 'interval_advanced', '混合辨别', '所有音程混合练习', 4, 'quiz', 30,
   '{"type":"quiz","questions":[
     {"type":"interval","baseMidi":60,"intervalSemitones":3,"options":["小三度","大三度","纯四度","纯五度"],"answer":"小三度"},
     {"type":"interval","baseMidi":60,"intervalSemitones":8,"options":["纯五度","小六度","大六度","小七度"],"answer":"小六度"},
     {"type":"interval","baseMidi":62,"intervalSemitones":10,"options":["大六度","小七度","大七度","纯八度"],"answer":"小七度"},
     {"type":"interval","baseMidi":64,"intervalSemitones":6,"options":["纯四度","三全音","纯五度","小六度"],"answer":"三全音"},
     {"type":"interval","baseMidi":65,"intervalSemitones":9,"options":["纯五度","小六度","大六度","小七度"],"answer":"大六度"},
     {"type":"interval","baseMidi":67,"intervalSemitones":11,"options":["小七度","大七度","纯八度"],"answer":"大七度"},
     {"type":"interval","baseMidi":60,"intervalSemitones":12,"options":["大七度","纯八度"],"answer":"纯八度"},
     {"type":"interval","baseMidi":69,"intervalSemitones":4,"options":["小三度","大三度","纯四度"],"answer":"大三度"}
   ],"passThreshold":0.75}'::jsonb),
   
  ('interval_adv_l5', 'interval_advanced', '音程大师测试', '全部12种音程综合测验', 5, 'quiz', 40,
   '{"type":"quiz","questions":[
     {"type":"interval","baseMidi":60,"intervalSemitones":1,"options":["小二度","大二度","小三度"],"answer":"小二度"},
     {"type":"interval","baseMidi":60,"intervalSemitones":2,"options":["小二度","大二度","小三度"],"answer":"大二度"},
     {"type":"interval","baseMidi":60,"intervalSemitones":3,"options":["大二度","小三度","大三度"],"answer":"小三度"},
     {"type":"interval","baseMidi":60,"intervalSemitones":4,"options":["小三度","大三度","纯四度"],"answer":"大三度"},
     {"type":"interval","baseMidi":60,"intervalSemitones":5,"options":["大三度","纯四度","三全音"],"answer":"纯四度"},
     {"type":"interval","baseMidi":60,"intervalSemitones":6,"options":["纯四度","三全音","纯五度"],"answer":"三全音"},
     {"type":"interval","baseMidi":60,"intervalSemitones":7,"options":["三全音","纯五度","小六度"],"answer":"纯五度"},
     {"type":"interval","baseMidi":60,"intervalSemitones":8,"options":["纯五度","小六度","大六度"],"answer":"小六度"},
     {"type":"interval","baseMidi":60,"intervalSemitones":9,"options":["小六度","大六度","小七度"],"answer":"大六度"},
     {"type":"interval","baseMidi":60,"intervalSemitones":10,"options":["大六度","小七度","大七度"],"answer":"小七度"},
     {"type":"interval","baseMidi":60,"intervalSemitones":11,"options":["小七度","大七度","纯八度"],"answer":"大七度"},
     {"type":"interval","baseMidi":60,"intervalSemitones":12,"options":["大七度","纯八度"],"answer":"纯八度"}
   ],"passThreshold":0.8}'::jsonb)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  content = EXCLUDED.content;

-- =============================================
-- 5. 音准精修课程 (4课) - 高难度哼唱
-- =============================================
INSERT INTO lessons (id, skill_id, name, description, lesson_order, lesson_type, xp_reward, content) VALUES
  ('pitch_adv_l1', 'pitch_advanced', '扩展音域', '挑战更低和更高的音符', 1, 'sing', 25,
   '{"type":"sing","questions":[
     {"type":"sing","targetMidi":55},
     {"type":"sing","targetMidi":57},
     {"type":"sing","targetMidi":72},
     {"type":"sing","targetMidi":74},
     {"type":"sing","targetMidi":53}
   ],"passThreshold":0.7,"tolerance":80}'::jsonb),
   
  ('pitch_adv_l2', 'pitch_advanced', '音程跳跃', '连续哼唱不同音高，训练音程感', 2, 'sing', 25,
   '{"type":"sing","questions":[
     {"type":"sing","targetMidi":60},
     {"type":"sing","targetMidi":67},
     {"type":"sing","targetMidi":60},
     {"type":"sing","targetMidi":72},
     {"type":"sing","targetMidi":64}
   ],"passThreshold":0.7,"tolerance":60}'::jsonb),
   
  ('pitch_adv_l3', 'pitch_advanced', '精准控制', '误差容限更小，考验精准度', 3, 'sing', 30,
   '{"type":"sing","questions":[
     {"type":"sing","targetMidi":60},
     {"type":"sing","targetMidi":62},
     {"type":"sing","targetMidi":64},
     {"type":"sing","targetMidi":65},
     {"type":"sing","targetMidi":67}
   ],"passThreshold":0.8,"tolerance":40}'::jsonb),
   
  ('pitch_adv_l4', 'pitch_advanced', '音准大师', '极限精准度挑战', 4, 'sing', 40,
   '{"type":"sing","questions":[
     {"type":"sing","targetMidi":60},
     {"type":"sing","targetMidi":63},
     {"type":"sing","targetMidi":66},
     {"type":"sing","targetMidi":69},
     {"type":"sing","targetMidi":72},
     {"type":"sing","targetMidi":64}
   ],"passThreshold":0.8,"tolerance":30}'::jsonb)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  content = EXCLUDED.content;

-- =============================================
-- 6. 和弦入门课程 (5课) - 大三和弦、小三和弦
-- =============================================
INSERT INTO lessons (id, skill_id, name, description, lesson_order, lesson_type, xp_reward, content) VALUES
  ('chord_l1', 'chord_basic', '认识和弦', '学习什么是和弦，听辨大三和弦的明亮感', 1, 'quiz', 25,
   '{"type":"quiz","questions":[
     {"type":"chord","rootMidi":60,"chordType":"major","options":["大三和弦","小三和弦"],"answer":"大三和弦"},
     {"type":"chord","rootMidi":64,"chordType":"major","options":["大三和弦","小三和弦"],"answer":"大三和弦"},
     {"type":"chord","rootMidi":65,"chordType":"major","options":["大三和弦","小三和弦"],"answer":"大三和弦"},
     {"type":"chord","rootMidi":67,"chordType":"major","options":["大三和弦","小三和弦"],"answer":"大三和弦"}
   ],"passThreshold":0.7}'::jsonb),
   
  ('chord_l2', 'chord_basic', '小三和弦', '感受小三和弦的忧郁色彩', 2, 'quiz', 25,
   '{"type":"quiz","questions":[
     {"type":"chord","rootMidi":60,"chordType":"minor","options":["大三和弦","小三和弦"],"answer":"小三和弦"},
     {"type":"chord","rootMidi":62,"chordType":"minor","options":["大三和弦","小三和弦"],"answer":"小三和弦"},
     {"type":"chord","rootMidi":64,"chordType":"minor","options":["大三和弦","小三和弦"],"answer":"小三和弦"},
     {"type":"chord","rootMidi":69,"chordType":"minor","options":["大三和弦","小三和弦"],"answer":"小三和弦"}
   ],"passThreshold":0.7}'::jsonb),
   
  ('chord_l3', 'chord_basic', '大小对比', '区分大三和弦与小三和弦', 3, 'quiz', 25,
   '{"type":"quiz","questions":[
     {"type":"chord","rootMidi":60,"chordType":"major","options":["大三和弦","小三和弦"],"answer":"大三和弦"},
     {"type":"chord","rootMidi":60,"chordType":"minor","options":["大三和弦","小三和弦"],"answer":"小三和弦"},
     {"type":"chord","rootMidi":65,"chordType":"major","options":["大三和弦","小三和弦"],"answer":"大三和弦"},
     {"type":"chord","rootMidi":65,"chordType":"minor","options":["大三和弦","小三和弦"],"answer":"小三和弦"},
     {"type":"chord","rootMidi":67,"chordType":"minor","options":["大三和弦","小三和弦"],"answer":"小三和弦"},
     {"type":"chord","rootMidi":69,"chordType":"major","options":["大三和弦","小三和弦"],"answer":"大三和弦"}
   ],"passThreshold":0.7}'::jsonb),
   
  ('chord_l4', 'chord_basic', '和弦根音', '识别不同根音上的和弦', 4, 'quiz', 30,
   '{"type":"quiz","questions":[
     {"type":"chord","rootMidi":60,"chordType":"major","options":["C大三","D大三","E大三","F大三"],"answer":"C大三"},
     {"type":"chord","rootMidi":62,"chordType":"major","options":["C大三","D大三","E大三","F大三"],"answer":"D大三"},
     {"type":"chord","rootMidi":64,"chordType":"minor","options":["C小三","D小三","E小三","F小三"],"answer":"E小三"},
     {"type":"chord","rootMidi":65,"chordType":"major","options":["C大三","D大三","E大三","F大三"],"answer":"F大三"},
     {"type":"chord","rootMidi":67,"chordType":"minor","options":["E小三","F小三","G小三","A小三"],"answer":"G小三"},
     {"type":"chord","rootMidi":69,"chordType":"minor","options":["E小三","F小三","G小三","A小三"],"answer":"A小三"}
   ],"passThreshold":0.7}'::jsonb),
   
  ('chord_l5', 'chord_basic', '和弦综合测验', '大小三和弦综合测试', 5, 'quiz', 40,
   '{"type":"quiz","questions":[
     {"type":"chord","rootMidi":60,"chordType":"major","options":["大三和弦","小三和弦"],"answer":"大三和弦"},
     {"type":"chord","rootMidi":62,"chordType":"minor","options":["大三和弦","小三和弦"],"answer":"小三和弦"},
     {"type":"chord","rootMidi":64,"chordType":"major","options":["大三和弦","小三和弦"],"answer":"大三和弦"},
     {"type":"chord","rootMidi":65,"chordType":"minor","options":["大三和弦","小三和弦"],"answer":"小三和弦"},
     {"type":"chord","rootMidi":67,"chordType":"major","options":["大三和弦","小三和弦"],"answer":"大三和弦"},
     {"type":"chord","rootMidi":69,"chordType":"minor","options":["大三和弦","小三和弦"],"answer":"小三和弦"},
     {"type":"chord","rootMidi":71,"chordType":"minor","options":["大三和弦","小三和弦"],"answer":"小三和弦"},
     {"type":"chord","rootMidi":72,"chordType":"major","options":["大三和弦","小三和弦"],"answer":"大三和弦"}
   ],"passThreshold":0.8}'::jsonb)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  content = EXCLUDED.content;

-- =============================================
-- 验证结果
-- =============================================
SELECT s.name as skill_name, COUNT(l.id) as lesson_count 
FROM skills s 
LEFT JOIN lessons l ON s.id = l.skill_id 
WHERE s.category = 'intermediate'
GROUP BY s.id, s.name, s.sort_order
ORDER BY s.sort_order;
