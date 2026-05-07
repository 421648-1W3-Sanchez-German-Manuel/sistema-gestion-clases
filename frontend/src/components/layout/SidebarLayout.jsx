import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import ThemeToggle from '../ui/ThemeToggle';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Separator } from '../ui/separator';
import {
  LayoutDashboard, BookOpen, CalendarClock, Building2, Users, ClipboardCheck,
  Receipt, GraduationCap, Layers, UserCog, Menu, LogOut, ChevronLeft
} from 'lucide-react';
import kremlinLogo from '../../assets/kremlin-logo.jpg';

const navGroups = [
  {
    label: 'Operación',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, testid: 'sidebar-nav-dashboard' },
      { to: '/cursos', label: 'Cursos', icon: BookOpen, testid: 'sidebar-nav-cursos' },
      { to: '/sesiones', label: 'Sesiones', icon: CalendarClock, testid: 'sidebar-nav-sesiones' },
      { to: '/proximas-sesiones', label: 'Próximas Sesiones', icon: CalendarClock, testid: 'sidebar-nav-proximas' },
      { to: '/salones', label: 'Salones', icon: Building2, testid: 'sidebar-nav-salones' },
      { to: '/alumnos', label: 'Alumnos', icon: Users, testid: 'sidebar-nav-alumnos' },
      { to: '/asistencia', label: 'Asistencia', icon: ClipboardCheck, testid: 'sidebar-nav-asistencia' },
      { to: '/facturacion', label: 'Facturación', icon: Receipt, testid: 'sidebar-nav-facturacion' },
    ],
  },
  {
    label: 'Configuración',
    items: [
      { to: '/profesores', label: 'Profesores', icon: GraduationCap, testid: 'sidebar-nav-profesores' },
      { to: '/tipos-clase', label: 'Tipos de Clase', icon: Layers, testid: 'sidebar-nav-tipos' },
      { to: '/usuarios', label: 'Usuarios', icon: UserCog, testid: 'sidebar-nav-usuarios', superuserOnly: true },
    ],
  },
];

function NavItems({ onNavigate }) {
  const { isSuperuser } = useAuth();
  return (
    <nav className="flex-1 overflow-y-auto py-4">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="px-4 pt-5 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {group.label}
          </p>
          {group.items.map((item) => {
            if (item.superuserOnly && !isSuperuser) return null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                data-testid={item.testid}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 mx-2 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 ${
                    isActive
                      ? 'bg-accent text-accent-foreground font-medium border-l-2 border-primary'
                      : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                  }`
                }
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export default function SidebarLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-[260px] flex-col bg-sidebar-background border-r border-sidebar-border">
        <div className="flex items-center gap-2 px-4 h-14 border-b border-border">
          <img src={kremlinLogo} alt="Kremlin Agency" className="h-8 w-auto object-contain" />
          <span className="font-semibold text-base font-['Bodoni_Moda']">Kremlin agency</span>
        </div>
        <NavItems />
        <Separator />
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={handleLogout} data-testid="sidebar-logout">
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-sidebar-background">
          <div className="flex items-center gap-2 px-4 h-14 border-b border-border">
            <img src={kremlinLogo} alt="Kremlin Agency" className="h-8 w-auto object-contain" />
            <span className="font-semibold">Kremlin agency</span>
          </div>
          <NavItems onNavigate={() => setMobileOpen(false)} />
          <Separator />
          <div className="p-4">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-14 bg-background/90 backdrop-blur border-b border-border flex items-center px-4 gap-4">
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileOpen(true)} data-testid="mobile-menu-button">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline">{user?.name}</span>
              <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded">{user?.role}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
