export function serializeUser(user, profile = null) {
  if (!user) return null

  return {
    id: String(user._id),
    email: user.email,
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    profilePicture: profile?.profilePicture || undefined,
    gender: profile?.gender || undefined,
    dateOfBirth: profile?.dateOfBirth || undefined,
    address: profile?.address || undefined,
    specialization: profile?.specialization || undefined,
    licenseNumber: profile?.licenseNumber || undefined,
    village: profile?.village || undefined,
    medicalHistory: profile?.medicalHistory || undefined
  }
}

export function serializeReport(report) {
  const villager = report.villager
  const villagerProfile = villager?.villagerProfile || null
  const assignedDoctor = report.assignedDoctor
  const assignedDoctorProfile = assignedDoctor?.doctorProfile || null

  return {
    id: String(report._id),
    userId: villager ? String(villager._id) : undefined,
    userName: villager?.fullName,
    userPhone: villager?.phoneNumber,
    userVillage: villagerProfile?.village,
    symptoms: report.symptoms,
    description: report.description,
    urgency: report.urgency,
    status: report.status,
    location: report.location,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    voiceMessage: report.voiceMessage,
    attachments: report.attachments || [],
    assignedDoctorId: assignedDoctor ? String(assignedDoctor._id) : undefined,
    assignedDoctorName: assignedDoctor?.fullName,
    assignedDoctorSpecialization: assignedDoctorProfile?.specialization,
    responses: (report.responses || []).map((response) => ({
      id: String(response._id),
      doctorId: String(response.doctor?._id || response.doctor),
      doctorName: response.doctor?.fullName,
      advice: response.advice,
      prescription: response.prescription,
      followUpDate: response.followUpDate,
      respondedAt: response.respondedAt || response.createdAt
    }))
  }
}

export function serializeConsultation(consultation) {
  return {
    id: String(consultation._id),
    reportId: String(consultation.report?._id || consultation.report),
    doctorId: String(consultation.doctor?._id || consultation.doctor),
    doctorName: consultation.doctor?.fullName,
    doctorSpecialization: consultation.doctor?.doctorProfile?.specialization,
    patientId: String(consultation.villager?._id || consultation.villager),
    patientName: consultation.villager?.fullName,
    status: consultation.status,
    createdAt: consultation.createdAt,
    startedAt: consultation.startedAt,
    scheduledAt: consultation.scheduledAt,
    completedAt: consultation.completedAt,
    lastMessage: consultation.lastMessage
      ? {
          content: consultation.lastMessage.content,
          timestamp: consultation.lastMessage.timestamp,
          sender: consultation.lastMessage.senderRole
        }
      : undefined
  }
}

export function serializeMessage(message) {
  return {
    id: String(message._id),
    consultationId: String(message.consultation?._id || message.consultation),
    senderId: String(message.sender?._id || message.sender),
    senderName: message.sender?.fullName,
    role: message.senderRole,
    content: message.content,
    timestamp: message.createdAt
  }
}

export function serializeNotification(notification) {
  return {
    id: String(notification._id),
    title: notification.title,
    message: notification.message,
    type: notification.type,
    timestamp: notification.createdAt,
    read: notification.read,
    userId: String(notification.user?._id || notification.user),
    data: notification.data || {}
  }
}
