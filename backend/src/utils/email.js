import nodemailer from 'nodemailer'

function getMailConfig() {
  return {
    provider: String(process.env.EMAIL_PROVIDER || '').trim().toLowerCase(),
    user: String(process.env.EMAIL_USER || '').trim(),
    pass: String(process.env.EMAIL_PASS || '').trim(),
    service: String(process.env.EMAIL_SERVICE || 'gmail').trim(),
    from: String(process.env.EMAIL_FROM || process.env.EMAIL_USER || '').trim(),
    apiKey: String(process.env.EMAIL_API_KEY || '').trim(),
    apiUrl: String(process.env.EMAIL_API_URL || 'https://api.resend.com/emails').trim(),
  }
}

function ensureMailConfig(config) {
  if (config.provider === 'api') {
    if (!config.apiKey || !config.from) {
      const error = new Error('Email API credentials are not configured')
      error.statusCode = 500
      throw error
    }

    return
  }

  if (!config.user || !config.pass || !config.from) {
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
      pass: config.pass,
    },
    connectionTimeout: Number(process.env.EMAIL_CONNECTION_TIMEOUT || 15000),
    greetingTimeout: Number(process.env.EMAIL_GREETING_TIMEOUT || 10000),
    socketTimeout: Number(process.env.EMAIL_SOCKET_TIMEOUT || 20000),
  })
}

function buildContactMessage({ config, name, email, subject, message }) {
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeSubject = escapeHtml(subject)
  const safeMessage = escapeHtml(message).replaceAll('\n', '<br />')

  return {
    from: config.from,
    to: email,
    replyTo: email,
    subject: `[Village Health Contact] ${subject}`,
    text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
    `,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="margin-bottom: 16px;">
          New Contact Form Message
        </h2>

        <p>
          <strong>Name:</strong> ${safeName}
        </p>

        <p>
          <strong>Email:</strong> ${safeEmail}
        </p>

        <p>
          <strong>Subject:</strong> ${safeSubject}
        </p>

        <p>
          <strong>Message:</strong>
        </p>

        <p>${safeMessage}</p>
      </div>
    `,
  }
}

async function sendWithApi(config, payload) {
  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: payload.from,
      to: [payload.to],
      reply_to: payload.replyTo,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    }),
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    const error = new Error(`Email API request failed with status ${response.status}${details ? `: ${details}` : ''}`)
    error.statusCode = 502
    throw error
  }
}

function augmentEmailError(error, provider) {
  if (provider === 'smtp' && error?.code === 'ETIMEDOUT' && error?.command === 'CONN') {
    const timeoutError = new Error(
      'SMTP connection timed out. On Render free instances, outbound SMTP ports are often blocked. Configure EMAIL_PROVIDER=api with an HTTP email service, or use a paid instance for SMTP.'
    )
    timeoutError.statusCode = 503
    timeoutError.cause = error
    throw timeoutError
  }

  throw error
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export async function sendContactEmail({
  name,
  email,
  subject,
  message,
}) {
  const config = getMailConfig()

  ensureMailConfig(config)
  const payload = buildContactMessage({ config, name, email, subject, message })
  const provider = config.provider === 'api' ? 'api' : 'smtp'

  try {
    if (provider === 'api') {
      await sendWithApi(config, payload)
      return
    }

    const transporter = createTransport(config)
    await transporter.sendMail(payload)
  } catch (error) {
    augmentEmailError(error, provider)
  }
}
