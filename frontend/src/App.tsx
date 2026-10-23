import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { AuthPage } from './pages/AuthPage';
import { BrandOnboardingPage } from './pages/BrandOnboardingPage';
import { CampaignGoalPage } from './pages/CampaignGoalPage';
import { CampaignDetailsPage } from './pages/CampaignDetailsPage';
import { CalendarPage } from './pages/CalendarPage';
import { ChannelsPage } from './pages/ChannelsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--muted)] text-sm font-semibold">
        Загрузка ContentPilot 2.0...
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col transition-colors duration-200">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<CampaignGoalPage />} />
          <Route path="/campaigns/:id" element={<CampaignDetailsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/brand" element={<BrandOnboardingPage />} />
          <Route path="/channels" element={<ChannelsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
