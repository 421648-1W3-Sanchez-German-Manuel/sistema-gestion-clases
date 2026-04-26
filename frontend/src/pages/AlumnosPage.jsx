import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentsAPI } from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingTable } from '../components/common/LoadingTable';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Plus, Pencil, Trash2, Eye, Users, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AlumnosPage() {
  const { isSuperuser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', birth_date: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await studentsAPI.list(search);
      setStudents(res.data);
    } catch { toast.error('Error al cargar alumnos'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', phone: '', birth_date: '' }); setModalOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, email: s.email || '', phone: s.phone || '', birth_date: s.birth_date || '' }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      if (editing) { await studentsAPI.update(editing.id, form); toast.success('Alumno actualizado'); }
      else { await studentsAPI.create(form); toast.success('Alumno creado'); }
      setModalOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try { await studentsAPI.delete(deleteTarget.id); toast.success('Alumno desactivado'); setDeleteTarget(null); load(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  return (
    <div>
      <PageHeader title="Alumnos" description="Gestiona el registro de alumnos" actions={
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Nuevo alumno</Button>
      } />

      <Card className="shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre o email\u2026" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white max-w-md" />
          </div>
        </CardContent>
      </Card>

      {loading ? <LoadingTable /> : students.length === 0 ? (
        <EmptyState icon={Users} title="Sin alumnos" description="No se encontraron alumnos." />
      ) : (
        <Card className="shadow-sm" data-testid="students-table">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>Tel\u00e9fono</TableHead><TableHead>Nacimiento</TableHead><TableHead className="text-right">Acciones</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {students.map(s => (
                <TableRow key={s.id} className="hover:bg-secondary/60 transition-colors duration-150">
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.email || '-'}</TableCell>
                  <TableCell>{s.phone || '-'}</TableCell>
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
            <div><Label>Tel\u00e9fono</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="bg-white" /></div>
            <div><Label>Fecha nacimiento</Label><Input type="date" value={form.birth_date} onChange={e => setForm({...form, birth_date: e.target.value})} className="bg-white" /></div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}{editing ? 'Actualizar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Desactivar alumno" description={`\u00bfDesactivar a "${deleteTarget?.name}"?`} onConfirm={handleDelete} />
    </div>
  );
}
