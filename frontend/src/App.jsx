import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import SidebarLayout from './components/layout/SidebarLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CursosPage from './pages/CursosPage';
import CursoDetailPage from './pages/CursoDetailPage';
import SesionesPage from './pages/SesionesPage';
import ProximasSesionesPage from './pages/ProximasSesionesPage';
import SalonesPage from './pages/SalonesPage';
import AlumnosPage from './pages/AlumnosPage';
import AlumnoDetailPage from './pages/AlumnoDetailPage';
import AsistenciaPage from './pages/AsistenciaPage';
import FacturacionPage from './pages/FacturacionPage';
import ProfesoresPage from './pages/ProfesoresPage';
import TiposClasePage from './pages/TiposClasePage';
import UsuariosPage from './pages/UsuariosPage';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function SuperuserRoute({ children }) {
  const { user, loading, isSuperuser } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isSuperuser) return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route element={<ProtectedRoute><SidebarLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/cursos" element={<CursosPage />} />
        <Route path="/cursos/:id" element={<CursoDetailPage />} />
        <Route path="/sesiones" element={<SesionesPage />} />
        <Route path="/proximas-sesiones" element={<ProximasSesionesPage />} />
        <Route path="/salones" element={<SalonesPage />} />
        <Route path="/alumnos" element={<AlumnosPage />} />
        <Route path="/alumnos/:id" element={<AlumnoDetailPage />} />
        <Route path="/asistencia" element={<AsistenciaPage />} />
        <Route path="/facturacion" element={<FacturacionPage />} />
        <Route path="/profesores" element={<ProfesoresPage />} />
        <Route path="/tipos-clase" element={<TiposClasePage />} />
        <Route path="/usuarios" element={<SuperuserRoute><UsuariosPage /></SuperuserRoute>} />
        <Route path="/clases" element={<Navigate to="/cursos" replace />} />
        <Route path="/clases/:id" element={<Navigate to="/cursos/:id" replace />} />
        <Route path="/proximas-clases" element={<Navigate to="/proximas-sesiones" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
