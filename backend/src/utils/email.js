import nodemailer from 'nodemailer'

function getMailConfig() {
  return {
    user: String(process.env.EMAIL_USER || '').trim(),
    pass: String(process.env.EMAIL_PASS || '').trim(),
    to: null,
  }
}

function ensureMailConfig(config) {
  if (!config.user || !config.pass) {
    const error = new Error('Email credentials are not configured')
    error.statusCode = 500
    throw error
  }
}

function createTransport(config) {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: config.user,
      pass: config.pass
    },
    connectionTimeout: 10000
  })
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export async function sendContactEmail({ name, email, subject, message }) {
  const config = getMailConfig()

  ensureMailConfig(config)

  const transporter = createTransport(config)

  await transporter.verify()

  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeSubject = escapeHtml(subject)
  const safeMessage = escapeHtml(message).replaceAll('\n', '<br />')

  await transporter.sendMail({
    from: config.user,
    to: email,
    replyTo: email,
    subject: `[Village Health Contact] ${subject}`,
    text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="margin-bottom: 16px;">New Contact Form Message</h2>

        <p><strong>Name:</strong> ${safeName}</p>

        <p><strong>Email:</strong> ${safeEmail}</p>

        <p><strong>Subject:</strong> ${safeSubject}</p>

        <p><strong>Message:</strong></p>

        <p>${safeMessage}</p>
      </div>
    `
  })
}