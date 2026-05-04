import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentsAPI, billingAPI } from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingTable } from '../components/common/LoadingTable';
import { EmptyState } from '../components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, User, BookOpen, ClipboardCheck, Receipt } from 'lucide-react';
import { toast } from 'sonner';

const statusBadge = (status) => {
  const map = {
    PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
    PAID: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    OVERDUE: 'bg-rose-50 text-rose-700 border border-rose-200',
    CANCELLED: 'bg-slate-50 text-slate-500 border border-slate-200',
  };
  const labels = { PENDING: 'Pendiente', PAID: 'Pagada', OVERDUE: 'Vencida', CANCELLED: 'Cancelada' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${map[status] || ''}`}>{labels[status] || status}</span>;
};

export default function AlumnoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [billing, setBilling] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, a, b] = await Promise.all([
          studentsAPI.get(id),
          studentsAPI.attendance(id),
          studentsAPI.billing(id),
        ]);
        setStudent(s.data); setAttendance(a.data); setBilling(b.data);
      } catch { toast.error('Error al cargar datos del alumno'); }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <LoadingTable rows={6} cols={4} />;
  if (!student) return <EmptyState title="Alumno no encontrado" />;

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate('/alumnos')} className="mb-4 gap-2">
        <ArrowLeft className="h-4 w-4" /> Volver a alumnos
      </Button>
      <PageHeader title={student.name} description={student.email || 'Sin email'} />

      <Tabs defaultValue="info" data-testid="student-detail-tabs">
        <TabsList className="mb-4">
          <TabsTrigger value="info"><User className="h-4 w-4 mr-1" /> Informaci\u00f3n</TabsTrigger>
          <TabsTrigger value="asistencia"><ClipboardCheck className="h-4 w-4 mr-1" /> Asistencia</TabsTrigger>
          <TabsTrigger value="facturacion"><Receipt className="h-4 w-4 mr-1" /> Facturaci\u00f3n</TabsTrigger>
        </TabsList>

<TabsContent value="info">
          <Card className="shadow-sm"><CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><p className="text-sm text-muted-foreground">Nombre</p><p className="font-medium">{student.name}</p></div>
            <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{student.email || '-'}</p></div>
            <div><p className="text-sm text-muted-foreground">Teléfono</p><p className="font-medium">{student.phone || '-'}</p></div>
            <div><p className="text-sm text-muted-foreground">Curso</p><p className="font-medium">{student.course_name || 'Sin curso asignado'}</p></div>
            <div><p className="text-sm text-muted-foreground">Fecha nacimiento</p><p className="font-mono">{student.birth_date || '-'}</p></div>
            {student.guardian && (
              <>
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <p className="text-sm text-muted-foreground mb-2">Tutor responsable</p>
                </div>
                <div><p className="text-sm text-muted-foreground">Nombre</p><p className="font-medium">{student.guardian.name}</p></div>
                <div><p className="text-sm text-muted-foreground">Teléfono</p><p className="font-medium">{student.guardian.phone}</p></div>
              </>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="asistencia">
          {attendance.length === 0 ? <EmptyState icon={ClipboardCheck} title="Sin registros" description="No hay registros de asistencia." /> : (
            <Card className="shadow-sm"><Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Curso</TableHead><TableHead>Hora</TableHead><TableHead>Estado</TableHead><TableHead>Notas</TableHead></TableRow></TableHeader>
              <TableBody>{attendance.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-sm">{a.class_date}</TableCell>
                  <TableCell>{a.course_name || '-'}</TableCell>
                  <TableCell className="font-mono text-sm">{a.start_time}-{a.end_time}</TableCell>
                  <TableCell>{a.present ? <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">Presente</Badge> : <Badge className="bg-slate-50 text-slate-700 border border-slate-200">Ausente</Badge>}</TableCell>
                  <TableCell className="text-sm">{a.notes || '-'}</TableCell>
                </TableRow>
              ))}</TableBody></Table></Card>
          )}
        </TabsContent>

        <TabsContent value="facturacion">
          {billing.length === 0 ? <EmptyState icon={Receipt} title="Sin facturas" description="No hay facturas para este alumno." /> : (
            <Card className="shadow-sm"><Table><TableHeader><TableRow><TableHead>Concepto</TableHead><TableHead>Monto</TableHead><TableHead>Vencimiento</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
              <TableBody>{billing.map(b => (
                <TableRow key={b.id}>
                  <TableCell>{b.description || '-'}</TableCell>
                  <TableCell className="font-mono">${b.amount?.toFixed(2)}</TableCell>
                  <TableCell className="font-mono text-sm">{b.due_date}</TableCell>
                  <TableCell>{statusBadge(b.status)}</TableCell>
                </TableRow>
              ))}</TableBody></Table></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
