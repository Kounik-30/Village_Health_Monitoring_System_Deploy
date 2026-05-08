import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'
import { translate } from '@vitalets/google-translate-api'
import { connectDatabase } from './config/database.js'
import { requireAuth, requireRole } from './middleware/auth.js'
import { Consultation } from './models/Consultation.js'
import { Message } from './models/Message.js'
import { Notification } from './models/Notification.js'
import { Report } from './models/Report.js'
import { AdminProfile, DoctorProfile, User, VillagerProfile } from './models/User.js'
import { seedDefaultUsers } from './seed.js'
import {
  buildAuthPayload,
  createRoleProfile,
  getUserProfile,
  recordActivity
} from './utils/auth.js'
import {
  serializeConsultation,
  serializeMessage,
  serializeNotification,
  serializeReport,
  serializeUser
} from './utils/serializers.js'
import { notifyUser, notifyUsersByRole } from './utils/notifications.js'
import { analyzeDiseaseInsights, getMonthRange } from './utils/diseaseInsights.js'
import { sendContactEmail } from './utils/email.js'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT || 4000)
const translationCache = new Map()

app.use(
  cors({
    origin: '*'
  })
)

app.use(express.json({ limit: '25mb' }))

app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Village Health API running'
  })
})

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)

    console.log("✅ MongoDB connected successfully")

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    })

  } catch (err) {
    console.error("❌ MongoDB connection failed:", err)
    process.exit(1)
  }
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
}

async function populateReportQuery(query) {
  return query
    .populate({ path: 'villager', populate: { path: 'villagerProfile' } })
    .populate({ path: 'assignedDoctor', populate: { path: 'doctorProfile' } })
    .populate({ path: 'responses.doctor', populate: { path: 'doctorProfile' } })
}

async function populateConsultationQuery(query) {
  return query
    .populate({ path: 'doctor', populate: { path: 'doctorProfile' } })
    .populate({ path: 'villager', populate: { path: 'villagerProfile' } })
    .populate('report')
}

function requireObjectId(id, message = 'Invalid identifier') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(message)
    error.statusCode = 400
    throw error
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    database: 'kounik_village_health_monitoring_system'
  })
})

app.post(
  '/api/contact',
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || '').trim()
    const email = String(req.body.email || '').trim()
    const subject = String(req.body.subject || '').trim()
    const message = String(req.body.message || '').trim()

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All contact form fields are required' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' })
    }

    if (message.length < 10) {
      return res.status(400).json({ message: 'Message must be at least 10 characters long' })
    }

    await sendContactEmail({ name, email, subject, message })

    res.status(201).json({
      message: 'Message sent successfully'
    })
  })
)

app.post(
  '/api/translate',
  asyncHandler(async (req, res) => {
    const targetLang = String(req.body.targetLang || 'en').trim().toLowerCase()
    const texts = Array.isArray(req.body.texts)
      ? req.body.texts
      : typeof req.body.text === 'string'
        ? [req.body.text]
        : []

    if (!['en', 'bn'].includes(targetLang)) {
      return res.status(400).json({ message: 'Unsupported target language' })
    }

    const normalizedTexts = texts
      .filter((value) => typeof value === 'string')
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 100)

    if (normalizedTexts.length === 0) {
      return res.status(400).json({ message: 'Translation text is required' })
    }

    if (targetLang === 'en') {
      const passthrough = normalizedTexts.map((sourceText) => ({
        sourceText,
        translatedText: sourceText
      }))

      return res.json(Array.isArray(req.body.texts) ? passthrough : passthrough[0])
    }

    const results = await Promise.all(
      normalizedTexts.map(async (sourceText) => {
        const cacheKey = `${targetLang}:${sourceText}`
        const cached = translationCache.get(cacheKey)
        if (cached) {
          return {
            sourceText,
            translatedText: cached
          }
        }

        try {
          const response = await translate(sourceText, { to: targetLang })
          const translatedText = response.text || sourceText
          translationCache.set(cacheKey, translatedText)

          return {
            sourceText,
            translatedText
          }
        } catch (error) {
          console.error('Translation API error:', error)
          return {
            sourceText,
            translatedText: sourceText
          }
        }
      })
    )

    return res.json(Array.isArray(req.body.texts) ? results : results[0])
  })
)

