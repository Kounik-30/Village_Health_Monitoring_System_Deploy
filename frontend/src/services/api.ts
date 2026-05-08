import axios from 'axios'
import type {
  AdminStats,
  AppNotification,
  Consultation,
  DiseaseInsights,
  HealthReport,
  Message,
  RegisterData,
  User
} from '../types/models'

const TOKEN_KEY = 'vh_access_token'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL 
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function normalizeDateFields<T>(value: T): T {
  return value
}

export function setAccessToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export const authApi = {
  async register(payload: RegisterData) {
    const { data } = await api.post<{ token: string; user: User }>('/auth/register', payload)
    setAccessToken(data.token)
    return normalizeDateFields(data.user)
  },
  async login(email: string, password: string) {
    const { data } = await api.post<{ token: string; user: User }>('/auth/login', { email, password })
    setAccessToken(data.token)
    return normalizeDateFields(data.user)
  },
  async me() {
    const { data } = await api.get<User>('/auth/me')
    return normalizeDateFields(data)
  },
  async logout() {
    await api.post('/auth/logout')
    setAccessToken(null)
  }
}

export const usersApi = {
  async updateProfile(payload: Partial<User>) {
    const { data } = await api.patch<User>('/users/me', payload)
    return normalizeDateFields(data)
  },
  async list(role?: string) {
    const { data } = await api.get<User[]>('/users', {
      params: role ? { role } : undefined
    })
    return normalizeDateFields(data)
  }
}

export const reportsApi = {
  async list() {
    const { data } = await api.get<HealthReport[]>('/reports')
    return normalizeDateFields(data)
  },
  async create(payload: Partial<HealthReport>) {
    const { data } = await api.post<HealthReport>('/reports', payload)
    return normalizeDateFields(data)
  },
  async respond(reportId: string, payload: { advice: string; prescription?: string; followUpDate?: Date }) {
    const { data } = await api.post<HealthReport>(`/reports/${reportId}/responses`, payload)
    return normalizeDateFields(data)
  },
  async archive(reportId: string) {
    await api.post(`/reports/${reportId}/archive`)
  },
  async remove(reportId: string) {
    await api.delete(`/reports/${reportId}`)
  },
  async assign(reportId: string, doctorId: string) {
    const { data } = await api.post<HealthReport>(`/reports/${reportId}/assign`, { doctorId })
    return normalizeDateFields(data)
  },
  async removeAssignment(reportId: string) {
    const { data } = await api.delete<HealthReport>(`/reports/${reportId}/assignment`)
    return normalizeDateFields(data)
  }
}

export const consultationsApi = {
  async list() {
    const { data } = await api.get<Consultation[]>('/consultations')
    return normalizeDateFields(data)
  },
  async listMessages(consultationId: string) {
    const { data } = await api.get<Message[]>(`/consultations/${consultationId}/messages`)
    return normalizeDateFields(data)
  },
  async sendMessage(consultationId: string, content: string) {
    const { data } = await api.post<Message>(`/consultations/${consultationId}/messages`, { content })
    return normalizeDateFields(data)
  }
}

export const notificationsApi = {
  async list() {
    const { data } = await api.get<AppNotification[]>('/notifications')
    return normalizeDateFields(data)
  },
  async markAsRead(notificationId: string) {
    const { data } = await api.patch<AppNotification>(`/notifications/${notificationId}/read`)
    return normalizeDateFields(data)
  },
  async markAllAsRead() {
    await api.patch('/notifications/read-all')
  }
}

export const adminApi = {
  async getStats() {
    const { data } = await api.get<AdminStats>('/admin/stats')
    return normalizeDateFields(data)
  },
  async getDiseaseInsights(month: string) {
    const { data } = await api.get<DiseaseInsights>('/admin/disease-insights', {
      params: { month }
    })
    return normalizeDateFields(data)
  }
}

export const translationApi = {
  async translate(text: string, targetLang: 'en' | 'bn') {
    const { data } = await api.post<{ translatedText: string }>('/translate', {
      text,
      targetLang
    })
    return data.translatedText
  },
  async translateBatch(texts: string[], targetLang: 'en' | 'bn') {
    const { data } = await api.post<Array<{ sourceText: string; translatedText: string }>>('/translate', {
      texts,
      targetLang
    })
    return data
  }
}

export const contactApi = {
  async sendMessage(payload: {
    name: string
    email: string
    subject: string
    message: string
  }) {
    const { data } = await api.post<{ message: string }>('/contact', payload)
    return data
  }
}
