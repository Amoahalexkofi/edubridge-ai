import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FileText, Trophy, Clock, ChevronRight, Plus } from "lucide-react";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function ExamsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("exam_target")
    .eq("id", user.id)
    .single();

  const examTarget = profile?.exam_target ?? "BECE";

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, slug, icon")
    .eq("exam_type", examTarget.toLowerCase())
    .order("name");

  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select("id, status, score, total_marks, started_at, submitted_at, subject_id, subjects(name, icon)")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(20);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a]">Mock Exams</h1>
        <p className="text-sm text-[#64748B] mt-1">
          WAEC-style timed papers with instant marking
        </p>
      </div>

      {/* Start new exam section */}
      <div>
        <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wider mb-3">
          Start a new exam
        </h2>
        {subjects && subjects.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {subjects.map((s) => (
              <Link
                key={s.id}
                href={`/student/exams/take?subject=${s.id}`}
                className="group bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-col gap-3 hover:border-[#1D4ED8]/40 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-xl">
                    {s.icon ?? "📚"}
                  </div>
                  <div className="h-6 w-6 rounded-full bg-[#F1F5F9] group-hover:bg-[#1D4ED8] flex items-center justify-center transition-colors">
                    <Plus className="h-3.5 w-3.5 text-[#94a3b8] group-hover:text-white transition-colors" />
                  </div>
                </div>
                <div>
                  <p className="font-bold text-sm text-[#0f172a] leading-snug">{s.name}</p>
                  <p className="text-xs text-[#94a3b8] mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> 40 questions · 40 min
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-[#E2E8F0] py-12 text-center">
            <FileText className="h-8 w-8 text-[#CBD5E1] mx-auto mb-3" />
            <p className="font-semibold text-[#334155] text-sm">No subjects available yet</p>
          </div>
        )}
      </div>

      {/* Past attempts */}
      {attempts && attempts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wider mb-3">
            Past attempts
          </h2>
          <div className="space-y-2">
            {attempts.map((attempt) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const sub = attempt.subjects as any;
              const pct = attempt.score != null && attempt.total_marks
                ? Math.round((attempt.score / attempt.total_marks) * 100)
                : null;
              const isSubmitted = attempt.status === "submitted";

              return (
                <Link
                  key={attempt.id}
                  href={`/student/exams/${attempt.id}`}
                  className="flex items-center gap-4 bg-white rounded-2xl border border-[#E2E8F0] p-4 hover:border-[#1D4ED8]/30 hover:shadow-sm transition-all"
                >
                  <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-xl flex-shrink-0">
                    {sub?.icon ?? "📚"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#0f172a]">{sub?.name ?? "Unknown subject"}</p>
                    <p className="text-xs text-[#94a3b8] mt-0.5">
                      {formatDate(attempt.started_at)}
                    </p>
                  </div>
                  {isSubmitted && pct != null ? (
                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg font-black tabular-nums ${
                        pct >= 60 ? "text-green-600" : pct >= 40 ? "text-amber-600" : "text-red-500"
                      }`}>{pct}%</p>
                      <p className="text-xs text-[#94a3b8]">{attempt.score}/{attempt.total_marks}</p>
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-100 flex-shrink-0">
                      {isSubmitted ? "Submitted" : "In progress"}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-[#CBD5E1] flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!attempts || attempts.length === 0) && (
        <div className="bg-white rounded-2xl border border-dashed border-[#E2E8F0] py-10 text-center">
          <Trophy className="h-8 w-8 text-[#CBD5E1] mx-auto mb-3" />
          <p className="font-semibold text-[#334155] text-sm">No exams taken yet</p>
          <p className="text-xs text-[#94a3b8] mt-1">Start an exam above to see your results here.</p>
        </div>
      )}
    </div>
  );
}
