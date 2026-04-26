import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
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

// Classes
export const classesAPI = {
  list: () => api.get('/classes'),
  upcoming: () => api.get('/classes/upcoming'),
  get: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
  students: (id) => api.get(`/classes/${id}/students`),
};

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
  list: (search) => api.get(`/students${search ? `?search=${search}` : ''}`),
  get: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  classes: (id) => api.get(`/students/${id}/classes`),
  enroll: (id, data) => api.post(`/students/${id}/enroll`, data),
  unenroll: (id, classId) => api.delete(`/students/${id}/enroll/${classId}`),
  attendance: (id) => api.get(`/students/${id}/attendance`),
  billing: (id) => api.get(`/students/${id}/billing`),
};

// Attendance
export const attendanceAPI = {
  getForSchedule: (scheduleId) => api.get(`/attendance/schedule/${scheduleId}`),
  record: (scheduleId, records) => api.post(`/attendance/schedule/${scheduleId}`, records),
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

// Schedules
export const schedulesAPI = {
  list: (params) => {
    const q = new URLSearchParams();
    if (params?.date_from) q.set('date_from', params.date_from);
    if (params?.date_to) q.set('date_to', params.date_to);
    return api.get(`/schedules?${q.toString()}`);
  },
};

export default api;
