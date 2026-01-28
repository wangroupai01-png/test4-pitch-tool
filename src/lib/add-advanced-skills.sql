-- =============================================
-- Melody Challenger - 专业篇课程
-- =============================================
-- 请在 Supabase Dashboard -> SQL Editor 中运行此脚本
-- 需要先运行基础 schema 和进阶课程

-- =============================================
-- 1. 专业篇技能定义
-- =============================================

-- 1.1 复杂音程
INSERT INTO skills (id, name, description, category, icon, sort_order, prerequisite_skill_id, xp_reward)
VALUES (
  'complex_intervals',
  '复杂音程',
  '掌握增减音程、复合音程的识别与演唱',
  'advanced',
  '🎼',
  40,
  'interval_advanced',  -- 依赖进阶音程
  200
) ON CONFLICT (id) DO NOTHING;

-- 1.2 七和弦
INSERT INTO skills (id, name, description, category, icon, sort_order, prerequisite_skill_id, xp_reward)
VALUES (
  'seventh_chords',
  '七和弦',
  '识别和分辨大七、小七、属七、减七等七和弦',
  'advanced',
  '🎹',
  41,
  'chord_basics',  -- 依赖和弦入门
  200
) ON CONFLICT (id) DO NOTHING;

-- 1.3 旋律听写
INSERT INTO skills (id, name, description, category, icon, sort_order, prerequisite_skill_id, xp_reward)
VALUES (
  'melody_dictation',
  '旋律听写',
  '听记短旋律，训练音乐记忆与记谱能力',
  'advanced',
  '📝',
  42,
  'complex_intervals',
  250
) ON CONFLICT (id) DO NOTHING;

-- 1.4 专业视唱
INSERT INTO skills (id, name, description, category, icon, sort_order, prerequisite_skill_id, xp_reward)
VALUES (
  'professional_sightsing',
  '专业视唱',
  '视唱复杂旋律，包含变化音和大跳音程',
  'advanced',
  '🎤',
  43,
  'pitch_advanced',  -- 依赖音准精修
  250
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 2. 复杂音程课程
-- =============================================

-- 第1课：增减音程
INSERT INTO lessons (id, skill_id, name, description, lesson_order, lesson_type, content, xp_reward)
VALUES (
  'complex_intervals_1',
  'complex_intervals',
  '增减音程',
  '认识增二度、减五度等变化音程',
  1,
  'quiz',
  '{
    "type": "quiz",
    "questions": [
      {"type": "interval_identify", "rootMidi": 60, "interval": 3, "intervalName": "增二度", "options": ["大二度", "增二度", "小三度", "减三度"]},
      {"type": "interval_identify", "rootMidi": 62, "interval": 6, "intervalName": "减五度", "options": ["纯四度", "增四度", "减五度", "纯五度"]},
      {"type": "interval_identify", "rootMidi": 64, "interval": 8, "intervalName": "增五度", "options": ["纯五度", "增五度", "小六度", "大六度"]},
      {"type": "interval_identify", "rootMidi": 60, "interval": 1, "intervalName": "减二度", "options": ["同度", "减二度", "小二度", "大二度"]},
      {"type": "interval_identify", "rootMidi": 65, "interval": 6, "intervalName": "增四度", "options": ["纯四度", "增四度", "减五度", "纯五度"]},
      {"type": "interval_identify", "rootMidi": 60, "interval": 11, "intervalName": "增七度", "options": ["小七度", "大七度", "增七度", "纯八度"]},
      {"type": "interval_identify", "rootMidi": 62, "interval": 2, "intervalName": "减三度", "options": ["大二度", "增二度", "减三度", "小三度"]},
      {"type": "interval_identify", "rootMidi": 60, "interval": 9, "intervalName": "增六度", "options": ["大六度", "增六度", "小七度", "大七度"]}
    ],
    "passThreshold": 0.75,
    "theory": {
      "title": "增减音程",
      "content": "增音程比大音程或纯音程多半音，减音程比小音程或纯音程少半音。增四度和减五度都是6个半音，称为三全音。"
    }
  }',
  30
) ON CONFLICT (id) DO NOTHING;

