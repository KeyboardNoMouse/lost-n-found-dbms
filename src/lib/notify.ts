// Email notification helper
// Uses nodemailer with SMTP credentials from environment variables.
// Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in .env.local
// For a zero-config option, use Resend (https://resend.com) or Sendgrid.

import nodemailer from 'nodemailer';

function getTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_PORT === '465',
    auth: { user, pass },
  });
}

export async function sendClaimNotification(opts: {
  ownerEmail: string;
  ownerName: string;
  itemTitle: string;
  claimerName: string;
  claimerEmail: string;
  message: string;
  itemId: string;
}): Promise<void> {
  const transport = getTransport();
  if (!transport) {
    // SMTP not configured — log and skip silently so the API still works
    console.warn('[notify] SMTP not configured; skipping claim notification email');
    return;
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  await transport.sendMail({
    from,
    to: opts.ownerEmail,
    subject: `Someone claimed your item: ${opts.itemTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px">
        <h2 style="color:#C07C66">NIE Lost &amp; Found — New Claim</h2>
        <p>Hi ${opts.ownerName},</p>
        <p><strong>${opts.claimerName}</strong> (${opts.claimerEmail}) has submitted a claim on your item:</p>
        <blockquote style="border-left:3px solid #C07C66;margin:16px 0;padding:8px 16px;background:#FFF7F5">
          <strong>${opts.itemTitle}</strong>
        </blockquote>
        <p><strong>Their message:</strong></p>
        <p style="background:#F9F8F6;padding:12px;border-radius:8px">${opts.message}</p>
        <p style="margin-top:24px">
          <a href="${appUrl}/history" style="background:#C07C66;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">
            View in My History
          </a>
        </p>
        <p style="color:#8C8176;font-size:12px;margin-top:24px">NIE Lost &amp; Found — National Institute of Engineering, Mysore</p>
      </div>
    `,
  });
}
