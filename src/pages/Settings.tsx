import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Check, X, Upload, Volume2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useUserStore } from '../store/useUserStore';
import { supabase } from '../lib/supabase';
import { 
  INSTRUMENTS, 
  type InstrumentId, 
  getCurrentInstrument, 
  setCurrentInstrument, 
  preloadInstrument 
} from '../hooks/useAudioPlayer';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

// 25个预设头像（使用 emoji 和渐变色）
const PRESET_AVATARS = [
  { id: 1, emoji: '🎵', bg: 'from-primary to-secondary' },
  { id: 2, emoji: '🎸', bg: 'from-red-500 to-orange-500' },
  { id: 3, emoji: '🎹', bg: 'from-slate-700 to-slate-900' },
  { id: 4, emoji: '🎤', bg: 'from-pink-500 to-rose-500' },
  { id: 5, emoji: '🎺', bg: 'from-yellow-400 to-amber-500' },
  { id: 6, emoji: '🥁', bg: 'from-orange-500 to-red-600' },
  { id: 7, emoji: '🎻', bg: 'from-amber-600 to-yellow-700' },
  { id: 8, emoji: '🎷', bg: 'from-indigo-500 to-purple-600' },
  { id: 9, emoji: '🪕', bg: 'from-lime-500 to-green-600' },
  { id: 10, emoji: '🎶', bg: 'from-cyan-500 to-blue-600' },
  { id: 11, emoji: '🦊', bg: 'from-orange-400 to-amber-500' },
  { id: 12, emoji: '🐱', bg: 'from-gray-400 to-gray-600' },
  { id: 13, emoji: '🐶', bg: 'from-amber-400 to-yellow-600' },
  { id: 14, emoji: '🐼', bg: 'from-slate-200 to-slate-400' },
  { id: 15, emoji: '🦁', bg: 'from-amber-500 to-orange-600' },
  { id: 16, emoji: '🐰', bg: 'from-pink-300 to-pink-500' },
  { id: 17, emoji: '🦋', bg: 'from-blue-400 to-purple-500' },
  { id: 18, emoji: '🌸', bg: 'from-pink-400 to-rose-400' },
  { id: 19, emoji: '🌊', bg: 'from-cyan-400 to-blue-500' },
  { id: 20, emoji: '🌙', bg: 'from-indigo-600 to-purple-800' },
  { id: 21, emoji: '⭐', bg: 'from-yellow-300 to-amber-400' },
  { id: 22, emoji: '🔥', bg: 'from-red-500 to-orange-500' },
  { id: 23, emoji: '💎', bg: 'from-cyan-300 to-blue-500' },
  { id: 24, emoji: '🎨', bg: 'from-purple-400 to-pink-500' },
  { id: 25, emoji: '🚀', bg: 'from-slate-600 to-indigo-700' },
];