-- 第2课：复合音程
INSERT INTO lessons (id, skill_id, name, description, lesson_order, lesson_type, content, xp_reward)
VALUES (
  'complex_intervals_2',
  'complex_intervals',
  '复合音程',
  '超过八度的音程识别',
  2,
  'quiz',
  '{
    "type": "quiz",
    "questions": [
      {"type": "interval_identify", "rootMidi": 48, "interval": 14, "intervalName": "大九度", "options": ["大二度", "大九度", "小九度", "纯八度"]},
      {"type": "interval_identify", "rootMidi": 48, "interval": 16, "intervalName": "大十度", "options": ["大三度", "大十度", "小十度", "纯八度"]},
      {"type": "interval_identify", "rootMidi": 48, "interval": 17, "intervalName": "纯十一度", "options": ["纯四度", "增四度", "纯十一度", "增十一度"]},
      {"type": "interval_identify", "rootMidi": 48, "interval": 13, "intervalName": "小九度", "options": ["小二度", "小九度", "大九度", "纯八度"]},
      {"type": "interval_identify", "rootMidi": 48, "interval": 21, "intervalName": "大十三度", "options": ["大六度", "大十三度", "小十三度", "纯十二度"]},
      {"type": "interval_identify", "rootMidi": 48, "interval": 19, "intervalName": "纯十二度", "options": ["纯五度", "纯十二度", "增十一度", "大十三度"]}
    ],
    "passThreshold": 0.75,
    "theory": {
      "title": "复合音程",
      "content": "超过八度的音程称为复合音程。九度=二度+八度，十度=三度+八度，以此类推。复合音程保留了单音程的性质特征。"
    }
  }',
  30
) ON CONFLICT (id) DO NOTHING;

-- 第3课：复杂音程综合
INSERT INTO lessons (id, skill_id, name, description, lesson_order, lesson_type, content, xp_reward)
VALUES (
  'complex_intervals_3',
  'complex_intervals',
  '综合测验',
  '增减音程与复合音程混合练习',
  3,
  'quiz',
  '{
    "type": "quiz",
    "questions": [
      {"type": "interval_identify", "rootMidi": 60, "interval": 6, "intervalName": "增四度", "options": ["纯四度", "增四度", "减五度", "纯五度"]},
      {"type": "interval_identify", "rootMidi": 48, "interval": 14, "intervalName": "大九度", "options": ["大二度", "大九度", "小九度", "纯十度"]},
      {"type": "interval_identify", "rootMidi": 62, "interval": 8, "intervalName": "增五度", "options": ["纯五度", "增五度", "小六度", "大六度"]},
      {"type": "interval_identify", "rootMidi": 48, "interval": 17, "intervalName": "纯十一度", "options": ["纯四度", "纯十一度", "增十一度", "纯十二度"]},
      {"type": "interval_identify", "rootMidi": 60, "interval": 1, "intervalName": "小二度", "options": ["同度", "小二度", "大二度", "增二度"]},
      {"type": "interval_identify", "rootMidi": 48, "interval": 21, "intervalName": "大十三度", "options": ["大六度", "大十三度", "小十三度", "纯十二度"]},
      {"type": "interval_identify", "rootMidi": 65, "interval": 6, "intervalName": "减五度", "options": ["纯四度", "增四度", "减五度", "纯五度"]},
      {"type": "interval_identify", "rootMidi": 60, "interval": 11, "intervalName": "大七度", "options": ["小七度", "大七度", "增七度", "纯八度"]},
      {"type": "interval_identify", "rootMidi": 48, "interval": 15, "intervalName": "小十度", "options": ["小三度", "小十度", "大十度", "纯十一度"]},
      {"type": "interval_identify", "rootMidi": 60, "interval": 9, "intervalName": "大六度", "options": ["小六度", "大六度", "增六度", "小七度"]}
    ],
    "passThreshold": 0.8
  }',
  40
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 3. 七和弦课程
-- =============================================

