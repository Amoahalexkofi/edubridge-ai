import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudentNav from "./_components/StudentNav";
import FloatingTutor from "./_components/FloatingTutor";
import VerifyEmailBanner from "./_components/VerifyEmailBanner";
import Link from "next/link";
import { Eye, ArrowLeft } from "lucide-react";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: roleRow }] = await Promise.all([
    supabase.from("profiles").select("full_name, exam_target, avatar_url").eq("id", user.id).single(),
    supabase.from("user_roles").select("role").eq("user_id", user.id).single(),
  ]);

  const isPreviewingAdmin = roleRow?.role === "admin" || roleRow?.role === "teacher";
  const isRealStudent = roleRow?.role === "student";

  // Real students who never set an exam target (e.g. signed up via Google OAuth,
  // which skips the details step) must pick one before using the app.
  if (isRealStudent && !profile?.exam_target) {
    redirect("/onboarding");
  }

  // Unverified students get limited access (dashboard + profile only). Locked only
  // when app_verified is explicitly false (new email signups); existing users
  // without the flag are treated as verified. Feature pages enforce server-side.
  const locked = isRealStudent && user.user_metadata?.app_verified === false;

  return (
    <div className="min-h-screen bg-[#F2F1EE]">
      {isPreviewingAdmin && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#E8722A] text-white px-4 py-2 flex items-center justify-between gap-3 text-sm font-semibold shadow-md">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 flex-shrink-0" />
            <span>Preview Mode — you are viewing the student experience as an {roleRow?.role}</span>
          </div>
          <Link
            href="/admin/subjects"
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 rounded-lg text-xs font-bold flex-shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Admin
          </Link>
        </div>
      )}

      <StudentNav
        userName={profile?.full_name ?? "Student"}
        examTarget={profile?.exam_target ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        previewOffset={isPreviewingAdmin}
        locked={locked}
      />

      {/* Desktop: offset for sidebar. Mobile: top header + bottom nav spacers */}
      <main className={`lg:pl-60 min-h-screen ${isPreviewingAdmin ? "pt-10" : ""}`}>
        <div className="pt-14 pb-20 lg:pt-0 lg:pb-0">
          {locked && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
              <VerifyEmailBanner email={user.email ?? ""} />
            </div>
          )}
          {children}
        </div>
      </main>

      {/* AI Tutor is a gated feature — hide the launcher until verified */}
      {!locked && (
        <FloatingTutor
          userId={user.id}
          firstName={profile?.full_name?.split(" ")[0] ?? "there"}
          examTarget={(profile?.exam_target ?? "bece").toUpperCase()}
        />
      )}
    </div>
  );
}
