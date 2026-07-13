// api/_lib/mail.ts
//
// Sends transactional email (verification, password reset) via Resend.
// https://resend.com — simple REST API, no SDK dependency needed.
//
// ---- One-time setup ----
//   1. Create a free account at https://resend.com
//   2. Verify a sending domain (Domains tab) — or, for quick testing
//      only, send from their shared `onboarding@resend.dev` address
//      (works immediately, but only reliably delivers to your own
//      Resend account's verified email while testing — verify a real
//      domain before relying on this for actual users).
//   3. Create an API key (API Keys tab).
//   4. Set environment variables:
//        RESEND_API_KEY=re_...
//        RESEND_FROM_EMAIL="DevFlow Academy <no-reply@yourdomain.com>"
//      In Vercel: Project Settings -> Environment Variables (Production
//      and Preview). Locally: add to .env.local.
//
// Email sending is treated as best-effort everywhere it's used — a
// Resend outage should never block someone from registering or logging
// in, it just means they won't get that particular email right away.

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) return false

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    })
    return response.ok
  } catch {
    return false
  }
}

/** Shared minimal email chrome — keeps templates short and consistent. */
function emailShell(heading: string, bodyHtml: string): string {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; background:#2A2A2A; padding:32px 16px;">
      <div style="max-width:480px; margin:0 auto; background:#4A2F2F; border-radius:16px; padding:32px; color:#ffffff;">
        <p style="font-size:12px; letter-spacing:0.14em; text-transform:uppercase; color:#F7B731; margin:0 0 16px;">
          DevFlow Academy
        </p>
        <h1 style="font-size:22px; margin:0 0 16px; color:#ffffff;">${heading}</h1>
        <div style="font-size:14px; line-height:1.6; color:rgba(255,255,255,0.8);">
          ${bodyHtml}
        </div>
        <p style="font-size:12px; color:rgba(255,255,255,0.35); margin-top:32px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    </div>
  `
}

export function buildVerificationEmail(link: string): { subject: string; html: string } {
  return {
    subject: 'Verify your email — DevFlow Academy',
    html: emailShell(
      'Confirm your email address',
      `
        <p>Thanks for joining DevFlow Academy! Click below to verify your email address.</p>
        <p style="margin:24px 0;">
          <a href="${link}" style="background:#FF4D6D; color:#ffffff; padding:12px 24px; border-radius:10px; text-decoration:none; font-weight:600; display:inline-block;">
            Verify Email
          </a>
        </p>
        <p>This link expires in 24 hours.</p>
      `
    ),
  }
}

export function buildPasswordResetEmail(link: string): { subject: string; html: string } {
  return {
    subject: 'Reset your password — DevFlow Academy',
    html: emailShell(
      'Reset your password',
      `
        <p>We got a request to reset the password on your DevFlow Academy account. Click below to choose a new one.</p>
        <p style="margin:24px 0;">
          <a href="${link}" style="background:#FF4D6D; color:#ffffff; padding:12px 24px; border-radius:10px; text-decoration:none; font-weight:600; display:inline-block;">
            Reset Password
          </a>
        </p>
        <p>This link expires in 1 hour.</p>
      `
    ),
  }
}

export function buildGithubAccountNoticeEmail(): { subject: string; html: string } {
  return {
    subject: 'This account uses GitHub sign-in — DevFlow Academy',
    html: emailShell(
      'No password to reset',
      `
        <p>Someone requested a password reset for this email, but this DevFlow Academy account signs in with GitHub,
        not a password.</p>
        <p>Just use "Continue with GitHub" on the login screen — there's nothing to reset.</p>
      `
    ),
  }
}
