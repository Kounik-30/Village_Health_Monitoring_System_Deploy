export type UserRole = 'villager' | 'doctor' | 'admin'

export interface User {
  id: string
  email: string
  fullName: string
  phoneNumber: string
  role: UserRole
  createdAt: string | Date
  isActive?: boolean
  lastLoginAt?: string | Date
  profilePicture?: string
  specialization?: string
  licenseNumber?: string
  village?: string
  gender?: string
  dateOfBirth?: string
  address?: string
  medicalHistory?: string
}

export interface RegisterData {
  email: string
  password: string
  fullName: string
  phoneNumber: string
  role: UserRole
  specialization?: string
  licenseNumber?: string
  village?: string
}

export interface ReportResponse {
  id: string
  doctorId: string
  doctorName: string
  advice: string
  prescription?: string
  followUpDate?: string | Date
  respondedAt: string | Date
}

export interface Attachment {
  name: string
  mimeType: string
  dataUrl: string
  size: number
  uploadedAt: string | Date
}

export interface HealthReport {
  id: string
  userId?: string
  userName?: string
  userPhone?: string
  userVillage?: string
  symptoms: string
  description?: string
  urgency: 'low' | 'medium' | 'high' | 'emergency'
  location?: {
    latitude: number
    longitude: number
    address?: string
    text?: string
  }
  createdAt: string | Date
  updatedAt?: string | Date
  status: 'pending' | 'reviewed' | 'active' | 'resolved'
  responses?: ReportResponse[]
  assignedDoctorId?: string
  assignedDoctorName?: string
  assignedDoctorSpecialization?: string
  voiceMessage?: {
    mimeType: string
    dataUrl: string
    uploadedAt: string | Date
  }
  attachments?: Attachment[]
}

export interface Consultation {
  id: string
  reportId: string
  doctorId: string
  doctorName: string
  doctorSpecialization?: string
  patientId?: string
  patientName?: string
  status: 'active' | 'scheduled' | 'completed'
  createdAt: string | Date
  startedAt?: string | Date
  lastMessage?: {
    content: string
    timestamp: string | Date
    sender: 'doctor' | 'patient'
  }
  scheduledAt?: string | Date
  completedAt?: string | Date
}

export interface Message {
  id: string
  consultationId: string
  senderId: string
  senderName: string
  role: 'doctor' | 'patient'
  content: string
  timestamp: string | Date
}

export interface AppNotification {
  id: string
  title: string
  message: string
  type: 'emergency' | 'new_report' | 'consultation' | 'system'
  timestamp: string | Date
  read: boolean
  userId: string
  data?: Record<string, unknown>
}

export interface AdminStats {
  totalUsers: number
  totalDoctors: number
  totalVillagers: number
  totalReports: number
  pendingReports: number
  emergencyReports: number
  resolvedReports: number
  activeConsultations: number
  respondedReports: number
  chartData: Array<{
    date: string
    totalReports: number
    emergencyReports: number
    resolvedReports: number
  }>
}

export interface DiseaseInsightPoint {
  disease: string
  count: number
}

export interface DiseaseInsights {
  month: string
  label: string
  totalReports: number
  matchedReports: number
  diseaseCounts: DiseaseInsightPoint[]
  dominantDisease: {
    name: string
    count: number
  } | null
}
