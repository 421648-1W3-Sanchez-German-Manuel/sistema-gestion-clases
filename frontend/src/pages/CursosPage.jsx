import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursesAPI, teachersAPI, classTypesAPI, exportAPI } from '../api/client';
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
import { Plus, Pencil, Trash2, Eye, BookOpen, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

// Day-of-week selections removed per Correcciones.md

export default function CursosPage() {
  const { isSuperuser } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classTypes, setClassTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    max_students: '',
    start_month: '',
    schedule_start_time: '',
    schedule_end_time: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [coursesRes, tch, ct] = await Promise.all([coursesAPI.list(), teachersAPI.list(), classTypesAPI.list()]);
      setCourses(coursesRes.data);
      setTeachers(tch.data);
      setClassTypes(ct.data);
    } catch { toast.error('Error al cargar cursos'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = courses.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const formatSchedule = (schedule) => {
    if (!schedule) return '-';
    return `${schedule.start_time} - ${schedule.end_time}`;
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      max_students: '',
      start_month: '',
      schedule_start_time: '',
      schedule_end_time: '',
    });
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name,
      max_students: String(c.max_students),
      start_month: c.start_month || '',
      schedule_start_time: c.schedule?.start_time || '',
      schedule_end_time: c.schedule?.end_time || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.max_students || !form.schedule_start_time || !form.schedule_end_time) {
      toast.error('Completa los campos obligatorios'); return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        max_students: parseInt(form.max_students),
        start_month: form.start_month || null,
        schedule: {
          start_time: form.schedule_start_time,
          end_time: form.schedule_end_time,
        },
      };
      if (editing) {
        await coursesAPI.update(editing.id, payload);
        toast.success('Curso actualizado');
      } else {
        await coursesAPI.create(payload);
        toast.success('Curso creado');
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
      await coursesAPI.delete(deleteTarget.id);
      toast.success('Curso desactivado');
      setDeleteTarget(null);
      load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error al eliminar'); }
  };

  return (
    <div>
      <PageHeader
        title="Cursos"
        description="Gestiona todos los cursos del sistema"
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu onExport={(format) => exportAPI.courses(format)} />
            {isSuperuser && (
              <Button onClick={openCreate} data-testid="courses-create-button">
                <Plus className="h-4 w-4 mr-2" /> Nuevo curso
              </Button>
            )}
          </div>
        }
      />

      <Card className="shadow-sm mb-6" data-testid="courses-filters-bar">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white" />
          </div>
        </CardContent>
      </Card>

      {loading ? <LoadingTable /> : filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No hay cursos" description="No se encontraron cursos con los filtros seleccionados." />
      ) : (
        <Card className="shadow-sm" data-testid="courses-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead className="text-center">Alumnos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id} className="hover:bg-secondary/60 transition-colors duration-150">
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm">{formatSchedule(c.schedule)}</TableCell>
                  <TableCell className="font-mono text-sm">{c.start_month || '-'}</TableCell>
                  <TableCell className="text-center">
                    <span className={`font-mono ${(c.student_count || 0) >= c.max_students ? 'text-destructive' : ''}`}>
                      {c.student_count || 0}/{c.max_students}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/cursos/${c.id}`)} data-testid="course-view-button">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {isSuperuser && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
            <DialogTitle>{editing ? 'Editar curso' : 'Nuevo curso'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-white" data-testid="course-name-input" /></div>
            <div><Label>Máx. alumnos *</Label><Input type="number" value={form.max_students} onChange={e => setForm({...form, max_students: e.target.value})} className="bg-white" /></div>
            <div><Label>Mes de inicio</Label><Input type="month" value={form.start_month} onChange={e => setForm({...form, start_month: e.target.value})} className="bg-white" /></div>
            <div className="border-t pt-4">
              <Label className="text-sm font-medium mb-3 block">Horario recurrente</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Inicio *</Label>
                  <Input type="time" value={form.schedule_start_time} onChange={e => setForm({...form, schedule_start_time: e.target.value})} className="bg-white" />
                </div>
                <div>
                  <Label className="text-xs">Fin *</Label>
                  <Input type="time" value={form.schedule_end_time} onChange={e => setForm({...form, schedule_end_time: e.target.value})} className="bg-white" />
                </div>
              </div>
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
        title="Desactivar curso"
        description={`¿Estás seguro de desactivar el curso "${deleteTarget?.name}"? Los alumnos inscritos no se verán afectados.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
