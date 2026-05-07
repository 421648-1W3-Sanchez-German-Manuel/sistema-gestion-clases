import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentsAPI, coursesAPI, exportAPI } from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingTable } from '../components/common/LoadingTable';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportMenu } from '../components/common/ExportMenu';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Pencil, Trash2, Eye, Users, Search, Loader2, FileSpreadsheet, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function AlumnosPage() {
  const { isSuperuser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', birth_date: '', course_id: '', guardian: null });
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const isMinor = (birthDate) => {
    if (!birthDate) return false;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age--;
    return age < 18;
  };
  
  const getErrorMessage = (err) => {
    const detail = err.response?.data?.detail;
    if (!detail) return 'Error al importar';
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      const msgs = detail.map(e => e.msg || e.message || 'Error desconocido');
      return msgs.join(', ');
    }
    return 'Error al importar';
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterCourse !== 'all') params.course_id = filterCourse;
      const [studentsRes, coursesRes] = await Promise.all([studentsAPI.list(params), coursesAPI.list()]);
      setStudents(studentsRes.data);
      setCourses(coursesRes.data);
    } catch { toast.error('Error al cargar alumnos'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, filterCourse]);

  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', phone: '', birth_date: '', course_id: '', guardian: null }); setModalOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, email: s.email || '', phone: s.phone || '', birth_date: s.birth_date || '', course_id: s.course_id || '', guardian: s.guardian || null }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.course_id === '' || payload.course_id === '__clear__') payload.course_id = null;
      if (payload.guardian && !payload.guardian.name && !payload.guardian.phone) {
        payload.guardian = null;
      }
      if (editing) { await studentsAPI.update(editing.id, payload); toast.success('Alumno actualizado'); }
      else { await studentsAPI.create(payload); toast.success('Alumno creado'); }
      setModalOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try { await studentsAPI.delete(deleteTarget.id); toast.success('Alumno desactivado'); setDeleteTarget(null); load(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  const downloadTemplate = () => {
    const headers = [['nombre', 'fecha de nacimiento', 'curso', 'mes de inicio', 'email', 'teléfono', 'nombre tutor', 'teléfono tutor']];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, 'plantilla_alumnos.xlsx');
  };

  const handleImport = async () => {
    if (!importFile) { toast.error('Selecciona un archivo'); return; }
    setImporting(true);
    try {
      const res = await studentsAPI.importExcel(importFile);
      setImportResult(res.data);
      if (res.data.created > 0) {
        toast.success(`${res.data.created} alumnos creados correctamente`);
        load();
      }
      if (res.data.failed > 0) {
        toast.warning(`${res.data.failed} filas con error`);
      }
    } catch (err) { toast.error(getErrorMessage(err)); }
    setImporting(false);
  };

  const openImportModal = () => { setImportFile(null); setImportResult(null); setImportModalOpen(true); };

  return (
    <div>
      <PageHeader title="Alumnos" description="Gestiona el registro de alumnos" actions={
        <div className="flex items-center gap-2">
          <ExportMenu onExport={(format) => exportAPI.students(format)} />
          <Button variant="outline" onClick={downloadTemplate}><Download className="h-4 w-4 mr-2" /> Plantilla</Button>
          <Button variant="outline" onClick={openImportModal}><FileSpreadsheet className="h-4 w-4 mr-2" /> Importar Excel</Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Nuevo alumno</Button>
        </div>
      } />

<Card className="shadow-sm mb-6">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre o email…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white" />
          </div>
          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="w-[200px] bg-white"><SelectValue placeholder="Todos los cursos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los cursos</SelectItem>
              {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? <LoadingTable /> : students.length === 0 ? (
        <EmptyState icon={Users} title="Sin alumnos" description="No se encontraron alumnos." />
      ) : (
<Card className="shadow-sm" data-testid="students-table">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>Teléfono</TableHead><TableHead>Curso</TableHead><TableHead>Nacimiento</TableHead><TableHead className="text-right">Acciones</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {students.map(s => (
                <TableRow key={s.id} className="hover:bg-secondary/60 transition-colors duration-150">
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.email || '-'}</TableCell>
                  <TableCell>{s.phone || '-'}</TableCell>
                  <TableCell>{s.course_name || '-'}</TableCell>
                  <TableCell className="font-mono text-sm">{s.birth_date || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/alumnos/${s.id}`)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

<Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar alumno' : 'Nuevo alumno'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-white" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="bg-white" /></div>
            <div><Label>Teléfono</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="bg-white" /></div>
            <div>
              <Label>Curso</Label>
              <Select value={form.course_id} onValueChange={v => setForm({...form, course_id: v === '__clear__' ? '' : v})}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Sin curso" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__clear__">Sin curso</SelectItem>
                  {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Fecha nacimiento</Label><Input type="date" value={form.birth_date} onChange={e => setForm({...form, birth_date: e.target.value})} className="bg-white" /></div>
            {(isMinor(form.birth_date) || !form.birth_date) && (
              <div className="border-t pt-4 mt-4">
                <Label className="text-muted-foreground">Datos del tutor (opcional)</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div><Label>Nombre del tutor</Label><Input value={form.guardian?.name || ''} onChange={e => setForm({...form, guardian: {...(form.guardian || {}), name: e.target.value}})} className="bg-white" placeholder="Nombre completo" /></div>
                  <div><Label>Teléfono del tutor</Label><Input value={form.guardian?.phone || ''} onChange={e => setForm({...form, guardian: {...(form.guardian || {}), phone: e.target.value}})} className="bg-white" placeholder="Teléfono" /></div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}{editing ? 'Actualizar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Desactivar alumno" description={`¿Desactivar a "${deleteTarget?.name}"?`} onConfirm={handleDelete} />

      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Importar alumnos desde Excel</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {!importResult ? (
              <>
                <div>
                  <Label>Archivo Excel (.xlsx o .xls)</Label>
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={e => setImportFile(e.target.files?.[0] || null)}
                    className="bg-white mt-2"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Columnas esperadas: nombre, fecha de nacimiento, curso, mes de inicio, email, teléfono, nombre tutor, teléfono tutor
                </p>
              </>
            ) : (
              <div className="space-y-4">
                {importResult.created > 0 && (
                  <div className="p-3 bg-green-50 text-green-700 rounded-md">
                    {importResult.created} alumnos creados correctamente
                  </div>
                )}
                {importResult.failed > 0 && (
                  <>
                    <div className="p-3 bg-yellow-50 text-yellow-700 rounded-md">
                      {importResult.failed} filas con error
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fila</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.errors.map((err, i) => (
                          <TableRow key={i}>
                            <TableCell>{err.row}</TableCell>
                            <TableCell>{err.reason}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setImportModalOpen(false)}>
              {importResult ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!importResult && (
              <Button onClick={handleImport} disabled={importing || !importFile}>
                {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Subir
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
