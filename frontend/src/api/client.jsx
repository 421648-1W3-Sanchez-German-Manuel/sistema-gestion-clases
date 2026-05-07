import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  withCredentials: true,
});

// Ensure FormData requests don't force a wrong Content-Type (browser must set boundary)
api.interceptors.request.use((config) => {
  if (config?.data instanceof FormData) {
    if (!config.headers) config.headers = {};
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
  }
  return config;
});

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Users
export const usersAPI = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Teachers
export const teachersAPI = {
  list: () => api.get('/teachers'),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  delete: (id) => api.delete(`/teachers/${id}`),
};

// Class Types
export const classTypesAPI = {
  list: () => api.get('/class-types'),
  create: (data) => api.post('/class-types', data),
  update: (id, data) => api.put(`/class-types/${id}`, data),
  delete: (id) => api.delete(`/class-types/${id}`),
};

// Courses
export const coursesAPI = {
  list: (params) => {
    const q = new URLSearchParams();
    if (params?.skip) q.set('skip', params.skip);
    if (params?.limit) q.set('limit', params.limit);
    return api.get(`/courses?${q.toString()}`);
  },
  get: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  students: (id) => api.get(`/courses/${id}/students`),
  sessions: (id) => api.get(`/courses/${id}/classes`),
};

// Sessions (Class Sessions)
export const sessionsAPI = {
  list: (params) => {
    const q = new URLSearchParams();
    if (params?.course_id) q.set('course_id', params.course_id);
    if (params?.date) q.set('date', params.date);
    if (params?.recovered !== undefined) q.set('recovered', params.recovered);
    return api.get(`/classes?${q.toString()}`);
  },
  upcoming: () => api.get('/classes/upcoming'),
  get: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
};

// Legacy classesAPI for backward compatibility (maps to sessionsAPI)
export const classesAPI = sessionsAPI;

// Classrooms
export const classroomsAPI = {
  list: () => api.get('/classrooms'),
  get: (id) => api.get(`/classrooms/${id}`),
  create: (data) => api.post('/classrooms', data),
  update: (id, data) => api.put(`/classrooms/${id}`, data),
  delete: (id) => api.delete(`/classrooms/${id}`),
  schedules: (id, date) => api.get(`/classrooms/${id}/schedules${date ? `?date=${date}` : ''}`),
  createSchedule: (id, data) => api.post(`/classrooms/${id}/schedules`, data),
  updateSchedule: (scheduleId, data) => api.put(`/classrooms/schedules/${scheduleId}`, data),
  deleteSchedule: (scheduleId) => api.delete(`/classrooms/schedules/${scheduleId}`),
};

// Students
export const studentsAPI = {
  list: (params) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.course_id) q.set('course_id', params.course_id);
    return api.get(`/students?${q.toString()}`);
  },
  get: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  attendance: (id) => api.get(`/students/${id}/attendance`),
  billing: (id) => api.get(`/students/${id}/billing`),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/students/import/excel', formData);
  },
};

// Attendance
export const attendanceAPI = {
  getForSession: (sessionId) => api.get(`/attendance/class/${sessionId}`),
  record: (sessionId, records) => api.post(`/attendance/class/${sessionId}`, records),
};

// Billing
export const billingAPI = {
  list: (params) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.student_id) q.set('student_id', params.student_id);
    return api.get(`/billing?${q.toString()}`);
  },
  get: (id) => api.get(`/billing/${id}`),
  create: (data) => api.post('/billing', data),
  update: (id, data) => api.put(`/billing/${id}`, data),
  delete: (id) => api.delete(`/billing/${id}`),
  markOverdue: () => api.post('/billing/mark-overdue'),
};

// Dashboard
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

// Export helper – triggers file download
export const downloadExport = async (endpoint, format, filename) => {
  try {
    const res = await api.get(endpoint, {
      params: { format },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    throw err;
  }
};

// Export endpoints
export const exportAPI = {
  students: (format) => downloadExport('/export/students', format, `alumnos.${format}`),
  courses: (format) => downloadExport('/export/classes', format, `cursos.${format}`),
  classes: (format) => downloadExport('/export/classes', format, `cursos.${format}`),
  billing: (format, status) => {
    const params = status && status !== 'all' ? `&status=${status}` : '';
    return downloadExport(`/export/billing?format=${format}${params}`, undefined, `facturacion.${format}`);
  },
  billingFormatted: (format, status) => {
    let endpoint = `/export/billing?format=${format}`;
    if (status && status !== 'all') endpoint += `&status=${status}`;
    return api.get(endpoint, { responseType: 'blob' }).then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facturacion.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  },
  attendance: (sessionId, format) => downloadExport(`/export/attendance/${sessionId}`, format, `asistencia.${format}`),
  teachers: (format) => downloadExport('/export/teachers', format, `profesores.${format}`),
};



// Response interceptor for 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect on /auth/me — AuthContext handles it by setting user to null
      if (!error.config?.url?.includes('/auth/me')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
