import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM = "EduBridge AI <noreply@edubridgegh.com>";

function buildResetEmail(resetLink: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#1B3A8A 0%,#1D4ED8 100%);padding:0;height:6px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:36px 40px 24px;">
              <img src="https://edubridgegh.com/logo-no-bg.png" alt="EduBridge AI" width="160" style="display:block;max-width:160px;height:auto;" />
            </td>
          </tr>

          <!-- Icon -->
          <tr>
            <td align="center" style="padding:0 40px 8px;">
              <div style="display:inline-block;background:#FFF3E8;border-radius:50%;width:72px;height:72px;line-height:72px;text-align:center;font-size:32px;">🔐</div>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td align="center" style="padding:16px 40px 8px;">
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#0F172A;letter-spacing:-0.5px;">Reset your password</h1>
            </td>
          </tr>

          <!-- Body text -->
          <tr>
            <td style="padding:12px 48px 32px;text-align:center;color:#475569;font-size:15px;line-height:1.7;">
              We received a request to reset your EduBridge AI password.
              Click the button below to choose a new one. This link expires in <strong>1 hour</strong>.
            </td>
          </tr>

          <!-- CTA button -->
          <tr>
            <td align="center" style="padding:0 40px 36px;">
              <a href="${resetLink}" style="display:inline-block;background:#E8722A;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:15px 40px;border-radius:10px;box-shadow:0 4px 14px rgba(232,114,42,0.4);">
                Reset my password
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:#E2E8F0;"></div>
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td style="padding:24px 48px;text-align:center;color:#94A3B8;font-size:12px;line-height:1.6;">
              If the button doesn't work, copy and paste this link into your browser:<br/>
              <a href="${resetLink}" style="color:#1B3A8A;word-break:break-all;font-size:11px;">${resetLink}</a>
            </td>
          </tr>

          <!-- Ignore notice -->
          <tr>
            <td style="padding:0 48px 24px;text-align:center;color:#94A3B8;font-size:12px;">
              If you didn't request this, you can safely ignore this email. Your password won't change.
            </td>
          </tr>

          <!-- Footer bar -->
          <tr>
            <td style="background:#F8FAFC;padding:20px 40px;border-top:1px solid #E2E8F0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:#94A3B8;font-size:11px;text-align:center;">
                    © 2026 EduBridge Educational Solutions &nbsp;·&nbsp; Ghana 🇬🇭<br/>
                    <span style="color:#CBD5E1;">Empowering the next generation of African learners</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bottom accent bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#E8722A 0%,#F59E0B 100%);padding:0;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const origin = new URL(request.url).origin;
  const redirectTo = `${origin}/reset-password`;

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const resetLink = data.properties?.action_link;
  if (!resetLink) {
    return NextResponse.json({ error: "Could not generate reset link" }, { status: 500 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: "Reset your EduBridge AI password",
      html: buildResetEmail(resetLink),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
