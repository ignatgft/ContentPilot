import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { AuthPage } from './pages/AuthPage';
import { AccountPage } from './pages/AccountPage';

// SmartCanteen AI Pages
import { CanteenDashboardPage } from './pages/CanteenDashboardPage';
import { BookingPage } from './pages/BookingPage';
import { MenuPage } from './pages/MenuPage';
import { ForecastPage } from './pages/ForecastPage';
import { ProcurementPage } from './pages/ProcurementPage';
import { InventoryPage } from './pages/InventoryPage';
import { WastePage } from './pages/WastePage';
import { CanteenAnalyticsPage } from './pages/CanteenAnalyticsPage';
import { SchoolSettingsPage } from './pages/SchoolSettingsPage';
import { StudentPublicPage } from './pages/StudentPublicPage';

import { UtensilsCrossed } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. Zero-auth public access for students (QR-code / school link)
  if (location.pathname.startsWith('/public')) {
    return (
      <Routes>
        <Route path="/public/:schoolSlug" element={<StudentPublicPage />} />
        <Route path="/public" element={<Navigate to="/public/school-24" replace />} />
        <Route path="*" element={<Navigate to="/public/school-24" replace />} />
      </Routes>
    );
  }

  // 2. Auth Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-3 text-[var(--muted)] text-sm font-semibold">
        <div className="w-12 h-12 rounded-2xl bg-[#153D32] flex items-center justify-center text-white shadow-md animate-pulse">
          <UtensilsCrossed className="w-6 h-6 text-[#13A875]" />
        </div>
        Загрузка SmartCanteen AI...
      </div>
    );
  }

  // 3. Unauthenticated admin/staff redirect to AuthPage
  if (!user) {
    return <AuthPage />;
  }

  // 4. Authenticated Admin Dashboard with FoodTech Sidebar Layout
  return (
    <div className="min-h-screen bg-[var(--bg)] flex transition-colors duration-200">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<CanteenDashboardPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/forecast" element={<ForecastPage />} />
            <Route path="/procurement" element={<ProcurementPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/waste" element={<WastePage />} />
            <Route path="/analytics" element={<CanteenAnalyticsPage />} />
            <Route path="/settings" element={<SchoolSettingsPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/public/:schoolSlug" element={<StudentPublicPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-4 text-center text-xs text-[var(--muted)] flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-semibold text-[#153D32] dark:text-[#E2F4EA]">
            SmartCanteen AI — Платформа управления школьным питанием
          </span>
          <span className="text-[11px] opacity-75">
            FoodTech SaaS • FEFO • СанПиН КР • 0% пищевых отходов
          </span>
        </footer>
      </div>
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