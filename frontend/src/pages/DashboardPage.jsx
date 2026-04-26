import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingTable } from '../components/common/LoadingTable';
import { EmptyState } from '../components/common/EmptyState';
import { dashboardAPI, billingAPI } from '../api/client';
import { BookOpen, Users, GraduationCap, Receipt, AlertTriangle, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Mark overdue on load
        await billingAPI.markOverdue();
        const res = await dashboardAPI.get();
        setData(res.data);
      } catch (err) {
        toast.error('Error al cargar el dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="space-y-6"><LoadingTable rows={4} cols={3} /></div>;

  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen general del sistema" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-sm" data-testid="kpi-active-classes">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clases activas</p>
                <p className="text-3xl font-semibold mt-1">{data?.active_classes || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm" data-testid="kpi-active-students">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alumnos activos</p>
                <p className="text-3xl font-semibold mt-1">{data?.active_students || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm" data-testid="kpi-active-teachers">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Profesores</p>
                <p className="text-3xl font-semibold mt-1">{data?.active_teachers || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Facturas pendientes</p>
                <p className="text-3xl font-semibold mt-1">{(data?.pending_bills || 0) + (data?.overdue_bills || 0)}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            {data?.overdue_bills > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                <span className="text-xs text-destructive">{data.overdue_bills} vencidas</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm" data-testid="dashboard-today-classes-table">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4" /> Clases de hoy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.today_classes?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hora</TableHead>
                  <TableHead>Clase</TableHead>
                  <TableHead>Salón</TableHead>
                  <TableHead>Profesor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.today_classes.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-sm">{c.start_time} - {c.end_time}</TableCell>
                    <TableCell className="font-medium">{c.class_name}</TableCell>
                    <TableCell>{c.classroom_name}</TableCell>
                    <TableCell>{c.teacher_name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState icon={CalendarClock} title="No hay clases hoy" description="No hay clases programadas para el día de hoy." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