-- 第1课：大七和弦
INSERT INTO lessons (id, skill_id, name, description, lesson_order, lesson_type, content, xp_reward)
VALUES (
  'seventh_chords_1',
  'seventh_chords',
  '大七和弦',
  '学习大七和弦的构成与音响特征',
  1,
  'quiz',
  '{
    "type": "quiz",
    "questions": [
      {"type": "chord_identify", "rootMidi": 60, "chordType": "maj7", "options": ["大三和弦", "大七和弦", "属七和弦", "小七和弦"]},
      {"type": "chord_identify", "rootMidi": 65, "chordType": "maj7", "options": ["大三和弦", "大七和弦", "属七和弦", "小七和弦"]},
      {"type": "chord_identify", "rootMidi": 67, "chordType": "maj7", "options": ["小三和弦", "大七和弦", "小七和弦", "减七和弦"]},
      {"type": "chord_identify", "rootMidi": 62, "chordType": "maj7", "options": ["增三和弦", "大七和弦", "属七和弦", "半减七和弦"]},
      {"type": "chord_identify", "rootMidi": 64, "chordType": "maj7", "options": ["大三和弦", "大七和弦", "小七和弦", "属七和弦"]},
      {"type": "chord_identify", "rootMidi": 69, "chordType": "maj7", "options": ["小三和弦", "大七和弦", "减三和弦", "减七和弦"]}
    ],
    "passThreshold": 0.75,
    "theory": {
      "title": "大七和弦",
      "content": "大七和弦 = 大三和弦 + 大七度。由根音、大三度、纯五度、大七度组成。音响明亮而带有些许紧张感，常用于爵士和流行音乐。"
    }
  }',
  30
) ON CONFLICT (id) DO NOTHING;

-- 第2课：小七和弦
INSERT INTO lessons (id, skill_id, name, description, lesson_order, lesson_type, content, xp_reward)
VALUES (
  'seventh_chords_2',
  'seventh_chords',
  '小七和弦',
  '学习小七和弦的构成与音响特征',
  2,
  'quiz',
  '{
    "type": "quiz",
    "questions": [
      {"type": "chord_identify", "rootMidi": 60, "chordType": "min7", "options": ["小三和弦", "小七和弦", "大七和弦", "属七和弦"]},
      {"type": "chord_identify", "rootMidi": 62, "chordType": "min7", "options": ["大三和弦", "小七和弦", "大七和弦", "减七和弦"]},
      {"type": "chord_identify", "rootMidi": 64, "chordType": "min7", "options": ["小三和弦", "小七和弦", "属七和弦", "半减七和弦"]},
      {"type": "chord_identify", "rootMidi": 65, "chordType": "min7", "options": ["增三和弦", "小七和弦", "大七和弦", "属七和弦"]},
      {"type": "chord_identify", "rootMidi": 67, "chordType": "min7", "options": ["小三和弦", "小七和弦", "减七和弦", "大七和弦"]},
      {"type": "chord_identify", "rootMidi": 69, "chordType": "min7", "options": ["大三和弦", "小七和弦", "属七和弦", "半减七和弦"]}
    ],
    "passThreshold": 0.75,
    "theory": {
      "title": "小七和弦",
      "content": "小七和弦 = 小三和弦 + 小七度。由根音、小三度、纯五度、小七度组成。音响柔和忧郁，是爵士和R&B中最常用的和弦之一。"
    }
  }',
  30
) ON CONFLICT (id) DO NOTHING;

