# 🎵 Melody Challenger 项目开发日志

## 项目概述
**项目名称**: Melody Challenger (音高大师 / PitchMaster)  
**域名**: www.melodychallenger.com  
**部署平台**: Vercel (自动部署)  
**仓库**: https://github.com/wangroupai01-png/test4-pitch-tool.git  

## 技术栈
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS (Neo-Brutalism 风格)
- **动画**: Framer Motion
- **路由**: React Router DOM
- **音频**: Web Audio API + Salamander Grand Piano 采样
- **音高检测**: Pitchfinder (YIN 算法)
- **特效**: canvas-confetti
- **后端**: Supabase (认证 + 数据库)
- **状态管理**: Zustand (带持久化)

---

## 关键开发节点

### 2026-01-20: Supabase 集成 (用户系统 + 排行榜 + 分享)
**新增功能**:
- 游客模式：数据存储在本地 localStorage
- 邮箱登录/注册：使用 Supabase Auth
- 排行榜系统：展示全服玩家最高分
- 分享功能：Web Share API + 复制链接

**相关文件**:
- `src/lib/supabase.ts` - Supabase 客户端配置
- `src/lib/supabase-schema.sql` - 数据库表结构
- `src/store/useUserStore.ts` - 用户状态管理 (Zustand)
- `src/components/auth/AuthModal.tsx` - 登录/注册弹窗
- `src/components/auth/UserButton.tsx` - 用户按钮组件
- `src/components/ui/ShareButton.tsx` - 分享按钮
- `src/components/game/Leaderboard.tsx` - 排行榜组件

**Supabase 配置**:
- Project ID: `xuxfmetjjfeaexwllpyd`
- 数据库表: `profiles`, `leaderboard`
- RLS 策略已启用

---

### 2026-01-20: 移动端适配优化
**变更内容**:
- 所有页面响应式布局优化 (Home, FreeMode, QuizMode, SingMode)
- 钢琴键盘响应式尺寸 + 横向滚动支持
- 禁用页面缩放，添加 PWA meta 标签
- 添加 safe-area 适配刘海屏
- 隐藏滚动条工具类 `.hide-scrollbar`

**相关文件**:
- `src/pages/*.tsx` - 所有页面
- `src/components/game/PianoKeyboard.tsx`
- `src/index.css`
- `index.html`

---

### 2026-01-20: 钢琴音色优化
**问题**: 合成音色电子感太重  
**解决方案**: 改用 Salamander Grand Piano 采样 (CDN 加载)

**相关文件**:
- `src/hooks/useAudioPlayer.ts`

**技术细节**:
```typescript
// 采样 CDN 地址
const SAMPLE_BASE_URL = 'https://cdn.jsdelivr.net/gh/surikov/webaudio-tinysynth@gh-pages/sounds/salamander/';
// 预加载 C3-C6 范围的音符
// 加载失败时回退到 sine 波形
```

---

### 2026-01-20: 音高可视化器修复
**问题**: 
1. 可视化器下方出现黑色空白区域
2. 视图随用户音高浮动，视觉混乱
3. 可见音符范围不够 (C5 不够，需要到 G5)

**解决方案**:
- `NOTE_HEIGHT` 设为 15px (每半音)
- `centerMidi` 固定为 64 (E4)，不再跟随用户音高
- `visibleSemitones` 缓冲区增加到 +48
- Canvas 使用 `position: absolute; inset: 0` 填满容器

**相关文件**:
- `src/components/game/PitchVisualizer.tsx`

---

### 2026-01-20: 哼唱闯关 (SingMode) 实现
**功能**:
- 随机生成目标音高 (F3-C5)
- 实时音高检测匹配
- 进度条 (需保持 1.5 秒完成匹配)
- 成功后播放和弦 + 撒花特效
- 关卡递进

**相关文件**:
- `src/pages/SingMode.tsx`

---

### 初始功能
**首页 (Home)**:
- 三种模式卡片入口
- Neo-Brutalism 设计风格

**自由练习 (FreeMode)**:
- 实时音高检测 + 可视化
- 显示当前音高、音分偏差

**听音辨位 (QuizMode)**:
- 播放随机音符
- 用户点击钢琴键猜测
- 得分 + 连击系统

---

## 项目文件结构
```
src/
├── components/
│   ├── auth/
│   │   ├── AuthModal.tsx       # 登录/注册弹窗
│   │   └── UserButton.tsx      # 用户按钮
│   ├── game/
│   │   ├── Leaderboard.tsx     # 排行榜弹窗
│   │   ├── PianoKeyboard.tsx   # 钢琴键盘组件
│   │   └── PitchVisualizer.tsx # 音高可视化器
│   └── ui/
│       ├── Button.tsx          # 通用按钮
│       ├── Card.tsx            # 通用卡片
│       └── ShareButton.tsx     # 分享按钮
├── hooks/
│   ├── useAudioPlayer.ts       # 音频播放 (钢琴采样)
│   ├── usePitchDetector.ts     # 音高检测
│   └── useAudioContext.ts      # AudioContext 管理
├── lib/
│   ├── supabase.ts             # Supabase 客户端
│   └── supabase-schema.sql     # 数据库 Schema
├── pages/
│   ├── Home.tsx                # 首页
│   ├── FreeMode.tsx            # 自由练习
│   ├── QuizMode.tsx            # 听音辨位
│   └── SingMode.tsx            # 哼唱闯关
├── store/
│   ├── useGameStore.ts         # 游戏状态管理
│   └── useUserStore.ts         # 用户状态管理
├── utils/
│   ├── musicTheory.ts          # 音乐理论工具函数
│   └── pitchDetection.ts       # 音高检测算法
├── App.tsx                     # 路由配置
├── main.tsx                    # 入口文件
└── index.css                   # 全局样式
```

---

## 重要技术决策

### 1. 音高检测
使用 `pitchfinder` 库的 YIN 算法，精度约 ±10 音分。
```typescript
// usePitchDetector.ts
const detector = Pitchfinder.YIN({ sampleRate });
```

### 2. 音频播放
- 全局单例 `AudioContext` 避免重复创建
- 播放前调用 `audioContext.resume()` 处理浏览器自动播放策略
- 停止当前音频再播放新音频，避免重叠

### 3. Canvas 可视化
- 使用 `requestAnimationFrame` 实现 60fps 动画
- 音高历史存储在 `historyRef` 中，绘制轨迹线
- 动态渲染音符网格线

### 4. 样式系统
Tailwind CSS 自定义配置:
```javascript
// tailwind.config.js
colors: {
  primary: '#7F5AF0',    // 紫色
  secondary: '#2CB67D',  // 绿色
  accent: '#FF8906',     // 橙色
  dark: '#16161a',       // 深色
  'light-bg': '#FFFFFE', // 背景色
}
```

---

## 已知问题 & 待优化

1. **音频延迟**: 首次播放采样可能有加载延迟 (已通过预加载缓解)
2. **低端设备**: Canvas 动画可能在低端手机上卡顿
3. **浏览器兼容**: 需要支持 Web Audio API 的现代浏览器

---

## 部署信息

**Git 分支**: master  
**自动部署**: GitHub 推送后 Vercel 自动构建  
**构建命令**: `npm run build`  
**输出目录**: `dist/`

---

*最后更新: 2026-01-20*
