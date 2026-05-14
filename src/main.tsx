import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import PublicRegistrationForm from './components/registration/PublicRegistrationForm.tsx';
import TicketPage from './components/registration/TicketPage.tsx';
import NotFoundPage from './components/NotFoundPage.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/r/:token" element={<PublicRegistrationForm />} />
        <Route path="/ticket/:id" element={<TicketPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
