import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getMuiTheme } from './styles/theme';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VideoMeet from './pages/VideoMeet';
import Profile from './pages/Profile';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';

function MainApp() {
  const { themeMode } = useAuth();
  const muiTheme = getMuiTheme(themeMode);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Routes>
        {/* Landing Page */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <LandingPage />
            </>
          }
        />

        {/* Guest Authentication Routes */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Navbar />
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Navbar />
              <Register />
            </GuestRoute>
          }
        />

        {/* Protected Dashboard and Settings */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Navbar />
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Navbar />
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Video Conferencing Room: Hide Navbar for fullscreen meeting */}
        <Route
          path="/meet/:roomId"
          element={
            <ProtectedRoute>
              <VideoMeet />
            </ProtectedRoute>
          }
        />

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </BrowserRouter>
  );
}
