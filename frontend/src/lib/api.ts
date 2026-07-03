const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ll_token') : null;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new ApiError(res.status, data.message || 'Request failed');
  return data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// Auth helpers
export const authApi = {
  login: (email: string, password: string) => api.post<{ success: boolean; token: string; user: { id: string; name: string; email: string; role: string } }>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string, role = 'parent') =>
    api.post<{ success: boolean; token: string; user: { id: string; name: string; email: string; role: string } }>('/auth/register', { name, email, password, role }),
  forgotPassword: (email: string) =>
    api.post<{ success: boolean; message: string; resetUrl?: string }>('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post<{ success: boolean; token: string; user: { id: string; name: string; email: string; role: string } }>('/auth/reset-password', { token, password }),
  me: () => api.get('/auth/me'),
  toggleUserActive: (id: string) => api.patch<{ success: boolean; data: { id: string; active: boolean } }>(`/auth/users/${id}/toggle-active`),
};

// Lessons
export const lessonsApi = {
  list: (params?: Record<string, string>) => {
    const cleaned = params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '')) : {};
    const qs = Object.keys(cleaned).length ? '?' + new URLSearchParams(cleaned).toString() : '';
    return api.get(`/lessons${qs}`);
  },
  get: (id: string) => api.get(`/lessons/${id}`),
  create: (body: unknown) => api.post('/lessons', body),
  update: (id: string, body: unknown) => api.put(`/lessons/${id}`, body),
  publish: (id: string) => api.patch(`/lessons/${id}/publish`),
  unpublish: (id: string) => api.patch(`/lessons/${id}/unpublish`),
  clone: (id: string) => api.post(`/lessons/${id}/clone`, {}),
  bulkAction: (ids: string[], action: 'publish' | 'archive') => api.post('/lessons/bulk', { ids, action }),
  formats: () => api.get('/lessons/formats'),
  stats: () => api.get('/lessons/stats'),
  tags: () => api.get('/lessons/tags'),
  generateScript: (id: string) =>
    api.post<{ success: boolean; data: { scriptText: string } }>(`/lessons/${id}/generate-script`, {}),
};

// Schools
export const schoolsApi = {
  list: () => api.get('/schools'),
  create: (body: { name: string; contactEmail: string; city?: string; state?: string; plan?: string }) =>
    api.post('/schools', body),
  update: (id: string, body: { name?: string; contactEmail?: string; city?: string; state?: string; plan?: string; region?: string }) =>
    api.put(`/schools/${id}`, body),
  toggleActive: (id: string) => api.patch(`/schools/${id}/toggle-active`),
};

// Compilations
export const compilationsApi = {
  list: (grade?: string) => api.get(`/compilations${grade ? `?grade=${grade}` : ''}`),
  listAll: () => api.get('/compilations?all=true'),
  get: (id: string) => api.get(`/compilations/${id}`),
  create: (body: unknown) => api.post('/compilations', body),
  update: (id: string, body: unknown) => api.put(`/compilations/${id}`, body),
  togglePublish: (id: string) => api.patch(`/compilations/${id}/publish`),
  delete: (id: string) => api.delete(`/compilations/${id}`),
  autoGenerate: () => api.post('/compilations/auto-generate', {}),
};

// Calendar
export const calendarApi = {
  suggest: (params?: { region?: string; weekOf?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return api.get(`/calendar/suggest${qs}`);
  },
  list: (region?: string) => api.get(`/calendar${region ? `?region=${region}` : ''}`),
};

// Subjects
export const subjectsApi = {
  list: (grade?: string) => api.get(`/subjects${grade ? `?grade=${grade}` : ''}`),
};

// Children
export const childrenApi = {
  list: (grade?: string) => api.get(`/children${grade ? `?grade=${grade}` : ''}`),
  mine: () => api.get('/children/mine'),
  get: (id: string) => api.get(`/children/${id}`),
  create: (body: { name: string; grade: string; avatar: string }) => api.post('/children', body),
  update: (id: string, body: { name?: string; avatar?: string }) => api.patch(`/children/${id}`, body),
  claim: (id: string) => api.post(`/children/${id}/claim`, {}),
  recordWatch: (childId: string, lessonId: string, completedPercent: number) =>
    api.patch(`/children/${childId}/watch`, { lessonId, completedPercent }),
};

// Activities
export const activitiesApi = {
  forLesson: (lessonId: string) => api.get(`/activities?lesson=${lessonId}`),
  get: (id: string) => api.get(`/activities/${id}`),
  create: (body: unknown) => api.post('/activities', body),
  update: (id: string, body: unknown) => api.put(`/activities/${id}`, body),
  delete: (id: string) => api.delete(`/activities/${id}`),
  submit: (id: string, childId: string, answers: number[]) =>
    api.post(`/activities/${id}/submit`, { childId, answers }),
  regenerate: (lessonId: string) => api.post(`/activities/lesson/${lessonId}/regenerate`, {}),
};

// Achievements
export const achievementsApi = {
  list: () => api.get('/achievements'),
  forChild: (childId: string) => api.get(`/achievements/child/${childId}`),
};
