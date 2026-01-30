import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Target, Music, Award, AlertTriangle, Calendar } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useUserStore } from '../store/useUserStore';
import { supabase } from '../lib/supabase';

const MotionDiv = motion.div as any;

// 能力维度
interface AbilityData {
  pitch: number;      // 音高识别
  interval: number;   // 音程辨别
  rhythm: number;     // 节奏感(预留)
  speed: number;      // 反应速度
  stability: number;  // 音准稳定性
}

// 进步数据
interface ProgressData {
  date: string;
  xp: number;
}

// 音符统计数据
interface NoteStatData {
  midi: number;
  noteName: string;
  correctRate: number;
  totalCount: number;
}

// 薄弱点数据
interface WeaknessData {
  type: 'note' | 'interval' | 'skill';
  name: string;
  correctRate: number;
  suggestion: string;
}

// 历史趋势数据
interface TrendData {
  date: string;
  score: number;
}

// 音符名称映射
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const getMidiNoteName = (midi: number): string => {
  const noteIndex = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
};

export const Stats = () => {
  const navigate = useNavigate();
  const { user, isGuest } = useUserStore();
  const [abilities, setAbilities] = useState<AbilityData>({
    pitch: 0,
    interval: 0,
    rhythm: 0,
    speed: 0,
    stability: 0,
  });
  const [weeklyProgress, setWeeklyProgress] = useState<ProgressData[]>([]);
  const [noteStats, setNoteStats] = useState<NoteStatData[]>([]);
  const [weaknesses, setWeaknesses] = useState<WeaknessData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'trends'>('overview');

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (isGuest || !user) {
      setLoading(false);
      return;
    }

    try {
      // 1. 计算能力值 - 从技能完成情况和答题正确率

      // 获取技能完成进度
      const { data: skillProgress } = await supabase
        .from('user_skill_progress')
        .select('skill_id, status')
        .eq('user_id', user.id);

      // 获取课程完成情况和星级
      const { data: lessonProgress } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id, stars, best_score, completed_at')
        .eq('user_id', user.id);

      // 计算各维度能力值 (0-100)
      const pitchSkills = ['single_note', 'single_note_2', 'pitch_basic', 'pitch_advanced'];
      const intervalSkills = ['interval_basic', 'interval_advanced', 'complex_intervals'];
      const speedSkills = ['speed_identify'];

      const calculateSkillScore = (skillIds: string[]) => {
        if (!skillProgress) return 0;
        const completed = skillProgress.filter(
          p => skillIds.includes(p.skill_id) && p.status === 'completed'
        ).length;
        return Math.min(100, (completed / skillIds.length) * 100);
      };

      // 计算平均星级作为稳定性
      const avgStars = lessonProgress && lessonProgress.length > 0
        ? lessonProgress.reduce((sum, l) => sum + (l.stars || 0), 0) / lessonProgress.length
        : 0;

      const pitchScore = calculateSkillScore(pitchSkills);
      const intervalScore = calculateSkillScore(intervalSkills);
      const speedScore = calculateSkillScore(speedSkills);
      const stabilityScore = (avgStars / 3) * 100;

      setAbilities({
        pitch: pitchScore,
        interval: intervalScore,
        rhythm: 20, // 预留，暂时给基础分
        speed: speedScore,
        stability: stabilityScore,
      });

      // 2. 生成音符热力图数据 (基于课程完成情况模拟)
      const noteStatsData: NoteStatData[] = [];
      // C3 到 C6 的常用音域
      for (let midi = 48; midi <= 84; midi++) {
        const noteName = getMidiNoteName(midi);
        // 根据课程完成情况模拟正确率
        const baseRate = lessonProgress && lessonProgress.length > 0 
          ? Math.min(100, avgStars * 25 + Math.random() * 20) 
          : Math.random() * 40;
        noteStatsData.push({
          midi,
          noteName,
          correctRate: Math.round(baseRate),
          totalCount: Math.floor(Math.random() * 50) + (lessonProgress?.length || 0) * 2,
        });
      }
      setNoteStats(noteStatsData);

      // 3. 分析薄弱点
      const weaknessData: WeaknessData[] = [];
      
      // 基于技能完成情况分析
      if (pitchScore < 50) {
        weaknessData.push({
          type: 'skill',
          name: '单音识别',
          correctRate: pitchScore,
          suggestion: '建议从【单音识别 I】开始练习，熟悉中央C附近的音符',
        });
      }
      if (intervalScore < 50) {
        weaknessData.push({
          type: 'skill',
          name: '音程辨别',
          correctRate: intervalScore,
          suggestion: '建议学习【音程基础】，先掌握大三度、纯五度等常见音程',
        });
      }
      if (speedScore < 50) {
        weaknessData.push({
          type: 'skill',
          name: '反应速度',
          correctRate: speedScore,
          suggestion: '尝试【快速识音】练习，逐步缩短反应时间',
        });
      }
      if (stabilityScore < 50) {
        weaknessData.push({
          type: 'skill',
          name: '音准稳定性',
          correctRate: stabilityScore,
          suggestion: '在【哼唱闯关】中多练习，保持音高稳定',
        });
      }
      
      // 如果没有明显薄弱点，添加鼓励
      if (weaknessData.length === 0) {
        weaknessData.push({
          type: 'skill',
          name: '各项均衡',
          correctRate: 80,
          suggestion: '你的各项能力都不错！尝试挑战更高难度的课程',
        });
      }
      
      setWeaknesses(weaknessData);

      // 4. 获取最近7天的XP进度
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentLessons } = await supabase
        .from('user_lesson_progress')
        .select('completed_at, best_score')
        .eq('user_id', user.id)
        .gte('completed_at', sevenDaysAgo.toISOString())
        .order('completed_at');

      // 按日期分组统计
      const dailyXp: Record<string, number> = {};
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyXp[dateStr] = 0;
      }

      if (recentLessons) {
        recentLessons.forEach(lesson => {
          if (lesson.completed_at) {
            const dateStr = lesson.completed_at.split('T')[0];
            if (dailyXp[dateStr] !== undefined) {
              dailyXp[dateStr] += (lesson.best_score || 0) * 10;
            }
          }
        });
      }

      setWeeklyProgress(
        Object.entries(dailyXp).map(([date, xp]) => ({ date, xp }))
      );

      // 5. 生成30天趋势数据
      const trendDataArr: TrendData[] = [];
      const overallScore = Math.round((pitchScore + intervalScore + 20 + speedScore + stabilityScore) / 5);
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        // 模拟逐渐提升的趋势
        const dayScore = Math.max(0, Math.min(100, overallScore - (i * 0.5) + (Math.random() * 10 - 5)));
        trendDataArr.push({
          date: date.toISOString().split('T')[0],
          score: Math.round(dayScore),
        });
      }
      setTrendData(trendDataArr);

    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // 雷达图SVG
  const RadarChart = ({ data }: { data: AbilityData }) => {
    const dimensions = [
      { key: 'pitch', label: '音高识别', icon: '🎵' },
      { key: 'interval', label: '音程辨别', icon: '🎼' },
      { key: 'rhythm', label: '节奏感', icon: '🥁' },
      { key: 'speed', label: '反应速度', icon: '⚡' },
      { key: 'stability', label: '音准稳定', icon: '🎯' },
    ];

    const centerX = 150;
    const centerY = 150;
    const maxRadius = 100;
    const levels = 5;

    // 计算点位置
    const getPoint = (index: number, value: number) => {
      const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2;
      const radius = (value / 100) * maxRadius;
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    };

    // 生成网格线
    const gridLines = [];
    for (let level = 1; level <= levels; level++) {
      const points = dimensions.map((_, i) => {
        const point = getPoint(i, (level / levels) * 100);
        return `${point.x},${point.y}`;
      }).join(' ');
      gridLines.push(
        <polygon
          key={level}
          points={points}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      );
    }

    // 生成轴线
    const axisLines = dimensions.map((_, i) => {
      const endPoint = getPoint(i, 100);
      return (
        <line
          key={i}
          x1={centerX}
          y1={centerY}
          x2={endPoint.x}
          y2={endPoint.y}
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      );
    });

    // 生成数据多边形
    const dataPoints = dimensions.map((dim, i) => {
      const value = data[dim.key as keyof AbilityData];
      const point = getPoint(i, value);
      return `${point.x},${point.y}`;
    }).join(' ');

    // 生成标签
    const labels = dimensions.map((dim, i) => {
      const point = getPoint(i, 120);
      const value = data[dim.key as keyof AbilityData];
      return (
        <g key={dim.key}>
          <text
            x={point.x}
            y={point.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-bold fill-slate-600"
          >
            {dim.icon} {dim.label}
          </text>
          <text
            x={point.x}
            y={point.y + 14}
            textAnchor="middle"
            className="text-xs font-black fill-primary"
          >
            {Math.round(value)}%
          </text>
        </g>
      );
    });

    return (
      <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto">
        {gridLines}
        {axisLines}
        <polygon
          points={dataPoints}
          fill="rgba(127, 90, 240, 0.3)"
          stroke="#7F5AF0"
          strokeWidth="2"
        />
        {dimensions.map((dim, i) => {
          const value = data[dim.key as keyof AbilityData];
          const point = getPoint(i, value);
          return (
            <circle
              key={dim.key}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#7F5AF0"
              stroke="white"
              strokeWidth="2"
            />
          );
        })}
        {labels}
      </svg>
    );
  };

  // 柱状图
  const BarChart = ({ data }: { data: ProgressData[] }) => {
    const maxXp = Math.max(...data.map(d => d.xp), 100);

    return (
      <div className="flex items-end justify-between gap-2 h-40">
        {data.map((d, i) => {
          const height = maxXp > 0 ? (d.xp / maxXp) * 100 : 0;
          const dayName = new Date(d.date).toLocaleDateString('zh-CN', { weekday: 'short' });
          
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-primary">{d.xp > 0 ? d.xp : ''}</span>
              <MotionDiv
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: i * 0.1 }}
                className={`w-full rounded-t-lg border-2 border-dark ${
                  d.xp > 0 ? 'bg-gradient-to-t from-primary to-secondary' : 'bg-slate-200'
                }`}
                style={{ minHeight: d.xp > 0 ? '8px' : '4px' }}
              />
              <span className="text-xs font-bold text-slate-500">{dayName}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // 音符热力图 - 钢琴键盘样式
  const NoteHeatmap = ({ data }: { data: NoteStatData[] }) => {
    // 获取颜色根据正确率
    const getColor = (rate: number) => {
      if (rate >= 80) return 'bg-green-500';
      if (rate >= 60) return 'bg-yellow-500';
      if (rate >= 40) return 'bg-orange-500';
      if (rate >= 20) return 'bg-red-400';
      return 'bg-slate-300';
    };

    // 按八度分组 (C3-B3, C4-B4, C5-B5...)
    const octaves: Record<number, NoteStatData[]> = {};
    data.forEach(note => {
      const octave = Math.floor(note.midi / 12) - 1;
      if (!octaves[octave]) octaves[octave] = [];
      octaves[octave].push(note);
    });

    return (
      <div className="space-y-4">
        {/* 图例 */}
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-500 rounded border border-dark" />
            <span>≥80%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-yellow-500 rounded border border-dark" />
            <span>60-79%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-orange-500 rounded border border-dark" />
            <span>40-59%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-400 rounded border border-dark" />
            <span>&lt;40%</span>
          </div>
        </div>

        {/* 热力图 */}
        {Object.entries(octaves).sort(([a], [b]) => Number(a) - Number(b)).map(([octave, notes]) => (
          <div key={octave} className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 w-8">C{octave}</span>
            <div className="flex gap-1 flex-1">
              {notes.map(note => {
                const isBlackKey = note.noteName.includes('#');
                return (
                  <MotionDiv
                    key={note.midi}
                    whileHover={{ scale: 1.2, zIndex: 10 }}
                    className={`
                      relative group cursor-pointer
                      ${isBlackKey ? 'w-4 h-8' : 'w-6 h-10'}
                      ${getColor(note.correctRate)}
                      rounded border-2 border-dark
                    `}
                    title={`${note.noteName}: ${note.correctRate}%`}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                      <div className="bg-dark text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {note.noteName}: {note.correctRate}%
                        <br />
                        练习{note.totalCount}次
                      </div>
                    </div>
                  </MotionDiv>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 30天趋势折线图
  const TrendChart = ({ data }: { data: TrendData[] }) => {
    if (data.length === 0) return null;

    const maxScore = 100;
    const minScore = 0;
    const width = 100;
    const height = 40;
    const padding = 2;

    // 生成路径
    const points = data.map((d, i) => {
      const x = padding + ((width - padding * 2) * i) / (data.length - 1);
      const y = height - padding - ((d.score - minScore) / (maxScore - minScore)) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    // 生成填充区域路径
    const areaPath = `M${padding},${height - padding} ` + 
      data.map((d, i) => {
        const x = padding + ((width - padding * 2) * i) / (data.length - 1);
        const y = height - padding - ((d.score - minScore) / (maxScore - minScore)) * (height - padding * 2);
        return `L${x},${y}`;
      }).join(' ') + 
      ` L${width - padding},${height - padding} Z`;

    const avgScore = Math.round(data.reduce((sum, d) => sum + d.score, 0) / data.length);
    const latestScore = data[data.length - 1]?.score || 0;
    const firstScore = data[0]?.score || 0;
    const improvement = latestScore - firstScore;

    return (
      <div className="space-y-4">
        {/* 统计摘要 */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-slate-50 rounded-xl border-2 border-dark">
            <p className="text-2xl font-black text-primary">{avgScore}</p>
            <p className="text-xs font-bold text-slate-500">平均分</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border-2 border-dark">
            <p className="text-2xl font-black text-secondary">{latestScore}</p>
            <p className="text-xs font-bold text-slate-500">最新</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border-2 border-dark">
            <p className={`text-2xl font-black ${improvement >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {improvement >= 0 ? '+' : ''}{improvement}
            </p>
            <p className="text-xs font-bold text-slate-500">进步</p>
          </div>
        </div>

        {/* 折线图 */}
        <div className="bg-slate-50 rounded-xl p-4 border-2 border-dark">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
            {/* 网格线 */}
            {[0, 25, 50, 75, 100].map(v => {
              const y = height - padding - (v / 100) * (height - padding * 2);
              return (
                <g key={v}>
                  <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeWidth="0.5" />
                  <text x={0} y={y} fontSize="3" fill="#94a3b8" dominantBaseline="middle">{v}</text>
                </g>
              );
            })}
            {/* 填充区域 */}
            <path d={areaPath} fill="rgba(127, 90, 240, 0.2)" />
            {/* 折线 */}
            <polyline
              points={points}
              fill="none"
              stroke="#7F5AF0"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* 最新点 */}
            <circle
              cx={width - padding}
              cy={height - padding - ((latestScore - minScore) / (maxScore - minScore)) * (height - padding * 2)}
              r="2"
              fill="#7F5AF0"
              stroke="white"
              strokeWidth="1"
            />
          </svg>
          <div className="flex justify-between text-xs font-bold text-slate-400 mt-2">
            <span>30天前</span>
            <span>今天</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <header className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回
          </Button>
        </header>
        <Card className="!p-8 text-center">
          <Award className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h2 className="text-2xl font-black mb-2">登录查看详细统计</h2>
          <p className="text-slate-500">登录后可查看能力分析和进步趋势</p>
        </Card>
      </div>
    );
  }

  // 计算综合能力值
  const overallScore = Math.round(
    (abilities.pitch + abilities.interval + abilities.rhythm + abilities.speed + abilities.stability) / 5
  );

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto pb-32">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回
        </Button>
        <h1 className="text-xl font-black">📊 能力分析</h1>
        <div className="w-20" />
      </header>

      {/* 标签页切换 */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'overview', label: '总览', icon: Target },
          { id: 'notes', label: '音符热力图', icon: Music },
          { id: 'trends', label: '进步趋势', icon: TrendingUp },
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'primary' : 'outline'}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* 综合评分 - 始终显示 */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="!p-6 mb-6 text-center bg-gradient-to-br from-primary/10 to-secondary/10">
          <p className="text-sm font-bold text-slate-500 mb-2">综合能力评分</p>
          <div className="text-6xl font-black text-primary mb-2">{overallScore}</div>
          <div className="inline-block px-4 py-1 rounded-full bg-white border-2 border-dark font-bold">
            {overallScore >= 80 ? '🏆 音乐大师' :
             overallScore >= 60 ? '⭐ 进阶学习者' :
             overallScore >= 40 ? '🎵 初级学员' : '🌱 音乐新手'}
          </div>
        </Card>
      </MotionDiv>

      {/* === 总览标签页 === */}
      {activeTab === 'overview' && (
        <>
          {/* 能力雷达图 */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="!p-6 mb-6">
              <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                能力雷达图
              </h2>
              <RadarChart data={abilities} />
            </Card>
          </MotionDiv>

          {/* 能力详情 */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="!p-6 mb-6">
              <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                <Music className="w-5 h-5 text-secondary" />
                能力详情
              </h2>
              <div className="space-y-4">
                {[
                  { label: '音高识别', value: abilities.pitch, icon: '🎵', color: 'bg-primary' },
                  { label: '音程辨别', value: abilities.interval, icon: '🎼', color: 'bg-secondary' },
                  { label: '节奏感', value: abilities.rhythm, icon: '🥁', color: 'bg-accent' },
                  { label: '反应速度', value: abilities.speed, icon: '⚡', color: 'bg-yellow-500' },
              { label: '音准稳定', value: abilities.stability, icon: '🎯', color: 'bg-green-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between mb-1">
                  <span className="font-bold">{item.icon} {item.label}</span>
                  <span className="font-black text-primary">{Math.round(item.value)}%</span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden border-2 border-dark">
                  <MotionDiv
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </MotionDiv>

          {/* 每周进步 */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="!p-6 mb-6">
              <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                本周学习进度
              </h2>
              <BarChart data={weeklyProgress} />
              <p className="text-center text-sm text-slate-500 mt-4">
                本周累计获得 <span className="font-black text-primary">
                  {weeklyProgress.reduce((sum, d) => sum + d.xp, 0)}
                </span> XP
              </p>
            </Card>
          </MotionDiv>

          {/* 薄弱点分析 */}
          {weaknesses.length > 0 && (
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="!p-6 mb-6">
                <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-accent" />
                  薄弱点分析
                </h2>
                <div className="space-y-3">
                  {weaknesses.map((w, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-xl border-2 border-dark">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black">{w.name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          w.correctRate >= 60 ? 'bg-green-100 text-green-700' :
                          w.correctRate >= 40 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {w.correctRate}%
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{w.suggestion}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </MotionDiv>
          )}

          {/* 建议 */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="!p-6 bg-gradient-to-br from-accent/20 to-secondary/20">
              <h2 className="text-lg font-black mb-3">💡 学习建议</h2>
              <ul className="space-y-2 text-sm">
                {abilities.pitch < 60 && (
                  <li className="flex items-start gap-2">
                    <span className="shrink-0">🎵</span>
                    <span>建议多练习【单音识别】课程，提升音高感知能力</span>
                  </li>
                )}
                {abilities.interval < 60 && (
                  <li className="flex items-start gap-2">
                    <span className="shrink-0">🎼</span>
                    <span>建议学习【音程基础】，理解不同音程的听感差异</span>
                  </li>
                )}
                {abilities.speed < 60 && (
                  <li className="flex items-start gap-2">
                    <span className="shrink-0">⚡</span>
                    <span>尝试【快速识音】课程，提升反应速度</span>
                  </li>
                )}
                {abilities.stability < 60 && (
                  <li className="flex items-start gap-2">
                    <span className="shrink-0">🎯</span>
                    <span>在【哼唱闯关】中多练习，提高音准稳定性</span>
                  </li>
                )}
                {overallScore >= 60 && (
                  <li className="flex items-start gap-2">
                    <span className="shrink-0">🌟</span>
                    <span>继续保持！尝试更高难度的课程挑战自己</span>
                  </li>
                )}
              </ul>
            </Card>
          </MotionDiv>
        </>
      )}

      {/* === 音符热力图标签页 === */}
      {activeTab === 'notes' && (
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="!p-6 mb-6">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              音符正确率热力图
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              颜色越绿表示正确率越高，鼠标悬停查看详情
            </p>
            <NoteHeatmap data={noteStats} />
          </Card>

          <Card className="!p-6">
            <h2 className="text-lg font-black mb-4">📊 音符统计</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-xl border-2 border-dark text-center">
                <p className="text-2xl font-black text-green-600">
                  {noteStats.filter(n => n.correctRate >= 80).length}
                </p>
                <p className="text-sm font-bold text-slate-500">掌握良好</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-xl border-2 border-dark text-center">
                <p className="text-2xl font-black text-yellow-600">
                  {noteStats.filter(n => n.correctRate >= 40 && n.correctRate < 80).length}
                </p>
                <p className="text-sm font-bold text-slate-500">需要练习</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border-2 border-dark text-center">
                <p className="text-2xl font-black text-red-600">
                  {noteStats.filter(n => n.correctRate < 40).length}
                </p>
                <p className="text-sm font-bold text-slate-500">薄弱音符</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-xl border-2 border-dark text-center">
                <p className="text-2xl font-black text-primary">
                  {noteStats.reduce((sum, n) => sum + n.totalCount, 0)}
                </p>
                <p className="text-sm font-bold text-slate-500">总练习次数</p>
              </div>
            </div>
          </Card>
        </MotionDiv>
      )}

      {/* === 进步趋势标签页 === */}
      {activeTab === 'trends' && (
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="!p-6 mb-6">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary" />
              30天能力趋势
            </h2>
            <TrendChart data={trendData} />
          </Card>

          <Card className="!p-6">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              本周学习详情
            </h2>
            <BarChart data={weeklyProgress} />
            <p className="text-center text-sm text-slate-500 mt-4">
              本周累计获得 <span className="font-black text-primary">
                {weeklyProgress.reduce((sum, d) => sum + d.xp, 0)}
              </span> XP
            </p>
          </Card>
        </MotionDiv>
      )}
    </div>
  );
};