app.post(
  '/api/auth/register',
  asyncHandler(async (req, res) => {
    const {
      email,
      password,
      fullName,
      phoneNumber,
      role,
      specialization,
      licenseNumber,
      village
    } = req.body

    if (!email || !password || !fullName || !phoneNumber || !role) {
      return res.status(400).json({ message: 'Missing required registration fields' })
    }

    if (!['admin', 'doctor', 'villager'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' })
    }

    if (role === 'doctor' && (!specialization || !licenseNumber)) {
      return res.status(400).json({ message: 'Doctor registration requires specialization and license number' })
    }

    if (role === 'villager' && !village) {
      return res.status(400).json({ message: 'Villager registration requires village' })
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' })
    }

    const passwordHash = await User.hashPassword(password)
    const user = await User.create({
      email,
      passwordHash,
      fullName,
      phoneNumber,
      role,
      isActive: true,
      lastLoginAt: new Date()
    })

    await createRoleProfile({
      userId: user._id,
      role,
      profileData: req.body
    })

    await recordActivity({
      actor: user._id,
      action: 'register',
      entityType: 'user',
      entityId: user._id,
      metadata: { role }
    })

    const payload = await buildAuthPayload(user)
    res.status(201).json(payload)
  })
)

app.post(
  '/api/auth/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body

    const user = await User.findOne({ email: String(email || '').toLowerCase() })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const isValidPassword = await user.comparePassword(password || '')
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    user.lastLoginAt = new Date()
    user.isActive = true
    await user.save()

    await recordActivity({
      actor: user._id,
      action: 'login',
      entityType: 'user',
      entityId: user._id,
      metadata: { role: user.role }
    })

    const payload = await buildAuthPayload(user)
    res.json(payload)
  })
)

app.get(
  '/api/auth/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = await buildAuthPayload(req.user)
    res.json(payload.user)
  })
)

app.post(
  '/api/auth/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    req.user.isActive = false
    await req.user.save()

    await recordActivity({
      actor: req.user._id,
      action: 'logout',
      entityType: 'user',
      entityId: req.user._id,
      metadata: { role: req.user.role }
    })

    res.status(204).send()
  })
)

app.patch(
  '/api/users/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const allowedUserFields = ['email', 'fullName', 'phoneNumber']
    for (const key of allowedUserFields) {
      if (typeof req.body[key] !== 'undefined') {
        req.user[key] = req.body[key]
      }
    }
    await req.user.save()

    const profile = await getUserProfile(req.user)
    const allowedProfileFields = [
      'profilePicture',
      'gender',
      'dateOfBirth',
      'address',
      'specialization',
      'licenseNumber',
      'village',
      'medicalHistory'
    ]

    if (profile) {
      for (const key of allowedProfileFields) {
        if (typeof req.body[key] !== 'undefined') {
          profile[key] = req.body[key]
        }
      }
      await profile.save()
    }

    await recordActivity({
      actor: req.user._id,
      action: 'profile_update',
      entityType: 'user',
      entityId: req.user._id,
      metadata: { role: req.user.role }
    })

    res.json(serializeUser(req.user, profile))
  })
)

app.get(
  '/api/users',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const role = req.query.role
    const query = role ? { role } : {}
    const users = await User.find(query)
      .populate('adminProfile')
      .populate('doctorProfile')
      .populate('villagerProfile')
      .sort({ createdAt: -1 })

    res.json(
      users.map((user) =>
        serializeUser(user, user.adminProfile || user.doctorProfile || user.villagerProfile)
      )
    )
  })
)

