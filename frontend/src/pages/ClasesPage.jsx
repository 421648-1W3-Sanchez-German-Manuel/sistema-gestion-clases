import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { classesAPI, teachersAPI, classTypesAPI } from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingTable } from '../components/common/LoadingTable';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Pencil, Trash2, Eye, BookOpen, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function ClasesPage() {
  const { isSuperuser } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classTypes, setClassTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterTeacher, setFilterTeacher] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', class_type_id: '', teacher_id: '', max_students: '', start_date: '', end_date: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [cls, tch, ct] = await Promise.all([classesAPI.list(), teachersAPI.list(), classTypesAPI.list()]);
      setClasses(cls.data);
      setTeachers(tch.data);
      setClassTypes(ct.data);
    } catch { toast.error('Error al cargar clases'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = classes.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType !== 'all' && c.class_type_id !== filterType) return false;
    if (filterTeacher !== 'all' && c.teacher_id !== filterTeacher) return false;
    return true;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', class_type_id: '', teacher_id: '', max_students: '', start_date: '', end_date: '' });
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, class_type_id: c.class_type_id, teacher_id: c.teacher_id, max_students: String(c.max_students), start_date: c.start_date || '', end_date: c.end_date || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.class_type_id || !form.teacher_id || !form.max_students) {
      toast.error('Completa los campos obligatorios'); return;
    }
    setSaving(true);
    try {
      const payload = { ...form, max_students: parseInt(form.max_students) };
      if (editing) {
        await classesAPI.update(editing.id, payload);
        toast.success('Clase actualizada');
      } else {
        await classesAPI.create(payload);
        toast.success('Clase creada');
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
      await classesAPI.delete(deleteTarget.id);
      toast.success('Clase desactivada');
      setDeleteTarget(null);
      load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error al eliminar'); }
  };

  return (
    <div>
      <PageHeader
        title="Clases"
        description="Gestiona todas las clases del sistema"
        actions={isSuperuser && (
          <Button onClick={openCreate} data-testid="classes-create-button">
            <Plus className="h-4 w-4 mr-2" /> Nueva clase
          </Button>
        )}
      />

      <Card className="shadow-sm mb-6" data-testid="classes-filters-bar">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px] bg-white"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {classTypes.map(ct => <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterTeacher} onValueChange={setFilterTeacher}>
            <SelectTrigger className="w-[180px] bg-white"><SelectValue placeholder="Profesor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los profesores</SelectItem>
              {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? <LoadingTable /> : filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No hay clases" description="No se encontraron clases con los filtros seleccionados." />
      ) : (
        <Card className="shadow-sm" data-testid="classes-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Profesor</TableHead>
                <TableHead className="text-center">Cupos</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id} className="hover:bg-secondary/60 transition-colors duration-150">
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell><Badge variant="secondary">{c.class_type_name || '-'}</Badge></TableCell>
                  <TableCell>{c.teacher_name || '-'}</TableCell>
                  <TableCell className="text-center">
                    <span className={`font-mono ${c.enrolled_count >= c.max_students ? 'text-destructive' : ''}`}>
                      {c.enrolled_count || 0}/{c.max_students}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{c.start_date || '-'}</TableCell>
                  <TableCell className="font-mono text-sm">{c.end_date || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/clases/${c.id}`)} data-testid="class-view-button">
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

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar clase' : 'Nueva clase'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-white" data-testid="class-name-input" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de clase *</Label>
                <Select value={form.class_type_id} onValueChange={v => setForm({...form, class_type_id: v})}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{classTypes.map(ct => <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Profesor *</Label>
                <Select value={form.teacher_id} onValueChange={v => setForm({...form, teacher_id: v})}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Máx. alumnos *</Label><Input type="number" value={form.max_students} onChange={e => setForm({...form, max_students: e.target.value})} className="bg-white" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Fecha inicio</Label><Input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="bg-white" /></div>
              <div><Label>Fecha fin</Label><Input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="bg-white" /></div>
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
        title="Desactivar clase"
        description={`¿Estás seguro de desactivar la clase "${deleteTarget?.name}"? Los alumnos inscriptos no se verán afectados.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