-- 第3课：属七和弦
INSERT INTO lessons (id, skill_id, name, description, lesson_order, lesson_type, content, xp_reward)
VALUES (
  'seventh_chords_3',
  'seventh_chords',
  '属七和弦',
  '学习属七和弦的构成与解决倾向',
  3,
  'quiz',
  '{
    "type": "quiz",
    "questions": [
      {"type": "chord_identify", "rootMidi": 60, "chordType": "dom7", "options": ["大三和弦", "属七和弦", "大七和弦", "小七和弦"]},
      {"type": "chord_identify", "rootMidi": 67, "chordType": "dom7", "options": ["小三和弦", "属七和弦", "小七和弦", "减七和弦"]},
      {"type": "chord_identify", "rootMidi": 62, "chordType": "dom7", "options": ["增三和弦", "属七和弦", "大七和弦", "半减七和弦"]},
      {"type": "chord_identify", "rootMidi": 65, "chordType": "dom7", "options": ["大三和弦", "属七和弦", "小七和弦", "大七和弦"]},
      {"type": "chord_identify", "rootMidi": 69, "chordType": "dom7", "options": ["小三和弦", "属七和弦", "减七和弦", "小七和弦"]},
      {"type": "chord_identify", "rootMidi": 64, "chordType": "dom7", "options": ["大三和弦", "属七和弦", "大七和弦", "减七和弦"]}
    ],
    "passThreshold": 0.75,
    "theory": {
      "title": "属七和弦",
      "content": "属七和弦 = 大三和弦 + 小七度。由根音、大三度、纯五度、小七度组成。具有强烈的解决倾向，是调性音乐中最重要的功能和弦。"
    }
  }',
  30
) ON CONFLICT (id) DO NOTHING;

-- 第4课：减七和弦与半减七和弦
INSERT INTO lessons (id, skill_id, name, description, lesson_order, lesson_type, content, xp_reward)
VALUES (
  'seventh_chords_4',
  'seventh_chords',
  '减七和弦',
  '学习减七和弦与半减七和弦',
  4,
  'quiz',
  '{
    "type": "quiz",
    "questions": [
      {"type": "chord_identify", "rootMidi": 60, "chordType": "dim7", "options": ["减三和弦", "减七和弦", "半减七和弦", "小七和弦"]},
      {"type": "chord_identify", "rootMidi": 62, "chordType": "m7b5", "options": ["减三和弦", "半减七和弦", "减七和弦", "小七和弦"]},
      {"type": "chord_identify", "rootMidi": 64, "chordType": "dim7", "options": ["小三和弦", "减七和弦", "半减七和弦", "属七和弦"]},
      {"type": "chord_identify", "rootMidi": 65, "chordType": "m7b5", "options": ["增三和弦", "半减七和弦", "减七和弦", "大七和弦"]},
      {"type": "chord_identify", "rootMidi": 67, "chordType": "dim7", "options": ["大三和弦", "减七和弦", "小七和弦", "半减七和弦"]},
      {"type": "chord_identify", "rootMidi": 69, "chordType": "m7b5", "options": ["小三和弦", "半减七和弦", "减七和弦", "属七和弦"]}
    ],
    "passThreshold": 0.75,
    "theory": {
      "title": "减七与半减七",
      "content": "减七和弦由4个小三度叠加组成，具有对称结构。半减七和弦(又称小七降五)由减三和弦+小七度组成，常用于ii-V-I进行。"
    }
  }',
  30
) ON CONFLICT (id) DO NOTHING;

