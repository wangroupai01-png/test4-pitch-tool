import { useState } from 'react';
import { Share2, Copy, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
  score?: number;
  mode?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  title = 'Melody Challenger - 音高大师',
  text = '来挑战你的音乐耳朵！',
  url = 'https://www.melodychallenger.com',
  score,
  mode,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const shareText = score 
    ? `🎵 我在「${mode || '音高大师'}」获得了 ${score} 分！来挑战我吧！` 
    : text;
  
  const shareUrl = url;
  
  const handleShare = async () => {
    // Try native Web Share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or error, fall back to modal
        if ((err as Error).name === 'AbortError') return;
      }
    }
    
    // Fall back to copy modal
    setShowModal(true);
  };
  
  const handleCopy = async () => {
    const fullText = `${shareText}\n${shareUrl}`;
    
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = fullText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const MotionDiv = motion.div as any;
  const MotionBtn = motion.button as any;
  
  return (
    <>
      <MotionBtn
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleShare}
        className="flex items-center gap-2 bg-accent text-white border-3 border-dark px-4 py-2 rounded-full font-bold shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
      >
        <Share2 className="w-4 h-4" />
        <span className="hidden sm:inline">分享</span>
      </MotionBtn>
      
      <AnimatePresence>
        {showModal && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <MotionDiv
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-white border-3 border-dark rounded-2xl shadow-neo p-6 w-full max-w-sm relative"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-3 right-3 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xl font-black mb-4">分享给朋友</h3>
              
              {/* Preview */}
              <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 mb-4">
                <p className="font-bold text-sm mb-2">{shareText}</p>
                <p className="text-xs text-primary break-all">{shareUrl}</p>
              </div>
              
              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold border-3 border-dark transition-all ${
                  copied 
                    ? 'bg-secondary text-white' 
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    已复制！
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    复制链接
                  </>
                )}
              </button>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>
    </>
  );
};
