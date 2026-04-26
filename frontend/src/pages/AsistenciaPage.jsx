import React, { useState, useEffect } from 'react';
import { classesAPI, schedulesAPI, attendanceAPI, exportAPI } from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingTable } from '../components/common/LoadingTable';
import { EmptyState } from '../components/common/EmptyState';
import { ExportMenu } from '../components/common/ExportMenu';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { ClipboardCheck, Save, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AsistenciaPage() {
  const [classes, setClasses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    classesAPI.list().then(r => setClasses(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClass) { setSchedules([]); setSelectedSchedule(''); setStudents([]); return; }
    const load = async () => {
      try {
        const res = await schedulesAPI.list({});
        const filtered = res.data.filter(s => s.class_id === selectedClass);
        filtered.sort((a,b) => `${b.date}${b.start_time}`.localeCompare(`${a.date}${a.start_time}`));
        setSchedules(filtered);
        setSelectedSchedule('');
        setStudents([]);
      } catch {}
    };
    load();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedSchedule) { setStudents([]); return; }
    setLoading(true);
    attendanceAPI.getForSchedule(selectedSchedule)
      .then(r => setStudents(r.data.map(s => ({ ...s, present: s.present ?? false, notes: s.notes || '' }))))
      .catch(() => toast.error('Error al cargar asistencia'))
      .finally(() => setLoading(false));
  }, [selectedSchedule]);

  const togglePresent = (idx) => {
    setStudents(prev => prev.map((s, i) => i === idx ? { ...s, present: !s.present } : s));
  };

  const setNotes = (idx, notes) => {
    setStudents(prev => prev.map((s, i) => i === idx ? { ...s, notes } : s));
  };

  const markAll = (present) => {
    setStudents(prev => prev.map(s => ({ ...s, present })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = students.map(s => ({ student_id: s.student_id, present: s.present, notes: s.notes }));
      await attendanceAPI.record(selectedSchedule, records);
      toast.success('Asistencia registrada correctamente');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar asistencia');
    }
    setSaving(false);
  };

  const selectedSchedObj = schedules.find(s => s.id === selectedSchedule);

  return (
    <div>
      <PageHeader title="Asistencia" description="Registra la asistencia por sesi\u00f3n" />

      <Card className="shadow-sm mb-6">
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div className="w-64">
            <Label className="mb-1.5 block">Clase</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass} data-testid="attendance-class-select">
              <SelectTrigger className="bg-white" data-testid="attendance-class-select"><SelectValue placeholder="Seleccionar clase" /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="w-80">
            <Label className="mb-1.5 block">Sesi\u00f3n (fecha/horario)</Label>
            <Select value={selectedSchedule} onValueChange={setSelectedSchedule} data-testid="attendance-schedule-select">
              <SelectTrigger className="bg-white" data-testid="attendance-schedule-select"><SelectValue placeholder="Seleccionar sesi\u00f3n" /></SelectTrigger>
              <SelectContent>
                {schedules.map(s => <SelectItem key={s.id} value={s.id}>{s.date} | {s.start_time}-{s.end_time} | {s.classroom_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedSchedule && (
        <Card className="shadow-sm" data-testid="attendance-student-grid">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-4 w-4" /> Asistencia - {selectedSchedObj?.date} ({selectedSchedObj?.start_time}-{selectedSchedObj?.end_time})</CardTitle>
            <div className="flex gap-2">
              <ExportMenu onExport={(format) => exportAPI.attendance(selectedSchedule, format)} />
              <Button variant="secondary" size="sm" onClick={() => markAll(true)}><CheckCircle2 className="h-4 w-4 mr-1" /> Todos presentes</Button>
              <Button variant="secondary" size="sm" onClick={() => markAll(false)}><XCircle className="h-4 w-4 mr-1" /> Todos ausentes</Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <LoadingTable rows={5} cols={3} /> : students.length === 0 ? (
              <EmptyState icon={ClipboardCheck} title="Sin alumnos" description="No hay alumnos inscriptos para esta sesi\u00f3n." />
            ) : (
              <div className="space-y-3">
                {students.map((s, idx) => (
                  <div key={s.student_id} className="flex items-center gap-4 p-3 rounded-lg border bg-white hover:bg-secondary/30 transition-colors duration-150">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{s.student_name}</p>
                    </div>
                    <div className="flex items-center gap-2" data-testid="attendance-student-present-toggle">
                      <span className={`text-xs ${s.present ? 'text-emerald-600' : 'text-muted-foreground'}`}>{s.present ? 'Presente' : 'Ausente'}</span>
                      <Switch checked={s.present} onCheckedChange={() => togglePresent(idx)} />
                    </div>
                    <Input placeholder="Notas..." value={s.notes} onChange={e => setNotes(idx, e.target.value)} className="w-48 bg-white text-sm" />
                  </div>
                ))}
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} disabled={saving} data-testid="attendance-save-button">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Guardar asistencia
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
