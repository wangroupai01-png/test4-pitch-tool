import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[App] Unhandled render error', error, info.componentStack);
  }

  private reload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-light-bg p-6 flex items-center justify-center">
        <section className="w-full max-w-md rounded-2xl border-3 border-dark bg-white p-6 text-center shadow-neo">
          <div className="text-5xl" aria-hidden="true">🎵</div>
          <h1 className="mt-4 text-2xl font-black">页面暂时没有正常加载</h1>
          <p className="mt-3 text-slate-600 font-medium">你的练习记录不会因此丢失。请刷新后重试。</p>
          <Button className="mt-6 w-full" onClick={this.reload}>重新加载</Button>
        </section>
      </main>
    );
  }
}
