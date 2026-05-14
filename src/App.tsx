import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './auth/Auth';
import CipherLab from '../cipherlab/CipherLab';
import Dashboard from './dashboard/Dashboard';
import Multiplayer from '../multiplayer/Multiplayer';
import StoryMode from './story_mode/StoryMode';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/account?mode=login" />;
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/account" element={<Auth />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/cipherlab" element={<ProtectedRoute><CipherLab /></ProtectedRoute>} />
          <Route path="/multiplayer" element={<ProtectedRoute><Multiplayer /></ProtectedRoute>} />
          <Route path="/story/*" element={<ProtectedRoute><StoryMode /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
