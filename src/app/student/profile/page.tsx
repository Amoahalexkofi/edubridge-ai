import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
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
  const user = await getAuthUser();
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
  const stats = badgeState.stats;

  const quickStats = [
    { label: "Lessons", value: stats.lessonsCompleted },
    { label: "Exams", value: stats.examCount },
    { label: "Day streak", value: stats.streak },
    { label: "Badges", value: `${earnedCount}/${BADGES.length}` },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-8">

      {/* ── Hero ── */}
      <div className="bg-white rounded-3xl border border-[#E6E4DE] eb-card overflow-hidden mb-6">
        <div className="relative h-24 bg-gradient-to-br from-[#1B3A8A] via-[#1D4ED8] to-[#2563EB]">
          <div className="absolute -top-10 -right-6 h-36 w-36 rounded-full bg-white/10" />
          <div className="absolute top-3 left-16 h-20 w-20 rounded-full bg-white/5" />
        </div>

        <div className="px-5 sm:px-7 pb-6 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5">
            <AvatarUpload
              userId={user.id}
              avatarUrl={profile?.avatar_url ?? null}
              fullName={fullName}
            />
            <div className="flex-1 min-w-0 sm:pb-1 text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a]">{fullName || "Your name"}</h1>
              <p className="text-[13px] text-[#94a3b8] flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1B3A8A] text-xs font-bold tracking-wide">
                  <GraduationCap className="h-3.5 w-3.5" /> {examLabel} Candidate
                </span>
                {gradeLabel && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F2F1EE] text-[#475569] text-xs font-semibold">
                    {gradeLabel}
                  </span>
                )}
                {profile?.school && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F2F1EE] text-[#475569] text-xs font-semibold">
                    <School className="h-3.5 w-3.5" /> {profile.school}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  parentLinked ? "bg-[#F0FDF4] text-[#1A6B3C]" : "bg-[#F2F1EE] text-[#94a3b8]"
                }`}>
                  <BadgeCheck className="h-3.5 w-3.5" /> {parentLinked ? "Parent linked" : "No parent linked"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-2 mt-5 pt-5 border-t border-[#EEEDE8]">
            {quickStats.map((s) => (
              <div key={s.label} className="text-center sm:text-left">
                <p className="text-lg sm:text-xl font-black text-[#0f172a] tabular-nums leading-none">{s.value}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Two columns: settings + badges ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">

        {/* Left: account settings */}
        <div className="space-y-6">
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

        {/* Right: badges */}
        <div id="badges" className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-5 sm:p-6 scroll-mt-20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900">Badges</h2>
              <p className="text-xs text-slate-500 mt-0.5">Earned by learning — keep unlocking them.</p>
            </div>
            <span className="text-sm font-black text-[#1B3A8A] tabular-nums flex-shrink-0">{earnedCount}/{BADGES.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {BADGES.map(b => {
              const earnedAt = badgeState.earned[b.id];
              const Icon = b.icon;
              return (
                <div
                  key={b.id}
                  title={earnedAt ? `${b.title} — earned ${new Date(earnedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : `${b.title} — ${b.hint(stats)}`}
                  className={`rounded-xl border p-2.5 flex flex-col items-center text-center gap-1.5 ${
                    earnedAt ? "bg-white border-[#E6E4DE]" : "bg-[#F8F7F4] border-[#EEEDE8]"
                  }`}
                >
                  <span className={`relative h-9 w-9 rounded-lg border flex items-center justify-center ${
                    earnedAt ? b.tint : "bg-white text-slate-300 border-[#E6E4DE]"
                  }`}>
                    <Icon className="h-4 w-4" />
                    {!earnedAt && <Lock className="h-2.5 w-2.5 text-slate-300 absolute -top-1 -right-1 bg-[#F8F7F4] rounded-full" />}
                  </span>
                  <p className={`text-[11px] font-bold leading-tight ${earnedAt ? "text-slate-900" : "text-slate-400"}`}>
                    {b.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
