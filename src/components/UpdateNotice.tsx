import { RefreshCw, X } from 'lucide-react';
import { Button } from './ui/Button';

interface UpdateNoticeProps {
  visible: boolean;
  onDismiss: () => void;
  onUpdate: () => void;
}

export const UpdateNotice = ({ visible, onDismiss, onUpdate }: UpdateNoticeProps) => {
  if (!visible) return null;

  return (
    <aside role="status" aria-live="polite" className="fixed inset-x-3 bottom-24 z-[120] mx-auto max-w-md rounded-2xl border-3 border-dark bg-white p-4 shadow-neo md:bottom-6">
      <button type="button" aria-label="暂不更新" onClick={onDismiss} className="absolute right-2 top-2 rounded-lg p-1 hover:bg-slate-100">
        <X className="h-5 w-5" />
      </button>
      <h2 className="pr-8 text-lg font-black">新版本已经准备好</h2>
      <p className="mt-1 text-sm font-medium text-slate-600">完成当前练习后更新，页面会刷新一次。</p>
      <Button className="mt-4 w-full" onClick={onUpdate}>
        <RefreshCw className="h-5 w-5" />
        更新并刷新
      </Button>
    </aside>
  );
};
