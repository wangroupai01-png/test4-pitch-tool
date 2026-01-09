import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { FreeMode } from './pages/FreeMode';
import { QuizMode } from './pages/QuizMode';
import { SingMode } from './pages/SingMode';

function App() {
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
