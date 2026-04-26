import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { teachersAPI } from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingTable } from '../components/common/LoadingTable';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Card } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Plus, Pencil, Trash2, GraduationCap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfesoresPage() {
  const { isSuperuser } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  const load = async () => {
    setLoading(true);
    try { const res = await teachersAPI.list(); setTeachers(res.data); } catch { toast.error('Error al cargar profesores'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', phone: '' }); setModalOpen(true); };
  const openEdit = (t) => { setEditing(t); setForm({ name: t.name, email: t.email || '', phone: t.phone || '' }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      if (editing) { await teachersAPI.update(editing.id, form); toast.success('Profesor actualizado'); }
      else { await teachersAPI.create(form); toast.success('Profesor creado'); }
      setModalOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try { await teachersAPI.delete(deleteTarget.id); toast.success('Profesor desactivado'); setDeleteTarget(null); load(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  return (
    <div>
      <PageHeader title="Profesores" description="Gestiona los profesores del sistema" actions={isSuperuser && <Button onClick={openCreate} data-testid="teachers-create-button"><Plus className="h-4 w-4 mr-2" /> Nuevo profesor</Button>} />

      {loading ? <LoadingTable /> : teachers.length === 0 ? (
        <EmptyState icon={GraduationCap} title="Sin profesores" description="No hay profesores registrados." />
      ) : (
        <Card className="shadow-sm" data-testid="teachers-table">
          <Table>
            <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>Teléfono</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {teachers.map(t => (
                <TableRow key={t.id} className="hover:bg-secondary/60 transition-colors duration-150">
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.email || '-'}</TableCell>
                  <TableCell>{t.phone || '-'}</TableCell>
                  <TableCell className="text-right">
                    {isSuperuser && (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(t)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar profesor' : 'Nuevo profesor'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-white" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="bg-white" /></div>
            <div><Label>Teléfono</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="bg-white" /></div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}{editing ? 'Actualizar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Desactivar profesor" description={`¿Desactivar a "${deleteTarget?.name}"?`} onConfirm={handleDelete} />
    </div>
  );
}