-- 第5课：七和弦综合
INSERT INTO lessons (id, skill_id, name, description, lesson_order, lesson_type, content, xp_reward)
VALUES (
  'seventh_chords_5',
  'seventh_chords',
  '综合测验',
  '所有七和弦类型混合辨别',
  5,
  'quiz',
  '{
    "type": "quiz",
    "questions": [
      {"type": "chord_identify", "rootMidi": 60, "chordType": "maj7", "options": ["大七和弦", "小七和弦", "属七和弦", "减七和弦"]},
      {"type": "chord_identify", "rootMidi": 62, "chordType": "min7", "options": ["大七和弦", "小七和弦", "属七和弦", "半减七和弦"]},
      {"type": "chord_identify", "rootMidi": 65, "chordType": "dom7", "options": ["大七和弦", "小七和弦", "属七和弦", "减七和弦"]},
      {"type": "chord_identify", "rootMidi": 67, "chordType": "dim7", "options": ["大七和弦", "半减七和弦", "属七和弦", "减七和弦"]},
      {"type": "chord_identify", "rootMidi": 64, "chordType": "m7b5", "options": ["大七和弦", "小七和弦", "属七和弦", "半减七和弦"]},
      {"type": "chord_identify", "rootMidi": 69, "chordType": "maj7", "options": ["大七和弦", "小七和弦", "属七和弦", "减七和弦"]},
      {"type": "chord_identify", "rootMidi": 60, "chordType": "dom7", "options": ["大七和弦", "小七和弦", "属七和弦", "半减七和弦"]},
      {"type": "chord_identify", "rootMidi": 62, "chordType": "dim7", "options": ["大七和弦", "小七和弦", "减七和弦", "半减七和弦"]},
      {"type": "chord_identify", "rootMidi": 65, "chordType": "min7", "options": ["大七和弦", "小七和弦", "属七和弦", "减七和弦"]},
      {"type": "chord_identify", "rootMidi": 67, "chordType": "m7b5", "options": ["大七和弦", "小七和弦", "属七和弦", "半减七和弦"]}
    ],
    "passThreshold": 0.8
  }',
  40
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 4. 旋律听写课程
-- =============================================

-- 第1课：三音旋律
INSERT INTO lessons (id, skill_id, name, description, lesson_order, lesson_type, content, xp_reward)
VALUES (
  'melody_dictation_1',
  'melody_dictation',
  '三音旋律',
  '听记3个音符组成的短旋律',
  1,
  'quiz',
  '{
    "type": "melody_dictation",
    "questions": [
      {"type": "melody", "notes": [60, 62, 64], "options": [["C", "D", "E"], ["C", "E", "G"], ["D", "E", "F"], ["E", "F", "G"]]},
      {"type": "melody", "notes": [64, 62, 60], "options": [["E", "D", "C"], ["G", "F", "E"], ["F", "E", "D"], ["D", "C", "B"]]},
      {"type": "melody", "notes": [60, 64, 67], "options": [["C", "E", "G"], ["C", "D", "E"], ["D", "F", "A"], ["E", "G", "B"]]},
      {"type": "melody", "notes": [67, 65, 64], "options": [["G", "F", "E"], ["A", "G", "F"], ["F", "E", "D"], ["E", "D", "C"]]},
      {"type": "melody", "notes": [60, 65, 69], "options": [["C", "F", "A"], ["C", "E", "G"], ["D", "G", "B"], ["E", "A", "C"]]},
      {"type": "melody", "notes": [72, 69, 67], "options": [["C5", "A", "G"], ["D5", "B", "A"], ["E5", "C5", "B"], ["B", "G", "F"]]}
    ],
    "passThreshold": 0.75,
    "theory": {
      "title": "旋律听写入门",
      "content": "听写旋律时，先注意第一个音和最后一个音，再关注旋律的整体走向(上行、下行、波浪形)，最后确定中间的音。"
    }
  }',
  35
) ON CONFLICT (id) DO NOTHING;

