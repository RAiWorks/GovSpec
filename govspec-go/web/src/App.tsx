import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Dashboard from '@/pages/dashboard';
import FeatureDetail from '@/pages/feature-detail';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 antialiased">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/features/:id" element={<FeatureDetail />} />
        </Routes>
        <Toaster />
      </div>
    </BrowserRouter>
  );
}

export default App;