export const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useUserStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { playNote } = useAudioPlayer();
  
  const [username, setUsername] = useState(profile?.username || '');
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(
    profile?.avatar_url?.startsWith('preset:') 
      ? parseInt(profile.avatar_url.replace('preset:', '')) 
      : null
  );
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(
    profile?.avatar_url && !profile.avatar_url.startsWith('preset:') 
      ? profile.avatar_url 
      : null
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentId>(getCurrentInstrument());
  const [loadingInstrument, setLoadingInstrument] = useState<InstrumentId | null>(null);

  // 从本地存储加载乐器偏好
  useEffect(() => {
    const savedInstrument = localStorage.getItem('preferredInstrument') as InstrumentId | null;
    if (savedInstrument && INSTRUMENTS[savedInstrument]) {
      setSelectedInstrument(savedInstrument);
      setCurrentInstrument(savedInstrument);
    }
  }, []);

  // 按类别分组乐器
  const instrumentsByCategory = Object.entries(INSTRUMENTS).reduce((acc, [id, info]) => {
    if (!acc[info.category]) {
      acc[info.category] = [];
    }
    acc[info.category].push({ id: id as InstrumentId, ...info });
    return acc;
  }, {} as Record<string, { id: InstrumentId; name: string; icon: string; category: string }[]>);

  // 试听乐器 - 播放动听的分解和弦旋律
  const handlePreviewInstrument = async (instrumentId: InstrumentId) => {
    setLoadingInstrument(instrumentId);
    try {
      // 先完成预加载
      await preloadInstrument(instrumentId);
      
      // 播放 C-E-G-高C 分解大三和弦
      const melody = [
        { freq: 261.63, delay: 0 },      // C4
        { freq: 329.63, delay: 400 },    // E4
        { freq: 392.00, delay: 800 },    // G4
        { freq: 523.25, delay: 1200 },   // C5
      ];
      
      for (const note of melody) {
        setTimeout(() => {
          playNote(note.freq, 0.8, undefined, instrumentId);
        }, note.delay);
      }
      
      // 等待旋律播放完成
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      setLoadingInstrument(null);
    }
  };

  // 选择乐器
  const handleSelectInstrument = async (instrumentId: InstrumentId) => {
    setSelectedInstrument(instrumentId);
    setCurrentInstrument(instrumentId);
    localStorage.setItem('preferredInstrument', instrumentId);
    
    // 预加载所选乐器的音色
    await preloadInstrument(instrumentId);
  };

  if (!user) {
    navigate('/profile');
    return null;
  }

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      let avatarUrl = profile?.avatar_url;
      
      if (selectedAvatar !== null) {
        avatarUrl = `preset:${selectedAvatar}`;
      } else if (customAvatarUrl) {
        avatarUrl = customAvatarUrl;
      }
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: username.trim() || null,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        });
      
      if (error) {
        console.error('[Settings] Error saving:', error);
        setMessage({ type: 'error', text: '保存失败，请重试' });
      } else {
        setMessage({ type: 'success', text: '保存成功！' });
        await refreshProfile();
        setTimeout(() => {
          navigate('/profile');
        }, 1000);
      }
    } catch (err) {
      console.error('[Settings] Error:', err);
      setMessage({ type: 'error', text: '保存失败' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: '请选择图片文件' });
      return;
    }
    
    // 验证文件大小 (最大 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: '图片大小不能超过2MB' });
      return;
    }
    
    setUploading(true);
    setMessage(null);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      
      if (uploadError) {
        console.error('[Settings] Upload error:', uploadError);
        // 显示更详细的错误信息
        if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
          setMessage({ type: 'error', text: '存储服务未配置，请联系管理员' });
        } else if (uploadError.message?.includes('policy')) {
          setMessage({ type: 'error', text: '没有上传权限，请重新登录' });
        } else {
          setMessage({ type: 'error', text: `上传失败: ${uploadError.message || '请重试'}` });
        }
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      setCustomAvatarUrl(publicUrl);
      setSelectedAvatar(null);
      setMessage({ type: 'success', text: '上传成功！' });
    } catch (err) {
      console.error('[Settings] Upload error:', err);
      setMessage({ type: 'error', text: '上传失败' });
    } finally {
      setUploading(false);
    }
  };

  const renderCurrentAvatar = () => {
    if (selectedAvatar !== null) {
      const preset = PRESET_AVATARS.find(a => a.id === selectedAvatar);
      if (preset) {
        return (
          <div className={`w-full h-full bg-gradient-to-br ${preset.bg} flex items-center justify-center`}>
            <span className="text-5xl">{preset.emoji}</span>
          </div>
        );
      }
    }
    
    if (customAvatarUrl) {
      return (
        <img 
          src={customAvatarUrl} 
          alt="头像" 
          className="w-full h-full object-cover"
        />
      );
    }
    
    return (
      <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
        <User className="w-12 h-12 text-white" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-light-bg pattern-grid-lg">
      {/* Header */}
      <header className="p-4 flex items-center gap-4 bg-white border-b-3 border-dark shadow-neo-sm sticky top-0 z-30">
        <MotionButton 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 bg-slate-100 rounded-xl border-2 border-dark"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5 text-dark" />
        </MotionButton>
        <h1 className="text-xl font-black text-dark">设置</h1>
      </header>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* 消息提示 */}
        {message && (
          <MotionDiv
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border-3 border-dark ${
              message.type === 'success' ? 'bg-secondary text-white' : 'bg-red-500 text-white'
            }`}
          >
            {message.text}
          </MotionDiv>
        )}

        {/* 当前头像 */}
        <Card className="!p-6">
          <h2 className="font-black text-lg text-dark mb-4">个人头像</h2>
          
          <div className="flex items-center gap-6">
            {/* 当前头像预览 */}
            <MotionDiv 
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="w-24 h-24 rounded-2xl overflow-hidden border-3 border-dark shadow-neo flex-shrink-0"
            >
              {renderCurrentAvatar()}
            </MotionDiv>
            
            <div className="flex-1">
              <p className="text-slate-500 font-bold mb-3">选择一个预设头像或上传自定义头像</p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <MotionDiv
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      上传中...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      上传头像
                    </>
                  )}
                </Button>
                {customAvatarUrl && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCustomAvatarUrl(null);
                      setSelectedAvatar(1);
                    }}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    移除
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </Card>

        {/* 预设头像选择 */}
        <Card className="!p-6">
          <h2 className="font-black text-lg text-dark mb-4">预设头像</h2>
          <div className="grid grid-cols-5 gap-3">
            {PRESET_AVATARS.map((avatar) => (
              <MotionButton
                key={avatar.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedAvatar(avatar.id);
                  setCustomAvatarUrl(null);
                }}
                className={`
                  aspect-square rounded-xl overflow-hidden border-3 transition-all relative
                  ${selectedAvatar === avatar.id 
                    ? 'border-primary shadow-neo ring-2 ring-primary ring-offset-2' 
                    : 'border-dark hover:shadow-neo-sm'
                  }
                `}
              >
                <div className={`w-full h-full bg-gradient-to-br ${avatar.bg} flex items-center justify-center`}>
                  <span className="text-2xl md:text-3xl">{avatar.emoji}</span>
                </div>
                {selectedAvatar === avatar.id && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-white">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </MotionButton>
            ))}
          </div>
        </Card>

        {/* 昵称设置 */}
        <Card className="!p-6">
          <h2 className="font-black text-lg text-dark mb-4">昵称</h2>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="输入你的昵称..."
            maxLength={20}
            className="w-full px-4 py-3 rounded-xl border-3 border-dark font-bold text-dark placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          />
          <p className="text-sm text-slate-400 mt-2 font-medium">最多20个字符</p>
        </Card>

        {/* 乐器音色选择 */}
        <Card className="!p-6">
          <h2 className="font-black text-lg text-dark mb-2">🎹 乐器音色</h2>
          <p className="text-sm text-slate-500 mb-4">选择你喜欢的乐器音色，点击试听预览</p>
          
          {Object.entries(instrumentsByCategory).map(([category, instruments]) => (
            <div key={category} className="mb-4 last:mb-0">
              <h3 className="text-sm font-bold text-slate-400 mb-2">{category}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {instruments.map((instrument) => (
                  <MotionButton
                    key={instrument.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectInstrument(instrument.id)}
                    className={`
                      p-3 rounded-xl border-2 text-left transition-all flex items-center gap-2
                      ${selectedInstrument === instrument.id
                        ? 'border-primary bg-primary/10 shadow-neo-sm'
                        : 'border-dark hover:bg-slate-50'
                      }
                    `}
                  >
                    <span className="text-xl">{instrument.icon}</span>
                    <span className="font-bold text-sm flex-1">{instrument.name}</span>
                    {selectedInstrument === instrument.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </MotionButton>
                ))}
              </div>
            </div>
          ))}
          
          {/* 试听按钮 */}
          <div className="mt-4 pt-4 border-t-2 border-slate-200">
            <Button
              variant="secondary"
              onClick={() => handlePreviewInstrument(selectedInstrument)}
              disabled={loadingInstrument !== null}
              className="flex items-center gap-2"
            >
              {loadingInstrument ? (
                <>
                  <MotionDiv
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  加载中...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  试听 {INSTRUMENTS[selectedInstrument].name}
                </>
              )}
            </Button>
            <p className="text-xs text-slate-400 mt-2">音色会自动保存，下次打开自动加载</p>
          </div>
        </Card>

        {/* 保存按钮 */}
        <Button
          className="w-full py-4 text-lg"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <MotionDiv className="flex items-center justify-center gap-2">
              <MotionDiv
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
              保存中...
            </MotionDiv>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              保存设置
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
