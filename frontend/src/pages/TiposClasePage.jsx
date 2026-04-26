import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { classTypesAPI } from '../api/client';
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
import { Textarea } from '../components/ui/textarea';
import { Plus, Pencil, Trash2, Layers, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TiposClasePage() {
  const { isSuperuser } = useAuth();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const load = async () => {
    setLoading(true);
    try { const res = await classTypesAPI.list(); setTypes(res.data); } catch { toast.error('Error al cargar tipos'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '' }); setModalOpen(true); };
  const openEdit = (t) => { setEditing(t); setForm({ name: t.name, description: t.description || '' }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      if (editing) { await classTypesAPI.update(editing.id, form); toast.success('Tipo actualizado'); }
      else { await classTypesAPI.create(form); toast.success('Tipo creado'); }
      setModalOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try { await classTypesAPI.delete(deleteTarget.id); toast.success('Tipo desactivado'); setDeleteTarget(null); load(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  return (
    <div>
      <PageHeader title="Tipos de Clase" description="Gestiona las categorías de clases" actions={isSuperuser && <Button onClick={openCreate} data-testid="class-types-create-button"><Plus className="h-4 w-4 mr-2" /> Nuevo tipo</Button>} />

      {loading ? <LoadingTable /> : types.length === 0 ? (
        <EmptyState icon={Layers} title="Sin tipos" description="No hay tipos de clase registrados." />
      ) : (
        <Card className="shadow-sm" data-testid="class-types-table">
          <Table>
            <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {types.map(t => (
                <TableRow key={t.id} className="hover:bg-secondary/60 transition-colors duration-150">
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.description || '-'}</TableCell>
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
          <DialogHeader><DialogTitle>{editing ? 'Editar tipo' : 'Nuevo tipo de clase'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-white" /></div>
            <div><Label>Descripción</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-white" /></div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}{editing ? 'Actualizar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Desactivar tipo" description={`¿Desactivar "${deleteTarget?.name}"?`} onConfirm={handleDelete} />
    </div>
  );
}