app.get(
  '/api/admin/stats',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (_req, res) => {
    const [users, reports, consultations] = await Promise.all([
      User.find().populate('villagerProfile').populate('doctorProfile'),
      Report.find(),
      Consultation.find()
    ])

    const today = new Date()
    const chartData = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (6 - index))
      const key = date.toISOString().slice(0, 10)
      const sameDay = reports.filter(
        (report) => report.createdAt.toISOString().slice(0, 10) === key
      )

      return {
        date: key,
        totalReports: sameDay.length,
        emergencyReports: sameDay.filter((report) => report.urgency === 'emergency').length,
        resolvedReports: sameDay.filter((report) => report.status === 'resolved').length
      }
    })

    res.json({
      totalUsers: users.length,
      totalDoctors: users.filter((user) => user.role === 'doctor').length,
      totalVillagers: users.filter((user) => user.role === 'villager').length,
      totalReports: reports.length,
      pendingReports: reports.filter((report) => report.status === 'pending').length,
      emergencyReports: reports.filter(
        (report) => report.urgency === 'emergency' && report.status === 'pending'
      ).length,
      resolvedReports: reports.filter((report) => report.status === 'resolved').length,
      activeConsultations: consultations.filter((item) => item.status === 'active').length,
      respondedReports: reports.filter((report) => report.responses.length > 0).length,
      chartData
    })
  })
)

app.get(
  '/api/admin/disease-insights',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const month = String(req.query.month || '')
    const { startDate, endDate, label } = getMonthRange(month)

    const reports = await Report.find({
      createdAt: {
        $gte: startDate,
        $lt: endDate
      }
    }).select('symptoms diagnosis createdAt')

    const { diseaseCounts, dominantDisease, matchedReports } = analyzeDiseaseInsights(reports)

    await recordActivity({
      actor: req.user._id,
      action: 'admin_disease_prediction',
      entityType: 'report',
      entityId: month,
      metadata: {
        month,
        totalReports: reports.length,
        diseaseCount: diseaseCounts.length,
        dominantDisease: dominantDisease?.name || null
      }
    })

    res.json({
      month,
      label,
      totalReports: reports.length,
      matchedReports,
      diseaseCounts,
      dominantDisease
    })
  })
)

app.get(
  '/api/reports',
  requireAuth,
  asyncHandler(async (req, res) => {
    let reportQuery = {}

    if (req.user.role === 'villager') {
      reportQuery = { villager: req.user._id, archivedBy: { $ne: req.user._id } }
    } else if (req.user.role === 'doctor') {
      reportQuery = { archivedBy: { $ne: req.user._id } }
    }

    const reports = await populateReportQuery(
      Report.find(reportQuery).sort({ createdAt: -1 })
    )

    res.json(reports.map(serializeReport))
  })
)

app.post(
  '/api/reports',
  requireAuth,
  requireRole('villager', 'admin'),
  asyncHandler(async (req, res) => {
    const report = await Report.create({
      villager: req.user._id,
      symptoms: req.body.symptoms,
      description: req.body.description,
      urgency: req.body.urgency,
      location: req.body.location,
      voiceMessage: req.body.voiceMessage,
      attachments: req.body.attachments || []
    })

    const populatedReport = await populateReportQuery(Report.findById(report._id))
    const serialized = serializeReport(populatedReport)

    await Promise.all([
      notifyUsersByRole('admin', {
        title: 'New Health Report',
        message: `${req.user.fullName} submitted a ${report.urgency} report.`,
        type: report.urgency === 'emergency' ? 'emergency' : 'new_report',
        data: { reportId: serialized.id, patientId: serialized.userId, urgency: report.urgency }
      }),
      notifyUsersByRole('doctor', {
        title: 'New Health Report',
        message: `${req.user.fullName} submitted a ${report.urgency} report.`,
        type: report.urgency === 'emergency' ? 'emergency' : 'new_report',
        data: { reportId: serialized.id, patientId: serialized.userId, urgency: report.urgency }
      }),
      recordActivity({
        actor: req.user._id,
        action: 'report_create',
        entityType: 'report',
        entityId: report._id,
        metadata: { urgency: report.urgency }
      })
    ])

    res.status(201).json(serialized)
  })
)

