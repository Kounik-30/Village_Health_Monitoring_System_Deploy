import nodemailer from 'nodemailer'

function getMailConfig() {
  return {
    user: String(process.env.EMAIL_USER || '').trim(),
    pass: String(process.env.EMAIL_PASS || '').trim(),
    // to: String(process.env.CONTACT_RECEIVER_EMAIL || '').trim(),
    to: null,
    service: String(process.env.EMAIL_SERVICE || 'gmail').trim(),
  }
}

function ensureMailConfig(config) {
  // if (!config.to) {
  //   const error = new Error('Contact receiver email is not configured')
  //   error.statusCode = 500
  //   throw error
  // }

  if (!config.user || !config.pass) {
    const error = new Error('Email credentials are not configured')
    error.statusCode = 500
    throw error
  }
}

function createTransport(config) {
  return nodemailer.createTransport({
    service: config.service,
    auth: {
      user: config.user,
      pass: config.pass
    }
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
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeSubject = escapeHtml(subject)
  const safeMessage = escapeHtml(message).replaceAll('\n', '<br />')

  await transporter.sendMail({
    from: config.user,
    // to: config.to,
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
