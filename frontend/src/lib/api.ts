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
  me: () => api.get('/auth/me'),
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
  formats: () => api.get('/lessons/formats'),
};

// Compilations
export const compilationsApi = {
  list: (grade?: string) => api.get(`/compilations${grade ? `?grade=${grade}` : ''}`),
  get: (id: string) => api.get(`/compilations/${id}`),
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

// Video generation
export const videoApi = {
  generate: (lessonId: string) => api.post(`/video/generate/${lessonId}`, {}),
  templates: () => api.get('/video/formats/templates'),
};
