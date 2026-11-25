import nodemailer, { type Transporter } from 'nodemailer'

export interface Mail {
  to: string
  subject: string
  text: string
}

let transport: Transporter | null | undefined

/**
 * Transactional email (verification, password reset).
 * - NUXT_SMTP_URL set → sent via SMTP (provider to be chosen, OPEN_QUESTIONS B6).
 * - Not set, in development → printed to the dev server console (links only
 *   work locally; never enabled in production).
 * - Not set, in production → throws, so the flow fails visibly instead of
 *   silently "sending" nothing.
 */
export async function sendMail(mail: Mail) {
  const { smtpUrl, mailFrom } = useRuntimeConfig()
  if (transport === undefined) transport = smtpUrl ? nodemailer.createTransport(smtpUrl) : null
  if (transport) {
    await transport.sendMail({ from: mailFrom, ...mail })
    return
  }
  if (import.meta.dev) {
    console.info(`\n[dev mail] to=${mail.to}\nsubject: ${mail.subject}\n${mail.text}\n`)
    return
  }
  throw new Error('Email is not configured (NUXT_SMTP_URL)')
}
