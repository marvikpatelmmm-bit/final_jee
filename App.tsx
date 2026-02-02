import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Leaderboard } from './pages/Leaderboard';
import { Profile } from './pages/Profile';
import { Auth } from './pages/Auth';

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { currentUser, isLoading } = useApp();
  
  if (isLoading) return <div className="flex h-screen items-center justify-center bg-[#0a0e27] text-white">Loading...</div>;
  
  if (!currentUser) return <Navigate to="/auth" />;
  
  return children;
};

const AppContent = () => {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/leaderboard" element={
        <ProtectedRoute>
          <Layout>
            <Leaderboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout>
            <Profile />
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AppProvider>
  );
};

export default App;