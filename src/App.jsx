import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SubjectList } from './features/subjects/SubjectList';
import { SubjectDashboard } from './features/subjects/SubjectDashboard';
import { LandingPage } from './features/landing/LandingPage';

import { Toaster } from 'sonner';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<SubjectList />} />
          <Route path="subject/:id" element={<SubjectDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
