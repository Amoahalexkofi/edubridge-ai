import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GraduationCap, School, Mail, BadgeCheck } from "lucide-react";
import ProfileForm from "./_components/ProfileForm";
import AvatarUpload from "./_components/AvatarUpload";
import ParentInvite from "./_components/ParentInvite";

const GRADE_LABELS: Record<string, string> = {
  JHS1: "JHS 1", JHS2: "JHS 2", JHS3: "JHS 3",
  SHS1: "SHS 1", SHS2: "SHS 2", SHS3: "SHS 3",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, exam_target, avatar_url, phone, parent_phone, school, grade_level")
    .eq("id", user.id)
    .single();

  const { data: parentLink } = await supabase
    .from("parent_student")
    .select("id")
    .eq("student_id", user.id)
    .limit(1)
    .single();

  const fullName = profile?.full_name ?? "";
  const examLabel = (profile?.exam_target ?? "bece").toUpperCase();
  const gradeLabel = profile?.grade_level ? (GRADE_LABELS[profile.grade_level] ?? profile.grade_level) : null;
  const parentLinked = !!parentLink;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

      {/* Page header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a]">Profile settings</h1>
        <p className="text-sm text-[#64748B] mt-1">Manage your account, academic details and parent link.</p>
      </div>

      <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-5 lg:gap-6 items-start">

        {/* ── Left: identity summary (sticky on desktop) ── */}
        <aside className="lg:sticky lg:top-8">
          <div className="bg-white rounded-2xl border border-[#E8ECF0] shadow-sm overflow-hidden">
            {/* Banner */}
            <div className="h-20 bg-gradient-to-br from-[#1B3A8A] to-[#1D4ED8]" />
            {/* Avatar overlapping banner */}
            <div className="px-5 pb-5 -mt-12 flex flex-col items-center text-center">
              <AvatarUpload
                userId={user.id}
                avatarUrl={profile?.avatar_url ?? null}
                fullName={fullName}
              />
              <p className="font-bold text-lg text-[#0f172a] mt-3">{fullName || "Your name"}</p>
              <p className="text-xs text-[#94a3b8] flex items-center gap-1 mt-0.5">
                <Mail className="h-3 w-3" /> {user.email}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1B3A8A] text-[11px] font-bold tracking-wider uppercase">
                <GraduationCap className="h-3.5 w-3.5" /> {examLabel} Candidate
              </span>
            </div>

            {/* Quick facts */}
            <div className="border-t border-[#F1F5F9] divide-y divide-[#F1F5F9]">
              <div className="flex items-center gap-3 px-5 py-3">
                <School className="h-4 w-4 text-[#94a3b8] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-[#94a3b8] uppercase tracking-wide font-semibold">School</p>
                  <p className="text-sm text-[#334155] truncate">{profile?.school || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3">
                <GraduationCap className="h-4 w-4 text-[#94a3b8] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-[#94a3b8] uppercase tracking-wide font-semibold">Class</p>
                  <p className="text-sm text-[#334155] truncate">{gradeLabel || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3">
                <BadgeCheck className={`h-4 w-4 flex-shrink-0 ${parentLinked ? "text-[#1A6B3C]" : "text-[#CBD5E1]"}`} />
                <div className="min-w-0">
                  <p className="text-[11px] text-[#94a3b8] uppercase tracking-wide font-semibold">Parent / Guardian</p>
                  <p className={`text-sm truncate ${parentLinked ? "text-[#1A6B3C] font-semibold" : "text-[#94a3b8]"}`}>
                    {parentLinked ? "Linked" : "Not linked yet"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Right: settings forms ── */}
        <div className="space-y-5 lg:space-y-6 min-w-0">
          <ProfileForm
            userId={user.id}
            email={user.email ?? ""}
            parentLinked={parentLinked}
            initial={{
              full_name: fullName,
              exam_target: profile?.exam_target ?? "bece",
              phone: profile?.phone ?? "",
              parent_phone: profile?.parent_phone ?? "",
              school: profile?.school ?? "",
              grade_level: profile?.grade_level ?? "",
            }}
          />
          <ParentInvite />
        </div>
      </div>
    </div>
  );
}