-- 第2课：四音旋律
INSERT INTO lessons (id, skill_id, name, description, lesson_order, lesson_type, content, xp_reward)
VALUES (
  'melody_dictation_2',
  'melody_dictation',
  '四音旋律',
  '听记4个音符组成的旋律',
  2,
  'quiz',
  '{
    "type": "melody_dictation",
    "questions": [
      {"type": "melody", "notes": [60, 62, 64, 65], "options": [["C", "D", "E", "F"], ["D", "E", "F", "G"], ["C", "E", "G", "A"], ["E", "F", "G", "A"]]},
      {"type": "melody", "notes": [67, 65, 64, 62], "options": [["G", "F", "E", "D"], ["A", "G", "F", "E"], ["F", "E", "D", "C"], ["E", "D", "C", "B"]]},
      {"type": "melody", "notes": [60, 64, 62, 67], "options": [["C", "E", "D", "G"], ["C", "D", "E", "G"], ["D", "F", "E", "A"], ["E", "G", "F", "B"]]},
      {"type": "melody", "notes": [72, 69, 67, 65], "options": [["C5", "A", "G", "F"], ["D5", "B", "A", "G"], ["B", "G", "F", "E"], ["A", "F", "E", "D"]]},
      {"type": "melody", "notes": [60, 67, 64, 72], "options": [["C", "G", "E", "C5"], ["C", "E", "G", "C5"], ["D", "A", "F", "D5"], ["E", "B", "G", "E5"]]}
    ],
    "passThreshold": 0.75
  }',
  35
) ON CONFLICT (id) DO NOTHING;

-- 第3课：旋律听写综合
INSERT INTO lessons (id, skill_id, name, description, lesson_order, lesson_type, content, xp_reward)
VALUES (
  'melody_dictation_3',
  'melody_dictation',
  '综合测验',
  '3-5音旋律混合听写',
  3,
  'quiz',
  '{
    "type": "melody_dictation",
    "questions": [
      {"type": "melody", "notes": [60, 64, 67], "options": [["C", "E", "G"], ["D", "F", "A"], ["E", "G", "B"], ["F", "A", "C5"]]},
      {"type": "melody", "notes": [67, 72, 69, 65], "options": [["G", "C5", "A", "F"], ["A", "D5", "B", "G"], ["F", "B", "G", "E"], ["E", "A", "F", "D"]]},
      {"type": "melody", "notes": [60, 62, 64, 67, 72], "options": [["C", "D", "E", "G", "C5"], ["D", "E", "F", "A", "D5"], ["C", "E", "G", "B", "E5"], ["E", "F", "G", "B", "E5"]]},
      {"type": "melody", "notes": [72, 67, 64, 60], "options": [["C5", "G", "E", "C"], ["D5", "A", "F", "D"], ["B", "G", "E", "C"], ["A", "F", "D", "B"]]},
      {"type": "melody", "notes": [60, 65, 64, 62, 60], "options": [["C", "F", "E", "D", "C"], ["D", "G", "F", "E", "D"], ["E", "A", "G", "F", "E"], ["C", "E", "D", "B", "C"]]}
    ],
    "passThreshold": 0.8
  }',
  45
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 5. 专业视唱课程
-- =============================================

-- 第1课：大跳音程演唱
INSERT INTO lessons (id, skill_id, name, description, lesson_order, lesson_type, content, xp_reward)
VALUES (
  'professional_sightsing_1',
  'professional_sightsing',
  '大跳音程',
  '演唱六度、七度、八度跳跃',
  1,
  'sing',
  '{
    "type": "sing",
    "questions": [
      {"type": "sing_interval", "startMidi": 60, "targetMidi": 69, "interval": "大六度", "tolerance": 40},
      {"type": "sing_interval", "startMidi": 60, "targetMidi": 71, "interval": "大七度", "tolerance": 40},
      {"type": "sing_interval", "startMidi": 60, "targetMidi": 72, "interval": "纯八度", "tolerance": 35},
      {"type": "sing_interval", "startMidi": 67, "targetMidi": 60, "interval": "下行纯五度", "tolerance": 40},
      {"type": "sing_interval", "startMidi": 72, "targetMidi": 60, "interval": "下行八度", "tolerance": 35},
      {"type": "sing_interval", "startMidi": 64, "targetMidi": 72, "interval": "小六度", "tolerance": 40}
    ],
    "passThreshold": 0.75,
    "theory": {
      "title": "大跳演唱技巧",
      "content": "演唱大跳音程时，先在心中默唱中间经过的音，保持气息支撑，跳跃时保持声带张力稳定。"
    }
  }',
  35
) ON CONFLICT (id) DO NOTHING;

