import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter;

function getTransporter() {
  if (!env.smtp.host) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  }

  return transporter;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export async function sendPasswordResetEmail({ to, nome, link }) {
  const mailer = getTransporter();
  const minutos = env.passwordResetExpiresMinutes;

  if (!mailer) {
    if (env.isProduction) {
      throw new Error('SMTP nao configurado: nao foi possivel enviar o email de recuperacao.');
    }

    console.log(`\n[DEV] Link de recuperacao de senha para ${to}:\n${link}\n`);
    return;
  }

  const text = [
    `Olá, ${nome}!`,
    '',
    'Recebemos um pedido para redefinir a senha da sua conta no Planeja+.',
    `Acesse o link abaixo para criar uma nova senha (válido por ${minutos} minutos):`,
    '',
    link,
    '',
    'Se você não fez esse pedido, ignore este email. Sua senha continua a mesma.',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #1f2937; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Planeja+</h2>
      <p>Olá, ${escapeHtml(nome)}!</p>
      <p>Recebemos um pedido para redefinir a senha da sua conta.</p>
      <p>
        <a href="${escapeHtml(link)}"
           style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 20px;
                  border-radius: 8px; text-decoration: none; font-weight: bold;">
          Redefinir senha
        </a>
      </p>
      <p style="color: #6b7280; font-size: 14px;">
        O link é válido por ${minutos} minutos. Se o botão não funcionar, copie e cole este endereço no navegador:<br />
        <span style="word-break: break-all;">${escapeHtml(link)}</span>
      </p>
      <p style="color: #6b7280; font-size: 14px;">
        Se você não fez este pedido, ignore este email. Sua senha continua a mesma.
      </p>
    </div>
  `;

  await mailer.sendMail({
    from: env.smtp.from,
    to,
    subject: 'Redefinição de senha - Planeja+',
    text,
    html,
  });
}
