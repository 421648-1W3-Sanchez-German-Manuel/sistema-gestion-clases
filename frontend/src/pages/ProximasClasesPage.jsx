import React, { useState, useEffect } from 'react';
import { classesAPI } from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingTable } from '../components/common/LoadingTable';
import { EmptyState } from '../components/common/EmptyState';
import { Card } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { CalendarClock } from 'lucide-react';
import { toast } from 'sonner';

export default function ProximasClasesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await classesAPI.upcoming();
        setClasses(res.data);
      } catch { toast.error('Error al cargar próximas clases'); }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div>
      <PageHeader title="Próximas Clases" description="Clases con horarios programados a futuro" />
      {loading ? <LoadingTable /> : classes.length === 0 ? (
        <EmptyState icon={CalendarClock} title="Sin clases próximas" description="No hay clases programadas en fechas futuras." />
      ) : (
        <Card className="shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Clase</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Profesor</TableHead>
                <TableHead>Salón</TableHead>
                <TableHead className="text-center">Cupos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c, i) => (
                <TableRow key={i} className="hover:bg-secondary/60 transition-colors duration-150">
                  <TableCell className="font-mono text-sm">{c.next_schedule_date || '-'}</TableCell>
                  <TableCell className="font-mono text-sm">{c.next_schedule_time || '-'} - {c.next_schedule_end_time || '-'}</TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell><Badge variant="secondary">{c.class_type_name || '-'}</Badge></TableCell>
                  <TableCell>{c.teacher_name || '-'}</TableCell>
                  <TableCell>{c.next_classroom_name || '-'}</TableCell>
                  <TableCell className="text-center font-mono">{c.enrolled_count || 0}/{c.max_students}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