-- 第2课：变化音演唱
INSERT INTO lessons (id, skill_id, name, description, lesson_order, lesson_type, content, xp_reward)
VALUES (
  'professional_sightsing_2',
  'professional_sightsing',
  '变化音',
  '演唱升降记号的变化音',
  2,
  'sing',
  '{
    "type": "sing",
    "questions": [
      {"type": "sing_note", "targetMidi": 61, "noteName": "#C / bD", "tolerance": 35},
      {"type": "sing_note", "targetMidi": 63, "noteName": "#D / bE", "tolerance": 35},
      {"type": "sing_note", "targetMidi": 66, "noteName": "#F / bG", "tolerance": 35},
      {"type": "sing_note", "targetMidi": 68, "noteName": "#G / bA", "tolerance": 35},
      {"type": "sing_note", "targetMidi": 70, "noteName": "#A / bB", "tolerance": 35},
      {"type": "sing_sequence", "notes": [60, 61, 62, 63, 64], "description": "半音上行", "tolerance": 40}
    ],
    "passThreshold": 0.75,
    "theory": {
      "title": "变化音演唱",
      "content": "变化音(升降号)将音高升高或降低半音。演唱时可以先唱相邻的自然音，再微调到变化音位置。"
    }
  }',
  35
) ON CONFLICT (id) DO NOTHING;

-- 第3课：复杂节奏视唱
INSERT INTO lessons (id, skill_id, name, description, lesson_order, lesson_type, content, xp_reward)
VALUES (
  'professional_sightsing_3',
  'professional_sightsing',
  '复杂旋律',
  '综合性旋律视唱',
  3,
  'sing',
  '{
    "type": "sing",
    "questions": [
      {"type": "sing_sequence", "notes": [60, 64, 67, 72, 67, 64, 60], "description": "大三和弦分解", "tolerance": 40},
      {"type": "sing_sequence", "notes": [60, 63, 67, 72, 67, 63, 60], "description": "小三和弦分解", "tolerance": 40},
      {"type": "sing_sequence", "notes": [60, 62, 64, 65, 67, 69, 71, 72], "description": "C大调音阶", "tolerance": 35},
      {"type": "sing_sequence", "notes": [72, 71, 69, 67, 65, 64, 62, 60], "description": "C大调下行音阶", "tolerance": 35},
      {"type": "sing_sequence", "notes": [60, 67, 64, 72, 69, 65, 62, 60], "description": "跳跃旋律", "tolerance": 45}
    ],
    "passThreshold": 0.75
  }',
  40
) ON CONFLICT (id) DO NOTHING;

-- 第4课：视唱综合测验
INSERT INTO lessons (id, skill_id, name, description, lesson_order, lesson_type, content, xp_reward)
VALUES (
  'professional_sightsing_4',
  'professional_sightsing',
  '综合测验',
  '专业级视唱能力检验',
  4,
  'sing',
  '{
    "type": "sing",
    "questions": [
      {"type": "sing_interval", "startMidi": 60, "targetMidi": 71, "interval": "大七度", "tolerance": 35},
      {"type": "sing_note", "targetMidi": 66, "noteName": "#F", "tolerance": 30},
      {"type": "sing_sequence", "notes": [60, 64, 67, 71, 72], "description": "大七和弦分解", "tolerance": 40},
      {"type": "sing_interval", "startMidi": 72, "targetMidi": 60, "interval": "下行八度", "tolerance": 30},
      {"type": "sing_sequence", "notes": [60, 63, 66, 69, 72], "description": "减七和弦分解", "tolerance": 45},
      {"type": "sing_note", "targetMidi": 68, "noteName": "#G", "tolerance": 30}
    ],
    "passThreshold": 0.8
  }',
  50
) ON CONFLICT (id) DO NOTHING;
