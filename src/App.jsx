import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './app.scss';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast/ToastProvider';
import AuthPage from './pages/AuthPage/AuthPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import AppointmentsPage from './pages/AppointmentsPage/AppointmentsPage';
import OptimizerPage from './pages/OptimizerPage/OptimizerPage';
import PatientsPage from './pages/PatientsPage/PatientsPage';
import DoctorsPage from './pages/DoctorsPage/DoctorsPage';

function Loader() {
  return (
    <div className="app-loader">
      <div className="spinner" />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  return user ? children : <Navigate to="/" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={(
                <PublicRoute>
                  <AuthPage />
                </PublicRoute>
              )}
            />
            <Route
              path="/dashboard"
              element={(
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/appointments"
              element={(
                <ProtectedRoute>
                  <AppointmentsPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/optimizer"
              element={(
                <ProtectedRoute>
                  <OptimizerPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/patients"
              element={(
                <ProtectedRoute>
                  <PatientsPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/doctors"
              element={(
                <ProtectedRoute>
                  <DoctorsPage />
                </ProtectedRoute>
              )}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
