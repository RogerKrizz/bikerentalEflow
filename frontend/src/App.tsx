import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import StudentDashboard from './pages/StudentDashboard';
import ConfirmRidePage from './pages/ConfirmRidePage';
import ActiveRidePage from './pages/ActiveRidePage';
import PaymentPage from './pages/PaymentPage';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />

          {/* Protected Student Routes */}
          <Route element={<ProtectedRoute requiredRole="STUDENT" />}>
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/ride/confirm" element={<ConfirmRidePage />} />
            <Route path="/ride/active" element={<ActiveRidePage />} />
            <Route path="/payment" element={<PaymentPage />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
