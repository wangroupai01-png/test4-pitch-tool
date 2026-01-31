import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';
import { Button } from '../ui/Button';
import { useUserStore } from '../../store/useUserStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { signInWithEmail, signUpWithEmail } = useUserStore();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (mode === 'login') {
        const result = await signInWithEmail(email, password);
        if (result.error) {
          setError(result.error);
        } else {
          onClose();
          // 如果需要引导，跳转到引导页面
          if (result.needsOnboarding) {
            navigate('/onboarding');
          }
        }
      } else {
        if (!username.trim()) {
          setError('请输入用户名');
          setLoading(false);
          return;
        }
        const result = await signUpWithEmail(email, password, username);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess(true);
        }
      }
    } catch (err) {
      setError('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };
  
  const MotionDiv = motion.div as any;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <MotionDiv
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="bg-white border-3 border-dark rounded-2xl shadow-neo p-6 md:p-8 w-full max-w-md relative"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 border-3 border-dark">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black mb-2">验证邮件已发送！</h2>
                <p className="text-slate-600 mb-6">
                  请检查你的邮箱 <strong>{email}</strong> 并点击验证链接完成注册。
                </p>
                <Button onClick={onClose}>知道了</Button>
              </div>
            ) : (
              <>
                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-black mb-6 text-center">
                  {mode === 'login' ? '欢迎回来' : '创建账号'}
                </h2>
                
                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'register' && (
                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-1">用户名</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="你的昵称"
                          className="w-full pl-10 pr-4 py-3 border-3 border-dark rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">邮箱</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="w-full pl-10 pr-4 py-3 border-3 border-dark rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">密码</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full pl-10 pr-4 py-3 border-3 border-dark rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  
                  {error && (
                    <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-bold">
                      {error}
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    fullWidth
                    disabled={loading}
                    className="!mt-6"
                  >
                    {loading ? (
                      '处理中...'
                    ) : mode === 'login' ? (
                      <>
                        <LogIn className="w-5 h-5" />
                        登录
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        注册
                      </>
                    )}
                  </Button>
                </form>
                
                {/* Switch Mode */}
                <div className="mt-6 text-center">
                  <span className="text-slate-500 font-bold">
                    {mode === 'login' ? '还没有账号？' : '已有账号？'}
                  </span>
                  <button
                    onClick={() => {
                      setMode(mode === 'login' ? 'register' : 'login');
                      setError(null);
                    }}
                    className="ml-2 text-primary font-black hover:underline"
                  >
                    {mode === 'login' ? '立即注册' : '去登录'}
                  </button>
                </div>
              </>
            )}
          </MotionDiv>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};
