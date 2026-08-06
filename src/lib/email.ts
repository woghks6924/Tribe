const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = process.env.EMAIL_FROM ?? "Tri.be <onboarding@resend.dev>";

/**
 * Resend로 이메일을 보낸다. API 키가 없으면 조용히 건너뛴다(개발 중 이메일
 * 서비스 연결 전에도 회원가입/로그인 흐름이 막히지 않도록).
 */
async function sendEmail(options: { to: string; subject: string; html: string }) {
  if (!RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY not set — skipped sending "${options.subject}" to ${options.to}`);
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: options.to,
      subject: options.subject,
      html: options.html,
    }),
  });
}

export async function sendVerificationEmail(email: string, token: string, baseUrl: string) {
  const link = `${baseUrl}/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Verify your Tri.be account",
    html: `<p>Welcome to Tri.be. Confirm your email to finish setting up your account:</p><p><a href="${link}">${link}</a></p>`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string, baseUrl: string) {
  const link = `${baseUrl}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Reset your Tri.be password",
    html: `<p>Reset your password using the link below. This link expires in 1 hour.</p><p><a href="${link}">${link}</a></p>`,
  });
}
