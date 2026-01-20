import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { FreeMode } from './pages/FreeMode';
import { QuizMode } from './pages/QuizMode';
import { SingMode } from './pages/SingMode';
import { useUserStore } from './store/useUserStore';

function App() {
  const initialize = useUserStore((state) => state.initialize);
  
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  return (
    <Router>
      <div className="min-h-screen bg-light-bg font-sans text-dark">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/free" element={<FreeMode />} />
          <Route path="/quiz" element={<QuizMode />} />
          <Route path="/sing" element={<SingMode />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