app.post(
  '/api/reports/:reportId/archive',
  requireAuth,
  asyncHandler(async (req, res) => {
    requireObjectId(req.params.reportId, 'Invalid report id')

    const report = await Report.findById(req.params.reportId)
    if (!report) {
      return res.status(404).json({ message: 'Report not found' })
    }

    const canArchive =
      req.user.role === 'admin' ||
      String(report.villager) === String(req.user._id) ||
      String(report.assignedDoctor || '') === String(req.user._id)

    if (!canArchive) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    if (!report.archivedBy.some((userId) => String(userId) === String(req.user._id))) {
      report.archivedBy.push(req.user._id)
      await report.save()
    }

    await recordActivity({
      actor: req.user._id,
      action: 'report_archive',
      entityType: 'report',
      entityId: report._id,
      metadata: { role: req.user.role }
    })

    res.status(204).send()
  })
)

app.post(
  '/api/reports/:reportId/responses',
  requireAuth,
  requireRole('doctor'),
  asyncHandler(async (req, res) => {
    requireObjectId(req.params.reportId, 'Invalid report id')

    const report = await Report.findById(req.params.reportId)
    if (!report) {
      return res.status(404).json({ message: 'Report not found' })
    }

    if (report.assignedDoctor && String(report.assignedDoctor) !== String(req.user._id)) {
      return res.status(403).json({ message: 'This report is assigned to another doctor' })
    }

    report.responses.push({
      doctor: req.user._id,
      advice: req.body.advice,
      prescription: req.body.prescription,
      followUpDate: req.body.followUpDate
    })
    report.status = 'reviewed'
    await report.save()

    const populatedReport = await populateReportQuery(Report.findById(report._id))
    const serialized = serializeReport(populatedReport)

    await Promise.all([
      notifyUser(report.villager, {
        title: 'Doctor Response',
        message: `Dr. ${req.user.fullName} responded to your health report.`,
        type: 'consultation',
        data: { reportId: serialized.id, doctorId: String(req.user._id) }
      }),
      notifyUsersByRole('admin', {
        title: 'Doctor Responded',
        message: `Dr. ${req.user.fullName} responded to a villager report.`,
        type: 'consultation',
        data: { reportId: serialized.id, doctorId: String(req.user._id) }
      }),
      recordActivity({
        actor: req.user._id,
        action: 'report_response',
        entityType: 'report',
        entityId: report._id,
        metadata: { villagerId: String(report.villager) }
      })
    ])

    res.json(serialized)
  })
)

app.post(
  '/api/reports/:reportId/assign',
  requireAuth,
  requireRole('villager', 'admin'),
  asyncHandler(async (req, res) => {
    requireObjectId(req.params.reportId, 'Invalid report id')
    requireObjectId(req.body.doctorId, 'Invalid doctor id')

    const report = await Report.findById(req.params.reportId)
    if (!report) {
      return res.status(404).json({ message: 'Report not found' })
    }

    if (req.user.role === 'villager' && String(report.villager) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only assign doctors to your own reports' })
    }

    const selectedResponse = report.responses.find(
      (response) => String(response.doctor) === String(req.body.doctorId)
    )

    if (!selectedResponse) {
      return res.status(400).json({ message: 'Doctor must respond before assignment' })
    }

    report.assignedDoctor = req.body.doctorId
    report.status = 'active'
    await report.save()

    let consultation = await Consultation.findOne({ report: report._id })
    if (!consultation) {
      consultation = await Consultation.create({
        report: report._id,
        villager: report.villager,
        doctor: req.body.doctorId,
        status: 'active',
        startedAt: new Date(),
        lastMessage: {
          content: selectedResponse.advice,
          senderRole: 'doctor',
          timestamp: selectedResponse.respondedAt || new Date()
        }
      })

      await Message.create({
        consultation: consultation._id,
        sender: req.body.doctorId,
        senderRole: 'doctor',
        content: selectedResponse.advice,
        readBy: [req.body.doctorId]
      })
    } else {
      consultation.doctor = req.body.doctorId
      consultation.status = 'active'
      consultation.lastMessage = {
        content: selectedResponse.advice,
        senderRole: 'doctor',
        timestamp: selectedResponse.respondedAt || new Date()
      }
      await consultation.save()
    }

    const populatedReport = await populateReportQuery(Report.findById(report._id))
    const serialized = serializeReport(populatedReport)

    await Promise.all([
      notifyUser(req.body.doctorId, {
        title: 'Appointment Assigned',
        message: `${req.user.fullName} appointed you to their case.`,
        type: 'system',
        data: { reportId: serialized.id, patientId: serialized.userId, doctorId: req.body.doctorId }
      }),
      notifyUsersByRole('admin', {
        title: 'Appointment Assigned',
        message: `${req.user.fullName} assigned a doctor to a report.`,
        type: 'system',
        data: { reportId: serialized.id, patientId: serialized.userId, doctorId: req.body.doctorId }
      }),
      recordActivity({
        actor: req.user._id,
        action: 'doctor_assign',
        entityType: 'report',
        entityId: report._id,
        metadata: { doctorId: req.body.doctorId }
      })
    ])

    res.json(serialized)
  })
)

