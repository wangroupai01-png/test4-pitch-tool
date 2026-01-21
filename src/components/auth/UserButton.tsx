import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Trophy, Settings } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { AuthModal } from './AuthModal';

export const UserButton: React.FC = () => {
  const { user, profile, isGuest, signOut } = useUserStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const MotionDiv = motion.div as any;
  
  if (isGuest) {
    return (
      <>
        <button
          onClick={() => setShowAuthModal(true)}
          className="flex items-center gap-2 bg-white border-3 border-dark px-3 md:px-4 py-2 rounded-full font-bold shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-sm md:text-base"
        >
          <User className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">登录</span>
        </button>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }
  
  const displayName = profile?.username || user?.email?.split('@')[0] || '用户';
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 bg-primary text-white border-3 border-dark px-3 md:px-4 py-2 rounded-full font-bold shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-sm md:text-base"
      >
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
        <span className="hidden sm:inline max-w-[100px] truncate">{displayName}</span>
      </button>
      
      <AnimatePresence>
        {showDropdown && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowDropdown(false)} 
            />
            
            {/* Dropdown */}
            <MotionDiv
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-48 bg-white border-3 border-dark rounded-xl shadow-neo z-50 overflow-hidden"
            >
              <div className="p-3 border-b-2 border-slate-100">
                <p className="font-black truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              
              <div className="p-2">
                <button
                  onClick={() => {
                    // TODO: Navigate to profile/stats
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 font-bold text-left transition-colors"
                >
                  <Trophy className="w-4 h-4 text-accent" />
                  我的成绩
                </button>
                
                <button
                  onClick={() => {
                    // TODO: Navigate to settings
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 font-bold text-left transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  设置
                </button>
                
                <hr className="my-2 border-slate-100" />
                
                <button
                  onClick={() => {
                    signOut();
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-red-500 font-bold text-left transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </MotionDiv>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
