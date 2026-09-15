import type { ChallengeDay, ListeningQuestion } from './types';
import { getMidiNoteName } from '../../utils/musicTheory';

const day = (
  dayNumber: number,
  chapter: string,
  title: string,
  goal: string,
  theory: string,
  listeningTip: string,
  notePool: number[],
  rewardName: string,
  rewardSymbol: string,
  rarity: '普通' | '稀有' | '珍藏' = '普通',
  mode?: ChallengeDay['mode'],
  focusValues?: number[],
): ChallengeDay => ({
  day: dayNumber, chapter, title, goal, theory, listeningTip, notePool,
  mode: mode || (dayNumber <= 7 ? 'pitch' : dayNumber <= 14 ? 'interval' : dayNumber <= 21 ? 'sing' : dayNumber <= 25 ? 'chord' : 'melody'),
  focusValues: focusValues || ({ 8: [1, 2], 9: [3, 4], 10: [5], 11: [5, 7], 12: [8, 9], 13: [10, 11, 12], 14: [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12] } as Record<number, number[]>)[dayNumber],
  reward: { name: rewardName, symbol: rewardSymbol, rarity, description: `完成第 ${dayNumber} 天训练获得` },
});

export const CHALLENGE_DAYS: ChallengeDay[] = [
  day(1, '第一章 · 唤醒耳朵', '找到中央 C', '建立第一个稳定的声音坐标', '中央 C 是多数练耳训练的起点。先记住它明亮、稳定、不高不低的感觉。', '先听整体高度，再注意尾音落下时的位置。', [60, 62, 64], '中央 C 卡', 'C'),
  day(2, '第一章 · 唤醒耳朵', 'Do、Re、Mi', '分清相邻的三个基础音', 'Do、Re、Mi 像三个连续台阶。Re 在中间，Mi 比 Do 明显更明亮。', '把三个音想成低、中、高三个位置。', [60, 62, 64], '三音阶梯', '↗'),
  day(3, '第一章 · 唤醒耳朵', 'Fa、Sol、La', '扩展到中音区上半段', 'Fa、Sol、La 继续向上延伸。Sol 通常最稳定，La 带有继续向上的期待。', '先找最熟悉的 Sol，再判断左右。', [65, 67, 69], '上行旅人', '♪'),
  day(4, '第一章 · 唤醒耳朵', 'Ti 与高音 Do', '听见导向与落点', 'Ti 有强烈的“还没结束”感，高音 Do 则像抵达终点。', '如果声音让你期待再升一步，它更可能是 Ti。', [69, 71, 72], '归航音符', '⌂'),
  day(5, '第一章 · 唤醒耳朵', '八音归位', '识别完整 C 大调音阶', '今天把八个自然音连成一张地图。不要逐个计算，先判断低、中、高区域。', '先定位音区，再缩小到相邻音。', [60, 62, 64, 65, 67, 69, 71, 72], '音阶地图', '▦', '稀有'),
  day(6, '第一章 · 唤醒耳朵', '跨八度的同名音', '听出同名音的相似与高度差', '同名音跨越八度后音高不同，但色彩和稳定感相似。', '先问“像不像同一个音”，再判断高低。', [48, 60, 72], '八度望远镜', '◎'),
  day(7, '第一章 · 唤醒耳朵', '第一周耳力测验', '整合单音定位能力', '第一周的目标不是绝对音感，而是建立可重复使用的听觉坐标。', '放慢一次判断，准确比速度更重要。', [48, 55, 60, 64, 67, 72], '耳朵觉醒徽章', '◉', '珍藏'),

  day(8, '第二章 · 听见距离', '大二度与小二度', '分辨一步中的宽与窄', '小二度紧张、贴近；大二度更舒展，是音阶中常见的一步。', '注意两个音之间是“挤”还是“松”。', [60, 61, 62], '半音侦探', '½'),
  day(9, '第二章 · 听见距离', '大三度与小三度', '听出明亮与柔和', '大三度常显得明亮，小三度更柔和或略带忧郁。', '先听情绪色彩，再验证距离。', [60, 63, 64], '三度调色盘', '△'),
  day(10, '第二章 · 听见距离', '纯四度', '记住开阔但未落地的距离', '纯四度有向外展开的感觉，却不像纯五度那样稳定。', '想象歌曲开头的呼喊感。', [60, 65, 67], '四度风帆', '4'),
  day(11, '第二章 · 听见距离', '纯五度', '识别稳定、宽阔的骨架', '纯五度是和声的骨架，声音宽阔、稳定、没有明显大小调色彩。', '听它是否像稳稳撑开的两根柱子。', [60, 65, 67], '五度支柱', '5'),
  day(12, '第二章 · 听见距离', '六度的歌唱感', '区分大小六度', '六度常有明显旋律感。小六度更紧张，大六度更温暖开阔。', '不要数半音，先捕捉跳跃后的情绪。', [60, 68, 69], '旋律翅膀', '6'),
  day(13, '第二章 · 听见距离', '七度的张力', '听见强烈未解决感', '七度距离很大，同时非常不稳定，通常渴望回到八度。', '如果宽阔却刺耳，多半接近七度。', [60, 70, 71, 72], '张力闪电', 'ϟ'),
  day(14, '第二章 · 听见距离', '音程侦探周赛', '综合辨认二至八度', '第二周要把“距离”从计算变成直觉：贴近、明亮、开阔、紧张。', '先分类感觉，再选具体答案。', [60, 61, 62, 63, 64, 65, 67, 72], '音程侦探徽章', '⌕', '珍藏'),

  day(15, '第三章 · 唱准声音', '稳定一个长音', '保持音高不漂移', '唱准不仅是起点正确，还要在呼吸和音量变化时保持稳定。', '肩颈放松，用均匀气流托住声音。', [60, 62, 64], '稳定光环', '○'),
  day(16, '第三章 · 唱准声音', '从 Do 唱到 Mi', '完成小跨度上行模唱', '上行时不要用力抬头，让声音在内部移动到更高位置。', '先在心里听到目标，再开口。', [60, 62, 64], '上行火箭', '↑'),
  day(17, '第三章 · 唱准声音', '从 Sol 回到 Do', '建立下行落点', '下行容易唱低。保留声音的支撑，让 Do 成为明确终点。', '下降时保持亮度，不要让气息一起掉下去。', [60, 64, 67], '归位指南针', '↓'),
  day(18, '第三章 · 唱准声音', '三度跳唱', '准确跨越大小三度', '跳唱前先听见两个端点，不要把中间音滑过去。', '像踩两块分开的石头，直接抵达。', [60, 63, 64, 67], '跳音弹簧', '⌁'),
  day(19, '第三章 · 唱准声音', '四五度跳唱', '控制较大跨度', '跨度越大，提前想象目标音越重要。用耳朵带动声音，不用喉咙硬够。', '先播放目标音两次，再尝试一次命中。', [55, 60, 65, 67, 72], '音准弓箭', '➶'),
  day(20, '第三章 · 唱准声音', '换音区不破音', '连接舒适区与高音区', '换音区时减轻重量、保持气流，可以避免突然挤压或掉音。', '音越高，感觉越轻，而不是越用力。', [60, 64, 67, 72, 76], '音区桥梁', '⌒'),
  day(21, '第三章 · 唱准声音', '音准守护者测验', '整合稳定与跳唱', '第三周的成果是：听到目标、提前想象、一次抵达、稳定保持。', '准确、稳定、放松，按这个顺序检查。', [55, 60, 64, 67, 72, 76], '音准守护者徽章', '♢', '珍藏'),

  day(22, '第四章 · 听懂和声', '大三和弦', '识别明亮稳定的和弦', '大三和弦由根音、大三度和纯五度组成，通常明亮而完整。', '听中间那个音是否把整体染亮。', [60, 64, 67], '阳光和弦', '☀'),
  day(23, '第四章 · 听懂和声', '小三和弦', '识别柔和深沉的和弦', '小三和弦把中间音降低半音，整体色彩立即变得柔和。', '对比大三和弦，注意明暗变化。', [60, 63, 67], '月光和弦', '☾'),
  day(24, '第四章 · 听懂和声', '和弦根音', '听出和声的地基', '根音决定和弦的归属。即使不是最低音，也要寻找最有“回家感”的音。', '先哼出最稳定的低层感觉。', [48, 52, 55, 60, 64, 67], '根音罗盘', '◆'),
  day(25, '第四章 · 听懂和声', '属七和弦', '听见推动解决的力量', '属七和弦比大三和弦多一层张力，常强烈推动音乐回到主和弦。', '听它是否完整却仍然“没说完”。', [55, 59, 62, 65, 67], '和声引擎', '7'),
  day(26, '第四章 · 听懂和声', '旋律方向', '记住三到五个音的走势', '先记上行、下行、重复和转折，再记具体音符，旋律记忆会更稳。', '用手势画出轮廓，不急着报音名。', [60, 62, 64, 65, 67], '旋律轨迹', '⌁'),
  day(27, '第四章 · 听懂和声', '旋律中的跳进', '区分级进与跳进', '相邻移动叫级进，跨过一个或更多音叫跳进。跳进通常是旋律记忆的锚点。', '先抓最大的一跳，再补周围小步。', [60, 62, 64, 67, 69, 72], '跳进捕手', '⌇'),
  day(28, '第四章 · 听懂和声', '节奏与音高同行', '在节奏中保持音高记忆', '真实旋律同时包含节奏和音高。先固定节拍，再把音放进节拍格子。', '轻拍稳定拍点，不追着每个音跑。', [60, 62, 64, 65, 67, 69], '节拍齿轮', '♩', '稀有'),
  day(29, '第四章 · 听懂和声', '歌曲片段拆解', '综合使用音高、音程与和声', '面对真实音乐，先找主音，再看旋律方向和关键跳进，最后判断和声色彩。', '一次只解决一个层次，不要同时猜全部。', [55, 60, 62, 64, 67, 69, 72], '歌曲解码器', '⌘', '稀有'),
  day(30, '终章 · 耳力毕业礼', '30 天综合挑战', '完成你的第一轮系统训练', '你已经建立了单音坐标、音程感觉、音准控制与和声意识。下一步是重复弱项，而不是从头刷数量。', '相信第一判断，再用听觉证据复核。', [48, 55, 60, 62, 64, 65, 67, 69, 71, 72, 76], '音感挑战者勋章', '★', '珍藏'),
];

