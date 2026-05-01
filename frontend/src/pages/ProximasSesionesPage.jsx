import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionsAPI } from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingTable } from '../components/common/LoadingTable';
import { EmptyState } from '../components/common/EmptyState';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { CalendarClock, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function ProximasSesionesPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await sessionsAPI.upcoming();
        setSessions(res.data);
      } catch { toast.error('Error al cargar próximas sesiones'); }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div>
      <PageHeader 
        title="Próximas Sesiones" 
        description="Sesiones programadas a futuro" 
      />
      {loading ? <LoadingTable /> : sessions.length === 0 ? (
        <EmptyState icon={CalendarClock} title="Sin sesiones próximas" description="No hay sesiones programadas en fechas futuras." />
      ) : (
        <Card className="shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Profesor</TableHead>
                <TableHead>Salón</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s.id} className="hover:bg-secondary/60 transition-colors duration-150">
                  <TableCell className="font-mono">{s.date}</TableCell>
                  <TableCell className="font-mono text-sm">{s.start_time} - {s.end_time}</TableCell>
                  <TableCell className="font-medium">{s.course_name || '-'}</TableCell>
                  <TableCell>{s.teacher_name || '-'}</TableCell>
                  <TableCell>{s.classroom_name || '-'}</TableCell>
                  <TableCell>
                    {s.recovered ? (
                      <Badge variant="outline" className="border-orange-500 text-orange-600">Recuperación</Badge>
                    ) : (
                      <Badge variant="secondary">Normal</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/asistencia?session=${s.id}`)}>
                      <ClipboardCheck className="h-4 w-4 mr-1" /> Asistencia
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}