app.delete(
  '/api/reports/:reportId',
  requireAuth,
  requireRole('doctor', 'admin'),
  asyncHandler(async (req, res) => {
    requireObjectId(req.params.reportId, 'Invalid report id')

    const report = await Report.findById(req.params.reportId)
    if (!report) {
      return res.status(404).json({ message: 'Report not found' })
    }

    const consultation = await Consultation.findOne({ report: report._id })
    if (consultation) {
      await Message.deleteMany({ consultation: consultation._id })
      await Consultation.deleteOne({ _id: consultation._id })
    }

    await Report.deleteOne({ _id: report._id })

    await Promise.all([
      notifyUser(report.villager, {
        title: 'Report Deleted',
        message:
          req.user.role === 'doctor'
            ? `Dr. ${req.user.fullName} deleted a health report.`
            : `${req.user.fullName} deleted a health report.`,
        type: 'system',
        data: { reportId: String(report._id) }
      }),
      notifyUsersByRole('admin', {
        title: 'Report Deleted',
        message:
          req.user.role === 'doctor'
            ? `Dr. ${req.user.fullName} deleted a health report.`
            : `${req.user.fullName} deleted a health report.`,
        type: 'system',
        data: { reportId: String(report._id) }
      }),
      recordActivity({
        actor: req.user._id,
        action: 'report_delete',
        entityType: 'report',
        entityId: report._id,
        metadata: {
          role: req.user.role,
          urgency: report.urgency,
          status: report.status,
          hadConsultation: Boolean(consultation)
        }
      })
    ])

    res.status(204).send()
  })
)

app.delete(
  '/api/reports/:reportId/assignment',
  requireAuth,
  requireRole('doctor', 'admin'),
  asyncHandler(async (req, res) => {
    requireObjectId(req.params.reportId, 'Invalid report id')

    const report = await Report.findById(req.params.reportId)
    if (!report) {
      return res.status(404).json({ message: 'Report not found' })
    }

    if (
      req.user.role === 'doctor' &&
      String(report.assignedDoctor || '') !== String(req.user._id)
    ) {
      return res.status(403).json({ message: 'Only the assigned doctor can remove this assignment' })
    }

    const previousDoctorId = report.assignedDoctor ? String(report.assignedDoctor) : null
    report.assignedDoctor = null
    report.status = 'reviewed'
    if (!report.archivedBy.some((userId) => String(userId) === String(req.user._id))) {
      report.archivedBy.push(req.user._id)
    }
    await report.save()

    await Consultation.findOneAndUpdate(
      { report: report._id },
      { status: 'completed', completedAt: new Date() }
    )

    await Promise.all([
      notifyUser(report.villager, {
        title: 'Appointment Deleted',
        message: `Dr. ${req.user.fullName} removed their appointment for your report.`,
        type: 'system',
        data: { reportId: String(report._id), doctorId: previousDoctorId }
      }),
      notifyUsersByRole('admin', {
        title: 'Appointment Deleted',
        message: `Dr. ${req.user.fullName} removed an appointment from a report.`,
        type: 'system',
        data: { reportId: String(report._id), doctorId: previousDoctorId }
      }),
      recordActivity({
        actor: req.user._id,
        action: 'doctor_unassign',
        entityType: 'report',
        entityId: report._id,
        metadata: { doctorId: previousDoctorId }
      })
    ])

    const populatedReport = await populateReportQuery(Report.findById(report._id))
    res.json(serializeReport(populatedReport))
  })
)

