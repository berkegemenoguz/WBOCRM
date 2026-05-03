import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import NavBar        from './components/NavBar';
import LoginPage     from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeadPage      from './pages/LeadPage';
import TicketPage    from './pages/TicketPage';
import UsersPage     from './pages/UsersPage';

function ProtectedLayout({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <>
      <NavBar />
      <main style={{ background: '#f8fafc', minHeight: 'calc(100vh - 48px)' }}>
        {children}
      </main>
    </>
  );
}

function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={
        <ProtectedLayout><DashboardPage /></ProtectedLayout>
      } />
      <Route path="/leads" element={
        <ProtectedLayout>
          <RoleRoute roles={['sales', 'admin']}><LeadPage /></RoleRoute>
        </ProtectedLayout>
      } />
      <Route path="/tickets" element={
        <ProtectedLayout>
          <RoleRoute roles={['support', 'admin']}><TicketPage /></RoleRoute>
        </ProtectedLayout>
      } />
      <Route path="/users" element={
        <ProtectedLayout>
          <RoleRoute roles={['admin']}><UsersPage /></RoleRoute>
        </ProtectedLayout>
      } />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
