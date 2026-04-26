import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { classesAPI, studentsAPI } from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingTable } from '../components/common/LoadingTable';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { ArrowLeft, Users, Plus, UserMinus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ClaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSuperuser } = useAuth();
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [unenrollTarget, setUnenrollTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [cls, sts, allSts] = await Promise.all([
        classesAPI.get(id),
        classesAPI.students(id),
        studentsAPI.list(),
      ]);
      setClassData(cls.data);
      setStudents(sts.data);
      setAllStudents(allSts.data);
    } catch { toast.error('Error al cargar detalle de clase'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const enrolledIds = new Set(students.map(s => s.student_id));
  const availableStudents = allStudents.filter(s => !enrolledIds.has(s.id));

  const handleEnroll = async () => {
    if (!selectedStudent) { toast.error('Selecciona un alumno'); return; }
    setEnrolling(true);
    try {
      await studentsAPI.enroll(selectedStudent, { class_id: id });
      toast.success('Alumno inscripto correctamente');
      setEnrollOpen(false);
      setSelectedStudent('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al inscribir');
    }
    setEnrolling(false);
  };

  const handleUnenroll = async () => {
    try {
      await studentsAPI.unenroll(unenrollTarget.student_id, id);
      toast.success('Alumno desinscripto');
      setUnenrollTarget(null);
      load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  if (loading) return <LoadingTable rows={6} cols={4} />;
  if (!classData) return <EmptyState title="Clase no encontrada" />;

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate('/clases')} className="mb-4 gap-2">
        <ArrowLeft className="h-4 w-4" /> Volver a clases
      </Button>

      <PageHeader
        title={classData.name}
        description={`${classData.class_type_name || ''} • ${classData.teacher_name || ''}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Cupos</p>
            <p className="text-2xl font-semibold">{classData.enrolled_count || 0} / {classData.max_students}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Fecha inicio</p>
            <p className="text-lg font-mono">{classData.start_date || 'Sin definir'}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Fecha fin</p>
            <p className="text-lg font-mono">{classData.end_date || 'Sin definir'}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm" data-testid="class-detail-enrolled-students-table">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" /> Alumnos inscriptos ({students.length})</CardTitle>
          <Button size="sm" onClick={() => setEnrollOpen(true)} data-testid="enroll-student-button">
            <Plus className="h-4 w-4 mr-1" /> Inscribir alumno
          </Button>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <EmptyState icon={Users} title="Sin alumnos" description="No hay alumnos inscriptos en esta clase aún." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Fecha inscripción</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.student_name}</TableCell>
                    <TableCell>{s.student_email || '-'}</TableCell>
                    <TableCell className="font-mono text-sm">{s.enrollment_date}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setUnenrollTarget(s)}>
                        <UserMinus className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Enroll Dialog */}
      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Inscribir alumno</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Alumno</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar alumno" /></SelectTrigger>
                <SelectContent>
                  {availableStudents.map(s => <SelectItem key={s.id} value={s.id}>{s.name} {s.email ? `(${s.email})` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEnrollOpen(false)}>Cancelar</Button>
            <Button onClick={handleEnroll} disabled={enrolling}>
              {enrolling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} Inscribir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!unenrollTarget}
        onOpenChange={() => setUnenrollTarget(null)}
        title="Desinscribir alumno"
        description={`¿Estás seguro de desinscribir a "${unenrollTarget?.student_name}" de esta clase?`}
        onConfirm={handleUnenroll}
      />
    </div>
  );
}
