import React, { useState, useEffect } from 'react';
import { billingAPI, studentsAPI, exportAPI } from '../api/client';
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
import { Plus, Pencil, Trash2, Receipt, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'PAID', label: 'Pagada' },
  { value: 'OVERDUE', label: 'Vencida' },
  { value: 'CANCELLED', label: 'Cancelada' },
];

const statusBadge = (status) => {
  const map = {
    PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
    PAID: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    OVERDUE: 'bg-rose-50 text-rose-700 border border-rose-200',
    CANCELLED: 'bg-slate-50 text-slate-500 border border-slate-200',
  };
  const labels = { PENDING: 'Pendiente', PAID: 'Pagada', OVERDUE: 'Vencida', CANCELLED: 'Cancelada' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${map[status] || ''}`} data-testid="billing-status-badge">{labels[status] || status}</span>;
};

export default function FacturacionPage() {
  const [bills, setBills] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ student_id: '', amount: '', due_date: '', description: '', status: 'PENDING', paid_date: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const [b, s] = await Promise.all([billingAPI.list(params), studentsAPI.list()]);
      setBills(b.data); setStudents(s.data);
    } catch { toast.error('Error al cargar facturaci\u00f3n'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterStatus]);

  const openCreate = () => { setEditing(null); setForm({ student_id: '', amount: '', due_date: '', description: '', status: 'PENDING', paid_date: '' }); setModalOpen(true); };
  const openEdit = (b) => { setEditing(b); setForm({ student_id: b.student_id, amount: String(b.amount), due_date: b.due_date, description: b.description || '', status: b.status, paid_date: b.paid_date || '' }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.amount || !form.due_date || (!editing && !form.student_id)) { toast.error('Completa los campos obligatorios'); return; }
    setSaving(true);
    try {
      if (editing) {
        await billingAPI.update(editing.id, { amount: parseFloat(form.amount), due_date: form.due_date, description: form.description, status: form.status, paid_date: form.paid_date || null });
        toast.success('Factura actualizada');
      } else {
        await billingAPI.create({ student_id: form.student_id, amount: parseFloat(form.amount), due_date: form.due_date, description: form.description });
        toast.success('Factura creada');
      }
      setModalOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try { await billingAPI.delete(deleteTarget.id); toast.success('Factura cancelada'); setDeleteTarget(null); load(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  return (
    <div>
      <PageHeader title="Facturaci\u00f3n" description="Gestiona las facturas de los alumnos" actions={
        <div className="flex items-center gap-2">
          <ExportMenu onExport={(format) => exportAPI.billingFormatted(format, filterStatus)} />
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Nueva factura</Button>
        </div>
      } />

      <Card className="shadow-sm mb-6">
        <CardContent className="p-4 flex gap-3 items-center">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px] bg-white"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>{STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="secondary" size="sm" onClick={() => billingAPI.markOverdue().then(() => { toast.success('Facturas vencidas actualizadas'); load(); })}>Actualizar vencidas</Button>
        </CardContent>
      </Card>

      {loading ? <LoadingTable /> : bills.length === 0 ? (
        <EmptyState icon={Receipt} title="Sin facturas" description="No hay facturas con los filtros seleccionados." />
      ) : (
        <Card className="shadow-sm" data-testid="billing-table">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Alumno</TableHead><TableHead>Concepto</TableHead><TableHead>Monto</TableHead><TableHead>Vencimiento</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {bills.map(b => (
                <TableRow key={b.id} className="hover:bg-secondary/60 transition-colors duration-150">
                  <TableCell className="font-medium">{b.student_name}</TableCell>
                  <TableCell>{b.description || '-'}</TableCell>
                  <TableCell className="font-mono">${b.amount?.toFixed(2)}</TableCell>
                  <TableCell className="font-mono text-sm">{b.due_date}</TableCell>
                  <TableCell>{statusBadge(b.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                      {b.status !== 'CANCELLED' && <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(b)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
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
          <DialogHeader><DialogTitle>{editing ? 'Editar factura' : 'Nueva factura'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <div><Label>Alumno *</Label>
                <Select value={form.student_id} onValueChange={v => setForm({...form, student_id: v})}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div><Label>Monto *</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="bg-white" /></div>
            <div><Label>Fecha vencimiento *</Label><Input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="bg-white" /></div>
            <div><Label>Descripci\u00f3n</Label><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-white" /></div>
            {editing && (
              <>
                <div><Label>Estado</Label>
                  <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_OPTIONS.filter(o => o.value !== 'all').map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Fecha pago</Label><Input type="date" value={form.paid_date} onChange={e => setForm({...form, paid_date: e.target.value})} className="bg-white" /></div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}{editing ? 'Actualizar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Cancelar factura" description={`\u00bfCancelar la factura de "${deleteTarget?.student_name}" por $${deleteTarget?.amount?.toFixed(2)}?`} onConfirm={handleDelete} />
    </div>
  );
}
