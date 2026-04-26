import React, { useState, useEffect } from 'react';
import { usersAPI } from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingTable } from '../components/common/LoadingTable';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Card } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Pencil, Trash2, UserCog, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function UsuariosPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'ADMIN' });

  const load = async () => {
    setLoading(true);
    try { const res = await usersAPI.list(); setUsers(res.data); } catch { toast.error('Error al cargar usuarios'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', password: '', role: 'ADMIN' }); setModalOpen(true); };
  const openEdit = (u) => { setEditing(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error('Nombre y email son obligatorios'); return; }
    if (!editing && !form.password) { toast.error('La contraseña es obligatoria para nuevos usuarios'); return; }
    setSaving(true);
    try {
      if (editing) {
        const payload = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await usersAPI.update(editing.id, payload);
        toast.success('Usuario actualizado');
      } else {
        await usersAPI.create(form);
        toast.success('Usuario creado');
      }
      setModalOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try { await usersAPI.delete(deleteTarget.id); toast.success('Usuario desactivado'); setDeleteTarget(null); load(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  return (
    <div>
      <PageHeader title="Usuarios del Sistema" description="Gestiona los usuarios con acceso al sistema (solo SUPERUSER)" actions={
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Nuevo usuario</Button>
      } />

      {loading ? <LoadingTable /> : users.length === 0 ? (
        <EmptyState icon={UserCog} title="Sin usuarios" />
      ) : (
        <Card className="shadow-sm" data-testid="system-users-table">
          <Table>
            <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>Rol</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id} className="hover:bg-secondary/60 transition-colors duration-150">
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'SUPERUSER' ? 'default' : 'secondary'}>{u.role}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(u)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-white" /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="bg-white" /></div>
            <div><Label>{editing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</Label><Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="bg-white" /></div>
            <div><Label>Rol</Label>
              <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="SUPERUSER">SUPERUSER</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}{editing ? 'Actualizar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Desactivar usuario" description={`¿Desactivar a "${deleteTarget?.name}"? No podrá acceder al sistema.`} onConfirm={handleDelete} />
    </div>
  );
}