app.get(
  '/api/consultations',
  requireAuth,
  asyncHandler(async (req, res) => {
    let query = {}

    if (req.user.role === 'doctor') {
      query = { doctor: req.user._id }
    } else if (req.user.role === 'villager') {
      query = { villager: req.user._id }
    }

    const consultations = await populateConsultationQuery(
      Consultation.find(query).sort({ updatedAt: -1 })
    )

    res.json(consultations.map(serializeConsultation))
  })
)

app.get(
  '/api/consultations/:consultationId/messages',
  requireAuth,
  asyncHandler(async (req, res) => {
    requireObjectId(req.params.consultationId, 'Invalid consultation id')

    const consultation = await Consultation.findById(req.params.consultationId)
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' })
    }

    const isParticipant =
      req.user.role === 'admin' ||
      String(consultation.villager) === String(req.user._id) ||
      String(consultation.doctor) === String(req.user._id)

    if (!isParticipant) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    const messages = await Message.find({ consultation: consultation._id })
      .populate('sender')
      .sort({ createdAt: 1 })

    res.json(messages.map(serializeMessage))
  })
)

app.post(
  '/api/consultations/:consultationId/messages',
  requireAuth,
  asyncHandler(async (req, res) => {
    requireObjectId(req.params.consultationId, 'Invalid consultation id')

    const consultation = await Consultation.findById(req.params.consultationId)
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' })
    }

    const isParticipant =
      req.user.role === 'admin' ||
      String(consultation.villager) === String(req.user._id) ||
      String(consultation.doctor) === String(req.user._id)

    if (!isParticipant) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    const senderRole = req.user.role === 'doctor' ? 'doctor' : 'patient'
    const message = await Message.create({
      consultation: consultation._id,
      sender: req.user._id,
      senderRole,
      content: req.body.content,
      readBy: [req.user._id]
    })

    consultation.lastMessage = {
      content: req.body.content,
      senderRole,
      timestamp: new Date()
    }
    await consultation.save()

    const recipientId =
      senderRole === 'doctor' ? consultation.villager : consultation.doctor

    await Promise.all([
      notifyUser(recipientId, {
        title: 'New Message',
        message: `${req.user.fullName} sent a new consultation message.`,
        type: 'consultation',
        data: { consultationId: String(consultation._id) }
      }),
      notifyUsersByRole('admin', {
        title: 'Consultation Message',
        message: `${req.user.fullName} sent a consultation message.`,
        type: 'consultation',
        data: { consultationId: String(consultation._id) }
      }),
      recordActivity({
        actor: req.user._id,
        action: 'message_send',
        entityType: 'consultation',
        entityId: consultation._id,
        metadata: { recipientId: String(recipientId) }
      })
    ])

    const populatedMessage = await Message.findById(message._id).populate('sender')
    res.status(201).json(serializeMessage(populatedMessage))
  })
)

app.get(
  '/api/notifications',
  requireAuth,
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.json(notifications.map(serializeNotification))
  })
)

app.patch(
  '/api/notifications/:notificationId/read',
  requireAuth,
  asyncHandler(async (req, res) => {
    requireObjectId(req.params.notificationId, 'Invalid notification id')

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, user: req.user._id },
      { read: true },
      { new: true }
    )

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' })
    }

    res.json(serializeNotification(notification))
  })
)

app.patch(
  '/api/notifications/read-all',
  requireAuth,
  asyncHandler(async (req, res) => {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true })
    await recordActivity({
      actor: req.user._id,
      action: 'notifications_mark_all_read',
      entityType: 'notification',
      entityId: req.user._id,
      metadata: {}
    })
    res.status(204).send()
  })
)

app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode || 500
  console.error(error)
  res.status(statusCode).json({
    message: error.message || 'Internal server error'
  })
})

async function start() {
  await connectDatabase()
  await seedDefaultUsers()

  app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
}

start().catch((error) => {
  console.error('Failed to start server', error)
  process.exit(1)
})
