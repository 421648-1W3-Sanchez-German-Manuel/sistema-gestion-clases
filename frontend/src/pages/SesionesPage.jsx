import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sessionsAPI, coursesAPI, classroomsAPI, exportAPI } from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingTable } from '../components/common/LoadingTable';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportMenu } from '../components/common/ExportMenu';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Plus, Pencil, Trash2, Eye, Calendar, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function SesionesPage() {
  const { isSuperuser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterRecovered, setFilterRecovered] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    course_id: '',
    date: '',
    start_time: '',
    end_time: '',
    classroom_id: '',
    recovered: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterCourse !== 'all') params.course_id = filterCourse;
      if (filterDate) params.date = filterDate;
      if (filterRecovered !== 'all') params.recovered = filterRecovered === 'true';
      
      const [sessionsRes, coursesRes, classroomsRes] = await Promise.all([
        sessionsAPI.list(params),
        coursesAPI.list(),
        classroomsAPI.list(),
      ]);
      setSessions(sessionsRes.data);
      setCourses(coursesRes.data);
      setClassrooms(classroomsRes.data);
    } catch { toast.error('Error al cargar sesiones'); }
    setLoading(false);
  };

  useEffect(() => {
    const initialCourse = searchParams.get('new_course');
    if (initialCourse) {
      setForm(prev => ({ ...prev, course_id: initialCourse }));
      setModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => { load(); }, [filterCourse, filterDate, filterRecovered]);

  const openCreate = () => {
    const initialCourse = searchParams.get('new_course');
    setEditing(null);
    setForm({
      course_id: initialCourse || '',
      date: '',
      start_time: '',
      end_time: '',
      classroom_id: '',
      recovered: false,
    });
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      course_id: s.course_id,
      date: s.date,
      start_time: s.start_time,
      end_time: s.end_time,
      classroom_id: s.classroom_id,
      recovered: s.recovered || false,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.course_id || !form.date || !form.start_time || !form.end_time || !form.classroom_id) {
      toast.error('Completa los campos obligatorios'); return;
    }
    setSaving(true);
    try {
      const payload = {
        course_id: form.course_id,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        classroom_id: form.classroom_id,
        recovered: form.recovered,
      };
      if (editing) {
        await sessionsAPI.update(editing.id, payload);
        toast.success('Sesión actualizada');
      } else {
        await sessionsAPI.create(payload);
        toast.success('Sesión creada');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await sessionsAPI.delete(deleteTarget.id);
      toast.success('Sesión desactivada');
      setDeleteTarget(null);
      load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error al eliminar'); }
  };

  return (
    <div>
      <PageHeader
        title="Sesiones"
        description="Gestiona todas las sesiones de los cursos"
        actions={
          (isSuperuser || isAdmin) && (
            <Button onClick={openCreate} data-testid="sessions-create-button">
              <Plus className="h-4 w-4 mr-2" /> Nueva sesión
            </Button>
          )
        }
      />

      <Card className="shadow-sm mb-6" data-testid="sessions-filters-bar">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="w-[200px] bg-white"><SelectValue placeholder="Curso" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los cursos</SelectItem>
              {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input 
            type="date" 
            value={filterDate} 
            onChange={e => setFilterDate(e.target.value)} 
            className="w-[160px] bg-white"
            placeholder="Fecha"
          />
          <Select value={filterRecovered} onValueChange={setFilterRecovered}>
            <SelectTrigger className="w-[160px] bg-white"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="false">Normales</SelectItem>
              <SelectItem value="true">Recuperación</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => { setFilterCourse('all'); setFilterDate(''); setFilterRecovered('all'); }}>
            Limpiar
          </Button>
        </CardContent>
      </Card>

      {loading ? <LoadingTable /> : sessions.length === 0 ? (
        <EmptyState icon={Calendar} title="No hay sesiones" description="No se encontraron sesiones con los filtros seleccionados." />
      ) : (
        <Card className="shadow-sm" data-testid="sessions-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Salón</TableHead>
                <TableHead>Profesor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map(s => (
                <TableRow key={s.id} className="hover:bg-secondary/60 transition-colors duration-150">
                  <TableCell className="font-mono">{s.date}</TableCell>
                  <TableCell className="font-medium">{s.course_name || '-'}</TableCell>
                  <TableCell className="font-mono text-sm">{s.start_time} - {s.end_time}</TableCell>
                  <TableCell>{s.classroom_name || '-'}</TableCell>
                  <TableCell>{s.teacher_name || '-'}</TableCell>
                  <TableCell>
                    {s.recovered ? (
                      <Badge variant="outline" className="border-orange-500 text-orange-600">Recuperación</Badge>
                    ) : (
                      <Badge variant="secondary">Normal</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/asistencia?session=${s.id}`)} data-testid="session-attendance-button">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {isSuperuser && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar sesión' : 'Nueva sesión'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Curso *</Label>
              <Select value={form.course_id} onValueChange={v => setForm({...form, course_id: v})}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar curso" /></SelectTrigger>
                <SelectContent>
                  {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Fecha *</Label>
                <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="bg-white" />
              </div>
              <div>
                <Label>Inicio *</Label>
                <Input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="bg-white" />
              </div>
              <div>
                <Label>Fin *</Label>
                <Input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="bg-white" />
              </div>
            </div>
            <div>
              <Label>Salón *</Label>
              <Select value={form.classroom_id} onValueChange={v => setForm({...form, classroom_id: v})}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar salón" /></SelectTrigger>
                <SelectContent>
                  {classrooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch 
                id="recovered" 
                checked={form.recovered} 
                onCheckedChange={v => setForm({...form, recovered: v})} 
              />
              <Label htmlFor="recovered" className="text-sm">Sesión de recuperación (no valida conflictos de horario)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Desactivar sesión"
        description={`¿Estás seguro de desactivar la sesión del "${deleteTarget?.course_name}" del ${deleteTarget?.date}?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}