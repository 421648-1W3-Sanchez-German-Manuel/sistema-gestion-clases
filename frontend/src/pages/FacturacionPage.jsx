import React, { useEffect, useState } from 'react';
import { billingAPI, studentsAPI, exportAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
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
  const labels = {
    PENDING: 'Pendiente',
    PAID: 'Pagada',
    OVERDUE: 'Vencida',
    CANCELLED: 'Cancelada',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${map[status] || ''}`}
      data-testid="billing-status-badge"
    >
      {labels[status] || status}
    </span>
  );
};

export default function FacturacionPage() {
  const { isAdmin, isSuperuser } = useAuth();
  const canManageBilling = isAdmin || isSuperuser;

  const [bills, setBills] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [billingSettings, setBillingSettings] = useState({ monthly_amount: 0, source: 'env' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    student_id: '',
    amount: '',
    due_date: '',
    description: '',
    status: 'PENDING',
    paid_date: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const [billsResult, studentsResult, settingsResult] = await Promise.allSettled([
        billingAPI.list(params),
        studentsAPI.list(),
        billingAPI.settings.get(),
      ]);
      if (billsResult.status === 'fulfilled') {
        setBills(billsResult.value.data);
      } else {
        throw billsResult.reason;
      }
      if (studentsResult.status === 'fulfilled') {
        setStudents(studentsResult.value.data);
      }
      if (settingsResult.status === 'fulfilled') {
        setBillingSettings(settingsResult.value.data);
      } else {
        setBillingSettings((current) => ({ ...current, source: 'env' }));
      }
      if (settingsResult.status === 'rejected') {
        const status = settingsResult.reason?.response?.status;
        if (status === 404) {
          toast.error('No se pudo cargar la configuración global de facturación');
        }
      }
    } catch {
      toast.error('Error al cargar facturación');
    }
    setLoading(false);
    setSettingsLoading(false);
  };

  useEffect(() => {
    load();
  }, [filterStatus]);

  const openCreate = () => {
    setEditing(null);
    setForm({ student_id: '', amount: '', due_date: '', description: '', status: 'PENDING', paid_date: '' });
    setModalOpen(true);
  };

  const openEdit = (bill) => {
    setEditing(bill);
    setForm({
      student_id: bill.student_id,
      amount: String(bill.amount),
      due_date: bill.due_date,
      description: bill.description || '',
      status: bill.status,
      paid_date: bill.paid_date || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.amount || !form.due_date || (!editing && !form.student_id)) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await billingAPI.update(editing.id, {
          amount: parseFloat(form.amount),
          due_date: form.due_date,
          description: form.description,
        });

        if (canManageBilling && (form.status !== editing.status || (form.paid_date || '') !== (editing.paid_date || ''))) {
          await billingAPI.updateStatus(editing.id, {
            status: form.status,
            paid_date: form.paid_date || null,
          });
        }

        toast.success('Factura actualizada');
      } else {
        await billingAPI.create({
          student_id: form.student_id,
          amount: parseFloat(form.amount),
          due_date: form.due_date,
          description: form.description,
        });
        toast.success('Factura creada');
      }

      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await billingAPI.delete(deleteTarget.id);
      toast.success('Factura cancelada');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error');
    }
  };

  const handleSaveSettings = async () => {
    const nextAmount = Number(billingSettings.monthly_amount);
    if (Number.isNaN(nextAmount) || nextAmount < 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    setSavingSettings(true);
    try {
      const response = await billingAPI.settings.update({ monthly_amount: nextAmount });
      setBillingSettings((current) => ({ ...current, monthly_amount: response.data.monthly_amount }));
      toast.success(`Monto global actualizado. Se recalcularon ${response.data.updated_bills} facturas.`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al actualizar el monto global');
    }
    setSavingSettings(false);
  };

  return (
    <div>
      <PageHeader
        title="Facturación"
        description="Gestiona las facturas de los alumnos"
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu onExport={(format) => exportAPI.billingFormatted(format, filterStatus)} />
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva factura
            </Button>
          </div>
        }
      />

      <Card className="shadow-sm mb-6">
        <CardContent className="p-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div className="grid gap-3 md:grid-cols-[180px_1fr] md:items-end">
            <div>
              <Label>Monto global mensual</Label>
              <Input
                type="number"
                step="0.01"
                value={billingSettings.monthly_amount}
                disabled={!canManageBilling || settingsLoading}
                onChange={(event) => setBillingSettings({ ...billingSettings, monthly_amount: event.target.value })}
                className="bg-white"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Fuente: {billingSettings.source === 'db' ? 'Guardado en sistema' : 'Valor inicial del entorno'}
              </p>
            </div>
            {canManageBilling && (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={handleSaveSettings} disabled={savingSettings || settingsLoading}>
                  {savingSettings ? 'Guardando...' : 'Actualizar monto global'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => billingAPI.markOverdue().then(() => { toast.success('Facturas vencidas actualizadas'); load(); })}
                >
                  Actualizar vencidas
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => billingAPI.generateMonthly().then(() => { toast.success('Facturas mensuales regeneradas'); load(); })}
                >
                  Generar faltantes
                </Button>
              </div>
            )}
          </div>
          <div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingTable />
      ) : bills.length === 0 ? (
        <EmptyState icon={Receipt} title="Sin facturas" description="No hay facturas con los filtros seleccionados." />
      ) : (
        <Card className="shadow-sm" data-testid="billing-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alumno</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.id} className="hover:bg-secondary/60 transition-colors duration-150">
                  <TableCell className="font-medium">{bill.student_name}</TableCell>
                  <TableCell className="font-mono text-sm">{bill.billing_period || '-'}</TableCell>
                  <TableCell>{bill.description || '-'}</TableCell>
                  <TableCell className="font-mono">${bill.amount?.toFixed(2)}</TableCell>
                  <TableCell className="font-mono text-sm">{bill.due_date}</TableCell>
                  <TableCell>{statusBadge(bill.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(bill)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {bill.status !== 'CANCELLED' && (
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(bill)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar factura' : 'Nueva factura'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!editing && (
              <div>
                <Label>Alumno *</Label>
                <Select value={form.student_id} onValueChange={(value) => setForm({ ...form, student_id: value })}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Monto *</Label>
              <Input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
                className="bg-white"
              />
            </div>

            <div>
              <Label>Fecha vencimiento *</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(event) => setForm({ ...form, due_date: event.target.value })}
                className="bg-white"
              />
            </div>

            <div>
              <Label>Descripción</Label>
              <Input
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="bg-white"
              />
            </div>

            {editing && canManageBilling && (
              <>
                <div>
                  <Label>Estado</Label>
                  <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fecha pago</Label>
                  <Input
                    type="date"
                    value={form.paid_date}
                    onChange={(event) => setForm({ ...form, paid_date: event.target.value })}
                    className="bg-white"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
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
        title="Cancelar factura"
        description={`¿Cancelar la factura de "${deleteTarget?.student_name}" por $${deleteTarget?.amount?.toFixed(2)}?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
