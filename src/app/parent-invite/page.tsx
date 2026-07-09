import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { GraduationCap, AlertCircle } from "lucide-react";
import AcceptInviteButton from "./_components/AcceptInviteButton";

export default async function ParentInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in → send to login, come back after
  if (!user) {
    const returnUrl = `/parent-invite${token ? `?token=${token}` : ""}`;
    redirect(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  }

  // Must have a token
  if (!token) {
    return <ErrorPage message="No invite token provided. Ask your child to share their invite link again." />;
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check role
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!["parent", "admin", "super_admin"].includes(roleRow?.role ?? "")) {
    return <ErrorPage message="This link is for parents and guardians. Please sign in with a parent account." />;
  }

  // Validate token
  const { data: invite } = await admin
    .from("parent_invite_tokens")
    .select("id, student_id, used, expires_at")
    .eq("token", token.toUpperCase())
    .single();

  if (!invite) return <ErrorPage message="This invite link is invalid. Ask your child to generate a new one." />;
  if (invite.used) return <ErrorPage message="This invite link has already been used." />;
  if (new Date(invite.expires_at) < new Date()) {
    return <ErrorPage message="This invite link has expired. Ask your child to generate a new one from their profile." />;
  }

  // Already linked?
  const { data: existingLink } = await admin
    .from("parent_student")
    .select("id")
    .eq("parent_id", user.id)
    .eq("student_id", invite.student_id)
    .single();

  if (existingLink) {
    redirect("/parent");
  }

  // Get student info
  const { data: student } = await admin
    .from("profiles")
    .select("full_name, exam_target, school, grade_level")
    .eq("id", invite.student_id)
    .single();

  const studentName = student?.full_name ?? "this student";
  const exam = (student?.exam_target ?? "BECE").toUpperCase();
  const initials = studentName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F2F1EE] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/logo-no-bg.png" alt="EduBridge AI" width={140} height={140} className="h-14 w-auto object-contain" />
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Top bar */}
          <div className="h-2 bg-gradient-to-r from-[#1B3A8A] to-[#1D4ED8]" />

          <div className="p-8 space-y-6">
            <div className="text-center space-y-1">
              <p className="text-xs font-bold tracking-widest uppercase text-green-600">Parent Invite</p>
              <h1 className="text-2xl font-black text-[#0f172a]">You&apos;ve been invited!</h1>
              <p className="text-sm text-slate-500">Your child has shared their EduBridge AI account with you.</p>
            </div>

            {/* Student card */}
            <div className="bg-[#F8F7F4] rounded-2xl p-5 flex items-center gap-4 border border-[#E6E4DE]">
              <div className="h-14 w-14 rounded-full bg-[#1B3A8A] flex items-center justify-center text-white text-lg font-black flex-shrink-0">
                {initials}
              </div>
              <div>
                <p className="font-bold text-[#0f172a] text-base">{studentName}</p>
                <p className="text-sm text-slate-500">{exam} candidate</p>
                {student?.school && <p className="text-xs text-slate-400 mt-0.5">{student.school} · {student.grade_level}</p>}
              </div>
              <div className="ml-auto">
                <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-500 text-center leading-relaxed">
              Once linked, you can monitor {student?.full_name?.split(" ")[0] ?? "their"}&apos;s lessons completed, exam scores, and overall progress from your parent dashboard.
            </p>

            <AcceptInviteButton token={token} studentName={studentName} />

            <p className="text-center text-xs text-slate-400">
              Not a parent?{" "}
              <Link href="/login" className="text-[#1B3A8A] font-semibold hover:underline">
                Sign in with a different account
              </Link>
            </p>
          </div>

          {/* Bottom bar */}
          <div className="h-1 bg-gradient-to-r from-[#E8722A] to-[#F59E0B]" />
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">© 2026 EduBridge Educational Solutions · Ghana 🇬🇭</p>
      </div>
    </div>
  );
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#F2F1EE] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <AlertCircle className="h-7 w-7 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-[#0f172a]">Invalid invite link</h2>
        <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
        <Link href="/login" className="inline-flex items-center justify-center h-11 px-6 bg-[#1B3A8A] text-white font-bold rounded-xl text-sm hover:bg-[#1e40af] transition-all">
          Go to sign in
        </Link>
      </div>
    </div>
  );
}
