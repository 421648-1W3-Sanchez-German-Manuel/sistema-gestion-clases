import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursesAPI, studentsAPI, sessionsAPI } from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingTable } from '../components/common/LoadingTable';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { ArrowLeft, Users, Plus, UserMinus, Loader2, Calendar, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
];

export default function CursoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSuperuser, isAdmin } = useAuth();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [activeTab, setActiveTab] = useState('students');

  const load = async () => {
    setLoading(true);
    try {
      const [courseRes, sts, sessionsRes, allSts] = await Promise.all([
        coursesAPI.get(id),
        coursesAPI.students(id),
        coursesAPI.sessions(id),
        studentsAPI.list(),
      ]);
      setCourse(courseRes.data);
      setStudents(sts.data);
      setSessions(sessionsRes.data);
      setAllStudents(allSts.data);
    } catch { toast.error('Error al cargar detalle del curso'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const enrolledIds = new Set(students.map(s => s.id));
  const availableStudents = allStudents.filter(s => !enrolledIds.has(s.id) && !s.course_id);

  const formatSchedule = (schedule) => {
    if (!schedule) return 'Sin horario';
    const day = DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week)?.label || schedule.day_of_week;
    return `${day} ${schedule.start_time} - ${schedule.end_time}`;
  };

  const handleAddStudent = async () => {
    if (!selectedStudent) { toast.error('Selecciona un alumno'); return; }
    setAddingStudent(true);
    try {
      await studentsAPI.update(selectedStudent, { course_id: id });
      toast.success('Alumno añadido al curso');
      setAddStudentOpen(false);
      setSelectedStudent('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al añadir');
    }
    setAddingStudent(false);
  };

  const handleRemoveStudent = async () => {
    try {
      await studentsAPI.update(removeTarget.id, { course_id: null });
      toast.success('Alumno eliminado del curso');
      setRemoveTarget(null);
      load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  if (loading) return <LoadingTable rows={6} cols={4} />;
  if (!course) return <EmptyState title="Curso no encontrado" />;

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate('/cursos')} className="mb-4 gap-2">
        <ArrowLeft className="h-4 w-4" /> Volver a cursos
      </Button>

      <PageHeader
        title={course.name}
        description={`${course.class_type_name || ''} • ${course.teacher_name || ''}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Alumnos</p>
            <p className="text-2xl font-semibold">{course.student_count || 0} / {course.max_students}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Mes de inicio</p>
            <p className="text-lg font-mono">{course.start_month || 'Sin definir'}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm md:col-span-2">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Horario</p>
            <p className="text-lg">{formatSchedule(course.schedule)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="students" className="gap-1">
            <Users className="h-4 w-4" /> Alumnos ({students.length})
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-1">
            <Calendar className="h-4 w-4" /> Sesiones ({sessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" /> Alumnos del curso
              </CardTitle>
              {(isSuperuser || isAdmin) && (
                <Button size="sm" onClick={() => setAddStudentOpen(true)} data-testid="add-student-button">
                  <Plus className="h-4 w-4 mr-1" /> Añadir alumno
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <EmptyState icon={Users} title="Sin alumnos" description="No hay alumnos en este curso aún." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alumno</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.email || '-'}</TableCell>
                        <TableCell>{s.phone || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/alumnos/${s.id}`)}>
                            <BookOpen className="h-4 w-4" />
                          </Button>
                          {(isSuperuser || isAdmin) && (
                            <Button variant="ghost" size="sm" onClick={() => setRemoveTarget(s)}>
                              <UserMinus className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" /> Sesiones del curso
              </CardTitle>
              {(isSuperuser || isAdmin) && (
                <Button size="sm" onClick={() => navigate('/sesiones?new_course=' + id)}>
                  <Plus className="h-4 w-4 mr-1" /> Crear sesión
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <EmptyState icon={Calendar} title="Sin sesiones" description="No hay sesiones creadas para este curso aún." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead>Salón</TableHead>
                      <TableHead>Recuperación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono">{s.date}</TableCell>
                        <TableCell className="font-mono text-sm">{s.start_time} - {s.end_time}</TableCell>
                        <TableCell>{s.classroom_name || '-'}</TableCell>
                        <TableCell>
                          {s.recovered && <Badge variant="outline" className="border-orange-500 text-orange-600">Recuperación</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/asistencia?session=${s.id}`)}>
                            <BookOpen className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Añadir alumno al curso</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Alumno (sin curso asignado)</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar alumno" /></SelectTrigger>
                <SelectContent>
                  {availableStudents.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">No hay alumnos disponibles</div>
                  ) : (
                    availableStudents.map(s => <SelectItem key={s.id} value={s.id}>{s.name} {s.email ? `(${s.email})` : ''}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAddStudentOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddStudent} disabled={addingStudent}>
              {addingStudent ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} Añadir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={() => setRemoveTarget(null)}
        title="Eliminar alumno del curso"
        description={`¿Estás seguro de eliminar a "${removeTarget?.name}" de este curso? Su historial de asistencia se mantendrá.`}
        onConfirm={handleRemoveStudent}
      />
    </div>
  );
}