const rotate = <T,>(items: T[], offset: number) => items.map((_, index) => items[(index + offset) % items.length]);
const INTERVAL_LABELS: Record<number, string> = { 1: '小二度', 2: '大二度', 3: '小三度', 4: '大三度', 5: '纯四度', 7: '纯五度', 8: '小六度', 9: '大六度', 10: '小七度', 11: '大七度', 12: '纯八度' };
const CHORDS = [
  { value: 'major', label: '大三和弦', intervals: [0, 4, 7] },
  { value: 'minor', label: '小三和弦', intervals: [0, 3, 7] },
  { value: 'dominant7', label: '属七和弦', intervals: [0, 4, 7, 10] },
];
const MELODIES = [
  { value: 'up', label: '整体上行', offsets: [0, 2, 4] },
  { value: 'down', label: '整体下行', offsets: [4, 2, 0] },
  { value: 'turn', label: '先升后降', offsets: [0, 4, 2] },
  { value: 'repeat', label: '重复后上行', offsets: [0, 0, 3] },
];

export const buildQuestions = (trainingDay: ChallengeDay, count: number, seed = 0): ListeningQuestion[] => {
  const pool = [...new Set(trainingDay.notePool)];
  return Array.from({ length: count }, (_, index) => {
    const targetIndex = (trainingDay.day + seed + index * 2) % pool.length;
    const targetMidi = pool[targetIndex];

    if (trainingDay.mode === 'interval') {
      const intervals = trainingDay.focusValues?.length ? trainingDay.focusValues : [1, 2, 3, 4, 5, 7, 12];
      const interval = intervals[(seed + index) % intervals.length];
      const optionValues = [...new Set([interval, ...rotate(intervals, index).filter((value) => value !== interval)])].slice(0, Math.min(4, intervals.length));
      return { id: `${trainingDay.day}-${seed}-${index}`, audioMidis: [targetMidi, targetMidi + interval], answer: String(interval), options: rotate(optionValues, index % optionValues.length).map((value) => ({ value: String(value), label: INTERVAL_LABELS[value] || `${value} 个半音` })), feedback: `两个音相距 ${INTERVAL_LABELS[interval] || `${interval} 个半音`}` };
    }

    if (trainingDay.mode === 'chord') {
      const choices = trainingDay.focusValues?.map((value) => CHORDS[value]).filter(Boolean) || CHORDS;
      const chord = choices[(seed + index) % choices.length];
      return { id: `${trainingDay.day}-${seed}-${index}`, audioMidis: chord.intervals.map((offset) => targetMidi + offset), answer: chord.value, options: rotate(choices, index % choices.length).map(({ value, label }) => ({ value, label })), feedback: `这是${chord.label}`, playTogether: true };
    }

    if (trainingDay.mode === 'melody') {
      const melody = MELODIES[(seed + index) % MELODIES.length];
      return { id: `${trainingDay.day}-${seed}-${index}`, audioMidis: melody.offsets.map((offset) => targetMidi + offset), answer: melody.value, options: rotate(MELODIES, index % MELODIES.length).map(({ value, label }) => ({ value, label })), feedback: `旋律轮廓是${melody.label}` };
    }

    const candidatePool = rotate(pool, targetIndex);
    const optionValues = [...new Set([targetMidi, ...candidatePool.filter((note) => note !== targetMidi)])].slice(0, Math.min(4, pool.length));
    return { id: `${trainingDay.day}-${seed}-${index}`, audioMidis: [targetMidi], answer: String(targetMidi), options: rotate(optionValues, index % optionValues.length).map((value) => ({ value: String(value), label: getMidiNoteName(value) })), feedback: `正确音高是 ${getMidiNoteName(targetMidi)}` };
  });
};
