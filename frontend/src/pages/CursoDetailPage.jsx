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

// Day-of-week mapping removed per Correcciones.md; schedule now contains start/end times only

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

  const getLocalTodayIso = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  };

  const todayIso = getLocalTodayIso();
  const historySessions = sessions.filter(s => s?.date && s.date <= todayIso);
  const historyByType = historySessions.reduce((acc, s) => {
    const typeName = s?.class_type_name || 'Sin tipo';
    if (!acc[typeName]) acc[typeName] = { total: 0, recovered: 0 };
    acc[typeName].total += 1;
    if (s?.recovered) acc[typeName].recovered += 1;
    return acc;
  }, {});
  const historyRows = Object.entries(historyByType)
    .map(([typeName, v]) => ({ typeName, total: v.total, recovered: v.recovered }))
    .sort((a, b) => (b.total - a.total) || a.typeName.localeCompare(b.typeName));

  const formatSchedule = (schedule) => {
    if (!schedule) return 'Sin horario';
    return `${schedule.start_time} - ${schedule.end_time}`;
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
        description={/* description simplified due to schema changes */ ''}
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

      <Card className="shadow-sm mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" /> Historial por tipo de clase
          </CardTitle>
          <Badge variant="outline" className="font-mono">
            {historySessions.length} realizadas
          </Badge>
        </CardHeader>
        <CardContent>
          {historyRows.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Sin historial"
              description="Todavía no hay sesiones con fecha hasta hoy para este curso."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de clase</TableHead>
                  <TableHead className="text-right">Sesiones</TableHead>
                  <TableHead className="text-right">Recuperación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyRows.map(r => (
                  <TableRow key={r.typeName}>
                    <TableCell className="font-medium">
                      <Badge variant="secondary">{r.typeName}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{r.total}</TableCell>
                    <TableCell className="text-right font-mono">
                      {r.recovered > 0 ? (
                        <Badge variant="outline" className="border-orange-500 text-orange-600 font-mono">
                          {r.recovered}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Se cuentan solo sesiones con fecha hasta hoy ({todayIso}). “Recuperación” incluye sesiones marcadas como recuperación.
          </p>
        </CardContent>
      </Card>

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
                      <TableHead>Tipo de clase</TableHead>
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
                          <Badge variant="secondary">{s.class_type_name || '-'}</Badge>
                        </TableCell>
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
