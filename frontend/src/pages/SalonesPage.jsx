import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { classroomsAPI, classesAPI } from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingTable } from '../components/common/LoadingTable';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Pencil, Trash2, Building2, CalendarClock, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function SalonesPage() {
  const { isSuperuser } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '' });
  // Schedule
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedules, setSchedules] = useState([]);
  const [schedLoading, setSchedLoading] = useState(false);
  const [schedModalOpen, setSchedModalOpen] = useState(false);
  const [schedForm, setSchedForm] = useState({ class_id: '', date: '', start_time: '', end_time: '' });
  const [schedEditing, setSchedEditing] = useState(null);
  const [schedDeleteTarget, setSchedDeleteTarget] = useState(null);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const [r, c] = await Promise.all([classroomsAPI.list(), classesAPI.list()]);
      setRooms(r.data);
      setClasses(c.data);
    } catch { toast.error('Error al cargar salones'); }
    setLoading(false);
  };

  const loadSchedules = async (roomId, date) => {
    setSchedLoading(true);
    try {
      const res = await classroomsAPI.schedules(roomId, date);
      setSchedules(res.data);
    } catch { toast.error('Error al cargar horarios'); }
    setSchedLoading(false);
  };

  useEffect(() => { loadRooms(); }, []);
  useEffect(() => { if (selectedRoom) loadSchedules(selectedRoom.id, scheduleDate); }, [selectedRoom, scheduleDate]);

  const openCreateRoom = () => { setEditing(null); setForm({ name: '' }); setModalOpen(true); };
  const openEditRoom = (r) => { setEditing(r); setForm({ name: r.name }); setModalOpen(true); };

  const handleSaveRoom = async () => {
    if (!form.name) { toast.error('Nombre es obligatorio'); return; }
    setSaving(true);
    try {
      const payload = { name: form.name };
      if (editing) { await classroomsAPI.update(editing.id, payload); toast.success('Sal\u00f3n actualizado'); }
      else { await classroomsAPI.create(payload); toast.success('Sal\u00f3n creado'); }
      setModalOpen(false); loadRooms();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
    setSaving(false);
  };

  const handleDeleteRoom = async () => {
    try { await classroomsAPI.delete(deleteTarget.id); toast.success('Sal\u00f3n desactivado'); setDeleteTarget(null); loadRooms(); if (selectedRoom?.id === deleteTarget.id) setSelectedRoom(null); }
    catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  const openCreateSched = () => {
    setSchedEditing(null);
    setSchedForm({ class_id: '', date: scheduleDate, start_time: '', end_time: '' });
    setSchedModalOpen(true);
  };

  const openEditSched = (s) => {
    setSchedEditing(s);
    setSchedForm({ class_id: s.class_id, date: s.date, start_time: s.start_time, end_time: s.end_time });
    setSchedModalOpen(true);
  };

  const handleSaveSched = async () => {
    if (!schedForm.class_id || !schedForm.date || !schedForm.start_time || !schedForm.end_time) { toast.error('Completa todos los campos'); return; }
    setSaving(true);
    try {
      if (schedEditing) {
        await classroomsAPI.updateSchedule(schedEditing.id, schedForm);
        toast.success('Horario actualizado');
      } else {
        await classroomsAPI.createSchedule(selectedRoom.id, schedForm);
        toast.success('Horario creado');
      }
      setSchedModalOpen(false);
      loadSchedules(selectedRoom.id, scheduleDate);
    } catch (err) { toast.error(err.response?.data?.detail || 'Error al guardar horario'); }
    setSaving(false);
  };

  const handleDeleteSched = async () => {
    try { await classroomsAPI.deleteSchedule(schedDeleteTarget.id); toast.success('Horario eliminado'); setSchedDeleteTarget(null); loadSchedules(selectedRoom.id, scheduleDate); }
    catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  return (
    <div>
      <PageHeader title="Salones" description="Gestiona salones y sus horarios" actions={isSuperuser && <Button onClick={openCreateRoom}><Plus className="h-4 w-4 mr-2" /> Nuevo sal\u00f3n</Button>} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rooms list */}
        <div className="lg:col-span-5">
          {loading ? <LoadingTable rows={5} cols={3} /> : rooms.length === 0 ? <EmptyState icon={Building2} title="Sin salones" /> : (
            <Card className="shadow-sm" data-testid="classrooms-table">
              <Table>
              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                <TableBody>
                  {rooms.map(r => (
                    <TableRow key={r.id} className={`cursor-pointer hover:bg-secondary/60 transition-colors duration-150 ${selectedRoom?.id === r.id ? 'bg-accent' : ''}`} onClick={() => setSelectedRoom(r)}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-right">
                        {isSuperuser && (
                          <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => openEditRoom(r)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>

        {/* Schedule panel */}
        <div className="lg:col-span-7">
          {selectedRoom ? (
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                <CardTitle className="flex items-center gap-2 text-base"><CalendarClock className="h-4 w-4" /> Horarios de {selectedRoom.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-auto bg-white" data-testid="classroom-schedule-date" />
                  {isSuperuser && <Button size="sm" onClick={openCreateSched}><Plus className="h-4 w-4 mr-1" /> Asignar clase</Button>}
                </div>
              </CardHeader>
              <CardContent>
                {schedLoading ? <LoadingTable rows={3} cols={4} /> : schedules.length === 0 ? (
                  <EmptyState icon={CalendarClock} title="Sin horarios" description={`No hay clases programadas para ${scheduleDate}`} />
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Hora</TableHead><TableHead>Clase</TableHead><TableHead>Profesor</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {schedules.sort((a,b) => a.start_time.localeCompare(b.start_time)).map(s => (
                        <TableRow key={s.id}>
                          <TableCell className="font-mono text-sm">{s.start_time} - {s.end_time}</TableCell>
                          <TableCell className="font-medium">{s.class_name}</TableCell>
                          <TableCell>{s.teacher_name || '-'}</TableCell>
                          <TableCell className="text-right">
                            {isSuperuser && (
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm" onClick={() => openEditSched(s)}><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm" onClick={() => setSchedDeleteTarget(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-dashed"><CardContent className="py-12 text-center text-muted-foreground">Selecciona un sal\u00f3n para ver sus horarios</CardContent></Card>
          )}
        </div>
      </div>

      {/* Room Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar sal\u00f3n' : 'Nuevo sal\u00f3n'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-white" /></div>
            
            
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveRoom} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}{editing ? 'Actualizar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Modal */}
      <Dialog open={schedModalOpen} onOpenChange={setSchedModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{schedEditing ? 'Editar horario' : 'Asignar clase al sal\u00f3n'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Clase *</Label>
              <Select value={schedForm.class_id} onValueChange={v => setSchedForm({...schedForm, class_id: v})}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar clase" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Fecha *</Label><Input type="date" value={schedForm.date} onChange={e => setSchedForm({...schedForm, date: e.target.value})} className="bg-white" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Hora inicio *</Label><Input type="time" value={schedForm.start_time} onChange={e => setSchedForm({...schedForm, start_time: e.target.value})} className="bg-white" /></div>
              <div><Label>Hora fin *</Label><Input type="time" value={schedForm.end_time} onChange={e => setSchedForm({...schedForm, end_time: e.target.value})} className="bg-white" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSchedModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveSched} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}{schedEditing ? 'Actualizar' : 'Asignar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Desactivar sal\u00f3n" description={`\u00bfDesactivar "${deleteTarget?.name}"?`} onConfirm={handleDeleteRoom} />
      <ConfirmDialog open={!!schedDeleteTarget} onOpenChange={() => setSchedDeleteTarget(null)} title="Eliminar horario" description="\u00bfEliminar este horario del sal\u00f3n?" onConfirm={handleDeleteSched} />
    </div>
  );
}
