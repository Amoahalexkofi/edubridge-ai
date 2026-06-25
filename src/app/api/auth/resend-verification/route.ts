import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM = "EduBridge AI <noreply@edubridgegh.com>";

function buildEmail(link: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;background:#F1F5F9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 16px;"><tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr><td style="background:linear-gradient(135deg,#1B3A8A,#1D4ED8);height:6px;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td align="center" style="padding:36px 40px 8px;"><img src="https://edubridgegh.com/logo-no-bg.png" width="160" alt="EduBridge AI" style="display:block;max-width:160px;height:auto;" /></td></tr>
      <tr><td align="center" style="padding:8px 40px;"><div style="display:inline-block;background:#EEF2FF;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:30px;">✉️</div></td></tr>
      <tr><td align="center" style="padding:12px 40px 4px;"><h1 style="margin:0;font-size:24px;font-weight:800;color:#0F172A;">Verify your email</h1></td></tr>
      <tr><td style="padding:10px 48px 28px;text-align:center;color:#475569;font-size:15px;line-height:1.7;">Confirm your email to unlock lessons, practice, mock exams and the AI Tutor.</td></tr>
      <tr><td align="center" style="padding:0 40px 36px;"><a href="${link}" style="display:inline-block;background:#1B3A8A;color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:15px 40px;border-radius:10px;">Verify my email</a></td></tr>
      <tr><td style="padding:0 48px 28px;text-align:center;color:#94A3B8;font-size:12px;">If the button doesn't work, paste this link into your browser:<br/><a href="${link}" style="color:#1B3A8A;word-break:break-all;font-size:11px;">${link}</a></td></tr>
      <tr><td style="background:#F8FAFC;padding:20px;border-top:1px solid #E2E8F0;text-align:center;color:#94A3B8;font-size:11px;">© 2026 EduBridge Educational Solutions · Ghana 🇬🇭</td></tr>
    </table>
  </td></tr></table></body></html>`;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.user_metadata?.app_verified === true) {
    return NextResponse.json({ ok: true, already: true });
  }

  const origin = new URL(request.url).origin;
  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const role = (user.user_metadata?.role as string) ?? "student";

  const { data: linkData, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: user.email,
    options: { redirectTo: `${origin}/auth/callback?verify=1&role=${encodeURIComponent(role)}` },
  });
  if (error || !linkData?.properties?.action_link) {
    return NextResponse.json({ error: error?.message ?? "Could not generate verification link" }, { status: 500 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [user.email],
      subject: "Verify your EduBridge AI email",
      html: buildEmail(linkData.properties.action_link),
    }),
  });
  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 500 });

  return NextResponse.json({ ok: true });
}
