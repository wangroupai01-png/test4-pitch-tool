-- =============================================
-- 添加音程基础课程
-- 在 Supabase SQL Editor 中运行此脚本
-- =============================================

-- 音程基础的5节课程
INSERT INTO lessons (id, skill_id, name, description, lesson_order, lesson_type, xp_reward, content) VALUES
  -- 第1课：认识音程 - 识别纯一度和纯八度
  ('interval_basic_l1', 'interval_basic', '认识音程', '学习什么是音程，从最简单的纯一度和纯八度开始', 1, 'quiz', 20,
   '{"type":"quiz","questions":[
     {"type":"interval","baseMidi":60,"intervalSemitones":0,"options":["纯一度","纯八度"],"answer":"纯一度"},
     {"type":"interval","baseMidi":64,"intervalSemitones":12,"options":["纯一度","纯八度"],"answer":"纯八度"},
     {"type":"interval","baseMidi":67,"intervalSemitones":0,"options":["纯一度","纯八度"],"answer":"纯一度"},
     {"type":"interval","baseMidi":62,"intervalSemitones":12,"options":["纯一度","纯八度"],"answer":"纯八度"}
   ],"passThreshold":0.7}'::jsonb),
  
  -- 第2课：大二度与小二度
  ('interval_basic_l2', 'interval_basic', '大二度与小二度', '学习区分相邻两个音的距离', 2, 'quiz', 20,
   '{"type":"quiz","questions":[
     {"type":"interval","baseMidi":60,"intervalSemitones":1,"options":["小二度","大二度"],"answer":"小二度"},
     {"type":"interval","baseMidi":60,"intervalSemitones":2,"options":["小二度","大二度"],"answer":"大二度"},
     {"type":"interval","baseMidi":64,"intervalSemitones":1,"options":["小二度","大二度"],"answer":"小二度"},
     {"type":"interval","baseMidi":65,"intervalSemitones":2,"options":["小二度","大二度"],"answer":"大二度"},
     {"type":"interval","baseMidi":67,"intervalSemitones":1,"options":["小二度","大二度"],"answer":"小二度"},
     {"type":"interval","baseMidi":69,"intervalSemitones":2,"options":["小二度","大二度"],"answer":"大二度"}
   ],"passThreshold":0.7}'::jsonb),
  
  -- 第3课：大三度与小三度
  ('interval_basic_l3', 'interval_basic', '大三度与小三度', '学习识别三度音程，感受大调与小调的色彩差异', 3, 'quiz', 20,
   '{"type":"quiz","questions":[
     {"type":"interval","baseMidi":60,"intervalSemitones":3,"options":["小三度","大三度"],"answer":"小三度"},
     {"type":"interval","baseMidi":60,"intervalSemitones":4,"options":["小三度","大三度"],"answer":"大三度"},
     {"type":"interval","baseMidi":64,"intervalSemitones":3,"options":["小三度","大三度"],"answer":"小三度"},
     {"type":"interval","baseMidi":65,"intervalSemitones":4,"options":["小三度","大三度"],"answer":"大三度"},
     {"type":"interval","baseMidi":67,"intervalSemitones":3,"options":["小三度","大三度"],"answer":"小三度"},
     {"type":"interval","baseMidi":69,"intervalSemitones":4,"options":["小三度","大三度"],"answer":"大三度"}
   ],"passThreshold":0.7}'::jsonb),
  
  -- 第4课：纯四度与纯五度
  ('interval_basic_l4', 'interval_basic', '纯四度与纯五度', '学习识别纯四度和纯五度，这是音乐中最和谐的音程', 4, 'quiz', 20,
   '{"type":"quiz","questions":[
     {"type":"interval","baseMidi":60,"intervalSemitones":5,"options":["纯四度","纯五度"],"answer":"纯四度"},
     {"type":"interval","baseMidi":60,"intervalSemitones":7,"options":["纯四度","纯五度"],"answer":"纯五度"},
     {"type":"interval","baseMidi":64,"intervalSemitones":5,"options":["纯四度","纯五度"],"answer":"纯四度"},
     {"type":"interval","baseMidi":65,"intervalSemitones":7,"options":["纯四度","纯五度"],"answer":"纯五度"},
     {"type":"interval","baseMidi":67,"intervalSemitones":5,"options":["纯四度","纯五度"],"answer":"纯四度"},
     {"type":"interval","baseMidi":69,"intervalSemitones":7,"options":["纯四度","纯五度"],"answer":"纯五度"}
   ],"passThreshold":0.7}'::jsonb),
  
  -- 第5课：综合测验
  ('interval_basic_l5', 'interval_basic', '综合测验', '测试你对所有基础音程的掌握', 5, 'quiz', 30,
   '{"type":"quiz","questions":[
     {"type":"interval","baseMidi":60,"intervalSemitones":2,"options":["小二度","大二度","小三度","大三度"],"answer":"大二度"},
     {"type":"interval","baseMidi":62,"intervalSemitones":3,"options":["小二度","大二度","小三度","大三度"],"answer":"小三度"},
     {"type":"interval","baseMidi":64,"intervalSemitones":4,"options":["小三度","大三度","纯四度","纯五度"],"answer":"大三度"},
     {"type":"interval","baseMidi":65,"intervalSemitones":5,"options":["小三度","大三度","纯四度","纯五度"],"answer":"纯四度"},
     {"type":"interval","baseMidi":67,"intervalSemitones":7,"options":["纯四度","纯五度","纯八度"],"answer":"纯五度"},
     {"type":"interval","baseMidi":60,"intervalSemitones":12,"options":["纯四度","纯五度","纯八度"],"answer":"纯八度"},
     {"type":"interval","baseMidi":64,"intervalSemitones":1,"options":["小二度","大二度","小三度"],"answer":"小二度"},
     {"type":"interval","baseMidi":69,"intervalSemitones":4,"options":["小三度","大三度","纯四度"],"answer":"大三度"}
   ],"passThreshold":0.8}'::jsonb)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  content = EXCLUDED.content;

-- 验证插入结果
SELECT id, name, lesson_order FROM lessons WHERE skill_id = 'interval_basic' ORDER BY lesson_order;
