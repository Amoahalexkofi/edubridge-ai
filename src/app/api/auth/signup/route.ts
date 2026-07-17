import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { normalizePhone, matchParentStudent } from "@/lib/phone";
import { isValidName, isValidGhanaPhone } from "@/lib/validation";

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM = "EduBridge AI <noreply@edubridgegh.com>";

function buildConfirmEmail(confirmLink: string, fullName: string): string {
  const first = fullName.split(" ")[0] || "there";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm your email</title>
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
              <div style="display:inline-block;background:#EEF2FF;border-radius:50%;width:72px;height:72px;line-height:72px;text-align:center;font-size:32px;">🎓</div>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td align="center" style="padding:16px 40px 8px;">
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#0F172A;letter-spacing:-0.5px;">Welcome, ${first}!</h1>
            </td>
          </tr>

          <!-- Body text -->
          <tr>
            <td style="padding:12px 48px 32px;text-align:center;color:#475569;font-size:15px;line-height:1.7;">
              You're one step away from unlocking Ghana's best BECE &amp; WASSCE prep platform.
              Click below to confirm your email and start learning.
            </td>
          </tr>

          <!-- CTA button -->
          <tr>
            <td align="center" style="padding:0 40px 36px;">
              <a href="${confirmLink}" style="display:inline-block;background:#1B3A8A;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:15px 40px;border-radius:10px;box-shadow:0 4px 14px rgba(27,58,138,0.35);">
                Confirm my email
              </a>
            </td>
          </tr>

          <!-- Feature pills -->
          <tr>
            <td align="center" style="padding:0 40px 32px;">
              <span style="display:inline-block;background:#EEF2FF;color:#1B3A8A;font-size:12px;font-weight:700;padding:7px 16px;border-radius:20px;margin:4px;">📚 Curriculum-aligned</span>
              <span style="display:inline-block;background:#FFF3E8;color:#E8722A;font-size:12px;font-weight:700;padding:7px 16px;border-radius:20px;margin:4px;">🤖 AI Tutor 24/7</span>
              <span style="display:inline-block;background:#F0FDF4;color:#16A34A;font-size:12px;font-weight:700;padding:7px 16px;border-radius:20px;margin:4px;">📊 Live Analytics</span>
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
              <a href="${confirmLink}" style="color:#1B3A8A;word-break:break-all;font-size:11px;">${confirmLink}</a>
            </td>
          </tr>

          <!-- Ignore notice -->
          <tr>
            <td style="padding:0 48px 24px;text-align:center;color:#94A3B8;font-size:12px;">
              If you didn't create an EduBridge AI account, you can safely ignore this email.
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;padding:20px 40px;border-top:1px solid #E2E8F0;text-align:center;color:#94A3B8;font-size:11px;">
              © 2026 EduBridge Educational Solutions &nbsp;·&nbsp; Ghana 🇬🇭
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
  const { email, password, fullName, role, examTarget, phone, parentPhone, school, gradeLevel } = await request.json();
  if (!email || !password || !fullName || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  // SECURITY: never let public signup mint elevated roles. Only these self-serve
  // roles are allowed; admin/super_admin can only be granted by a super admin.
  const PUBLIC_ROLES = ["student", "teacher", "parent"];
  if (!PUBLIC_ROLES.includes(String(role))) {
    return NextResponse.json({ error: "Invalid account type." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (!isValidName(String(fullName))) {
    return NextResponse.json({ error: "Please enter a valid full name (letters only, first and last name)." }, { status: 400 });
  }
  // Students must provide exam target, class, and a valid parent/guardian phone.
  if (role === "student") {
    if (!examTarget) return NextResponse.json({ error: "Please select BECE or WASSCE." }, { status: 400 });
    if (!gradeLevel) return NextResponse.json({ error: "Please select your class." }, { status: 400 });
    if (!parentPhone || !String(parentPhone).trim()) {
      return NextResponse.json({ error: "Parent / guardian phone number is required." }, { status: 400 });
    }
    if (!isValidGhanaPhone(String(parentPhone))) {
      return NextResponse.json({ error: "Please enter a valid Ghana phone number (e.g. 0244 123 456)." }, { status: 400 });
    }
  }
  // Parents: if they supply a number, it must be valid.
  if (role === "parent" && phone && String(phone).trim() && !isValidGhanaPhone(String(phone))) {
    return NextResponse.json({ error: "Please enter a valid Ghana phone number (e.g. 0244 123 456)." }, { status: 400 });
  }

  const origin = new URL(request.url).origin;

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create the user ALREADY CONFIRMED so they can sign in immediately ("Continue"
  // → dashboard). Real email verification is tracked separately via the
  // user_metadata.app_verified flag (false now; set true when they click the
  // verification link). This decouples "can log in" from "is verified".
  // full_name + role go into metadata so the handle_new_user trigger captures them.
  // Our own verification token (stored in app_metadata, which users can't edit).
  // The verification link hits /api/verify-email and flips app_verified — no
  // dependency on Supabase magic-link redirect behaviour.
  const verifyToken = crypto.randomUUID();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role, app_verified: false },
    app_metadata: { verify_token: verifyToken },
  });

  if (createErr || !created.user) {
    const msg = createErr?.message ?? "Could not create account";
    const friendly = /already.*registered|already exists|duplicate/i.test(msg)
      ? "An account with this email already exists. Please sign in instead."
      : msg;
    return NextResponse.json({ error: friendly }, { status: 400 });
  }

  const userId = created.user.id;
  const confirmLink = `${origin}/api/verify-email?uid=${userId}&token=${verifyToken}`;

  // Normalize phones
  const normPhone = phone ? normalizePhone(phone) : null;
  const normParentPhone = parentPhone ? normalizePhone(parentPhone) : null;

  // Save the rest of the profile. The trigger has already set full_name + role,
  // so we also re-assert full_name here and add exam target / school / phones.
  // Retry once to absorb any race with the trigger's initial INSERT; surface a
  // real error instead of failing silently.
  const profilePayload = {
    id: userId,
    full_name: fullName,
    ...(examTarget ? { exam_target: examTarget } : {}),
    ...(normPhone ? { phone: normPhone } : {}),
    ...(normParentPhone ? { parent_phone: normParentPhone } : {}),
    ...(school ? { school } : {}),
    ...(gradeLevel ? { grade_level: gradeLevel } : {}),
  };
  let { error: profileError } = await admin.from("profiles").upsert(profilePayload);
  if (profileError) {
    await new Promise((r) => setTimeout(r, 400));
    ({ error: profileError } = await admin.from("profiles").upsert(profilePayload));
  }
  if (profileError) {
    // Name + role are safe (set by the trigger via metadata); only extra fields
    // like exam target may be missing — onboarding will catch that. Log loudly.
    console.error("signup: profile upsert failed:", profileError.message);
  }

  // Fix role — DB trigger auto-inserts "student", override if needed
  if (role !== "student") {
    await admin.from("user_roles").update({ role }).eq("user_id", userId);
  }

  // Auto-link parent ↔ student by phone
  await matchParentStudent(admin, userId, role as "student" | "parent", normPhone, normParentPhone);

  // Send branded email via Resend
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: "Confirm your EduBridge AI account",
      html: buildConfirmEmail(confirmLink, fullName),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
