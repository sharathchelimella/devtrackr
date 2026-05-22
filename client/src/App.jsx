/**
 * App.jsx – Root Application Component
 * Sets up React Router, context providers, and global toast notifications.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// ── Context Providers ─────────────────────────────────────────────────────────
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// ── Layouts ───────────────────────────────────────────────────────────────────
import MainLayout from './layouts/MainLayout';

// ── Guards ────────────────────────────────────────────────────────────────────
import PrivateRoute from './components/PrivateRoute';

// ── Pages ─────────────────────────────────────────────────────────────────────
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './pages/OAuthCallback';
import Dashboard from './pages/Dashboard';
import Repositories from './pages/Repositories';
import Commits from './pages/Commits';
import PullRequests from './pages/PullRequests';
import Issues from './pages/Issues';
import AIInsights from './pages/AIInsights';
import Settings from './pages/Settings';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Public Routes ───────────────────────────────────────── */}
            <Route path="/login"          element={<Login />} />
            <Route path="/register"       element={<Register />} />
            {/* GitHub OAuth callback – must be public, receives token via query param */}
            <Route path="/oauth/callback" element={<OAuthCallback />} />

            {/* ── Protected Routes (require authentication) ─────────── */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <MainLayout />
                </PrivateRoute>
              }
            >
              {/* Redirect / to /dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"     element={<Dashboard />} />
              <Route path="repositories"  element={<Repositories />} />
              <Route path="commits"       element={<Commits />} />
              <Route path="pull-requests" element={<PullRequests />} />
              <Route path="issues"        element={<Issues />} />
              <Route path="ai-insights"   element={<AIInsights />} />
              <Route path="settings"      element={<Settings />} />
            </Route>

            {/* ── 404 Catch-all ─────────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>

        {/* ── Global Toast Notifications ────────────────────────────── */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              fontSize: '13px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#1e293b' },
            },
            error: {
              iconTheme: { primary: '#f43f5e', secondary: '#1e293b' },
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
