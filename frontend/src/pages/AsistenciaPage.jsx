import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { sessionsAPI, coursesAPI, attendanceAPI, exportAPI } from '../api/client';
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
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ClipboardCheck, Save, Loader2, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function AsistenciaPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [currentSession, setCurrentSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await coursesAPI.list();
        setCourses(res.data);
      } catch {}
    };
    loadCourses();
  }, []);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const params = {};
        if (selectedCourse) params.course_id = selectedCourse;
        if (selectedDate) params.date = selectedDate;
        const res = await sessionsAPI.list(params);
        setSessions(res.data);
      } catch {}
    };
    loadSessions();
  }, [selectedCourse, selectedDate]);

  useEffect(() => {
    const initialSession = searchParams.get('session');
    if (initialSession && sessions.length > 0) {
      const session = sessions.find(s => s.id === initialSession);
      if (session) {
        setSelectedSession(initialSession);
        setSelectedCourse(session.course_id);
        setSelectedDate(session.date);
      }
    }
  }, [searchParams, sessions]);

  useEffect(() => {
    if (!selectedSession) { setCurrentSession(null); setStudents([]); return; }
    const session = sessions.find(s => s.id === selectedSession);
    setCurrentSession(session || null);
    
    setLoading(true);
    attendanceAPI.getForSession(selectedSession)
      .then(r => setStudents(r.data.map(s => ({ ...s, present: s.present ?? null, notes: s.notes || '' }))))
      .catch(() => toast.error('Error al cargar asistencia'))
      .finally(() => setLoading(false));
  }, [selectedSession, sessions]);

  const togglePresent = (idx) => {
    setStudents(prev => prev.map((s, i) => i === idx ? { ...s, present: s.present === true ? false : true } : s));
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
      await attendanceAPI.record(selectedSession, records);
      toast.success('Asistencia registrada correctamente');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar asistencia');
    }
    setSaving(false);
  };

  const handleSessionChange = (sessionId) => {
    setSelectedSession(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setSelectedCourse(session.course_id);
      setSelectedDate(session.date);
    }
  };

  return (
    <div>
      <PageHeader title="Asistencia" description="Registra la asistencia por sesión" />

      <Card className="shadow-sm mb-6">
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div className="w-64">
            <Label className="mb-1.5 block">Curso</Label>
            <Select value={selectedCourse} onValueChange={v => { setSelectedCourse(v); setSelectedSession(''); }} data-testid="attendance-course-select">
              <SelectTrigger className="bg-white"><SelectValue placeholder="Todos los cursos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cursos</SelectItem>
                {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <Label className="mb-1.5 block">Fecha</Label>
            <Input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setSelectedSession(''); }} className="bg-white" />
          </div>
          <div className="w-80 flex-1">
            <Label className="mb-1.5 block">Sesión</Label>
            <Select value={selectedSession} onValueChange={handleSessionChange} data-testid="attendance-session-select">
              <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar sesión" /></SelectTrigger>
              <SelectContent>
                {sessions.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">No hay sesiones</div>
                ) : (
                  sessions.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.date} | {s.start_time}-{s.end_time} | {s.course_name} | {s.classroom_name}
                      {s.recovered && ' (R)'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          {(selectedCourse || selectedDate) && (
            <Button variant="outline" size="sm" onClick={() => { setSelectedCourse(''); setSelectedDate(''); setSelectedSession(''); }}>
              Limpiar
            </Button>
          )}
        </CardContent>
      </Card>

      {currentSession && (
        <Card className="shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{currentSession.date}</span>
                <span className="text-muted-foreground">{currentSession.start_time} - {currentSession.end_time}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">|</span>
                <span className="font-medium">{currentSession.course_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">|</span>
                <span>{currentSession.classroom_name}</span>
              </div>
              {currentSession.recovered && (
                <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50">
                  Sesión de recuperación
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedSession && (
        <Card className="shadow-sm" data-testid="attendance-student-grid">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-4 w-4" /> 
              Asistencia ({students.length} alumnos)
            </CardTitle>
            <div className="flex gap-2">
              <ExportMenu onExport={(format) => exportAPI.attendance(selectedSession, format)} />
              <Button variant="secondary" size="sm" onClick={() => markAll(true)}><CheckCircle2 className="h-4 w-4 mr-1" /> Todos presentes</Button>
              <Button variant="secondary" size="sm" onClick={() => markAll(false)}><XCircle className="h-4 w-4 mr-1" /> Todos ausentes</Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <LoadingTable rows={5} cols={3} /> : students.length === 0 ? (
              <EmptyState icon={ClipboardCheck} title="Sin alumnos" description="No hay alumnos en este curso." />
            ) : (
              <div className="space-y-3">
                {students.map((s, idx) => (
                  <div key={s.student_id} className="flex items-center gap-4 p-3 rounded-lg border bg-white hover:bg-secondary/30 transition-colors duration-150">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{s.student_name}</p>
                    </div>
                    <div className="flex items-center gap-2" data-testid="attendance-student-present-toggle">
                      <span className={`text-xs px-2 py-1 rounded ${s.present === true ? 'bg-emerald-100 text-emerald-700' : s.present === false ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-muted-foreground'}`}>
                        {s.present === null ? 'Sin registrar' : s.present ? 'Presente' : 'Ausente'}
                      </span>
                      <Switch checked={s.present === true} onCheckedChange={() => togglePresent(idx)} />
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