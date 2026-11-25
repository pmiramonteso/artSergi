import type { Mail } from './mailer'

/** Short trilingual messages (no user-controlled HTML is ever rendered). */
export const mails = {
  verify: (url: string): Omit<Mail, 'to'> => ({
    subject: 'Confirm your email · Confirma tu email · Confirma el correu',
    text: [
      `EN · Confirm your email address: ${url}`,
      `ES · Confirma tu dirección de email: ${url}`,
      `CA · Confirma la teva adreça de correu: ${url}`,
      '',
      'Sergi Tugas Art Studio',
    ].join('\n'),
  }),
  reset: (url: string): Omit<Mail, 'to'> => ({
    subject: 'Reset your password · Restablece tu contraseña · Restableix la contrasenya',
    text: [
      `EN · Reset your password (valid for 1 hour): ${url}`,
      `ES · Restablece tu contraseña (válido 1 hora): ${url}`,
      `CA · Restableix la contrasenya (vàlid 1 hora): ${url}`,
      '',
      'If you did not ask for this, ignore this email. · Si no lo has pedido, ignora este email. · Si no ho has demanat, ignora aquest correu.',
      'Sergi Tugas Art Studio',
    ].join('\n'),
  }),
}
