import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GraduationCap, School, BadgeCheck, Mail, Lock } from "lucide-react";
import ProfileForm from "./_components/ProfileForm";
import AvatarUpload from "./_components/AvatarUpload";
import ParentInvite from "./_components/ParentInvite";
import { checkAndAwardBadges, BADGES } from "@/lib/badges";

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

  const badgeState = await checkAndAwardBadges(supabase, user.id);
  const earnedCount = Object.keys(badgeState.earned).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 lg:py-8">

      {/* ── Cover-banner hero ── */}
      <div className="bg-white rounded-3xl border border-[#E8ECF0] shadow-sm overflow-hidden">
        {/* Cover */}
        <div className="relative h-20 bg-gradient-to-br from-[#1B3A8A] via-[#1D4ED8] to-[#2563EB]">
          <div className="absolute -top-8 -right-6 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute top-4 left-10 h-20 w-20 rounded-full bg-white/5" />
        </div>

        {/* Identity */}
        <div className="px-6 pb-5 -mt-11 flex flex-col items-center text-center">
          <AvatarUpload
            userId={user.id}
            avatarUrl={profile?.avatar_url ?? null}
            fullName={fullName}
          />
          <h1 className="font-display text-lg sm:text-xl font-bold text-[#0f172a] mt-2.5">
            {fullName || "Your name"}
          </h1>
          <p className="text-[13px] text-[#94a3b8] flex items-center gap-1.5 mt-1">
            <Mail className="h-3.5 w-3.5" /> {user.email}
          </p>

          {/* Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1B3A8A] text-xs font-bold tracking-wide">
              <GraduationCap className="h-3.5 w-3.5" /> {examLabel} Candidate
            </span>
            {gradeLabel && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F5F9] text-[#475569] text-xs font-semibold">
                {gradeLabel}
              </span>
            )}
            {profile?.school && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F5F9] text-[#475569] text-xs font-semibold">
                <School className="h-3.5 w-3.5" /> {profile.school}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              parentLinked ? "bg-[#F0FDF4] text-[#1A6B3C]" : "bg-[#F1F5F9] text-[#94a3b8]"
            }`}>
              <BadgeCheck className="h-3.5 w-3.5" /> {parentLinked ? "Parent linked" : "No parent linked"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Badge case ── */}
      <div id="badges" className="mt-6 bg-white rounded-2xl border border-[#E8ECF0] p-5 sm:p-6 scroll-mt-20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-slate-900">Badges</h2>
            <p className="text-xs text-slate-500 mt-0.5">Earned by learning — keep going to unlock them all.</p>
          </div>
          <span className="text-sm font-black text-[#1B3A8A] tabular-nums flex-shrink-0">{earnedCount}/{BADGES.length}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {BADGES.map(b => {
            const earnedAt = badgeState.earned[b.id];
            const Icon = b.icon;
            return (
              <div
                key={b.id}
                className={`rounded-xl border p-3 flex flex-col gap-2 ${
                  earnedAt ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`h-9 w-9 rounded-xl border flex items-center justify-center ${
                    earnedAt ? b.tint : "bg-white text-slate-300 border-slate-200"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {!earnedAt && <Lock className="h-3 w-3 text-slate-300" />}
                </div>
                <div>
                  <p className={`text-[13px] font-bold leading-tight ${earnedAt ? "text-slate-900" : "text-slate-400"}`}>
                    {b.title}
                  </p>
                  <p className={`text-[11px] leading-snug mt-0.5 ${earnedAt ? "text-slate-500" : "text-slate-400"}`}>
                    {earnedAt
                      ? new Date(earnedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                      : b.hint(badgeState.stats)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Settings sections ── */}
      <div className="mt-6 space-y-5">
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
  );
}
