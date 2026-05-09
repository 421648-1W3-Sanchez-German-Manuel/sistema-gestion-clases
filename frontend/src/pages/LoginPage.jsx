import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import kremlinLogo from '../assets/kremlin-logo.jpg';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Sesión iniciada correctamente');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Credenciales inválidas';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-[0_1px_0_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <CardHeader className="text-center space-y-3">
            <div className="flex justify-center">
              <img src={kremlinLogo} alt="Kremlin Agency" className="h-12 w-auto object-contain" />
            </div>
            <CardTitle className="text-2xl font-serif">Acceso al sistema</CardTitle>
            <CardDescription>Gestiona clases, asistencia y facturación de forma centralizada.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sistema.com"
                  required
                  className="bg-white"
                  data-testid="login-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-white"
                  data-testid="login-password-input"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive" data-testid="login-error-text">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit-button">
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verificando credenciales…</> : 'Iniciar sesión'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      {/* Right side - decorative (desktop) */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
        <img
          src="https://images.unsplash.com/photo-1599104040457-fe0e8c9ae77e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTF8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzY2hvb2wlMjBhZG1pbmlzdHJhdGlvbiUyMG9mZmljZSUyMHN0YWZmJTIwZGFzaGJvYXJkJTIwYWJzdHJhY3QlMjB0ZXh0dXJlfGVufDB8fHx0ZWFsfDE3NzcyMjEyNDd8MA&ixlib=rb-4.1.0&q=85"
          alt="" className="object-cover w-full h-full opacity-60"
        />
        <div className="absolute inset-0 flex items-end p-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 max-w-sm">
            <h3 className="font-semibold text-lg font-serif mb-2">Kremlin agency</h3>
            <p className="text-sm text-muted-foreground">Administra profesores, alumnos, salones, horarios, asistencia y facturación desde un solo lugar.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
