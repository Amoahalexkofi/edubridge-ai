import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/auth";
import { CalendarClock, ChevronRight, Users, BarChart2 } from "lucide-react";
import { sessionStatus, formatWhen, STATUS_STYLE, STATUS_LABEL } from "@/lib/exam-sessions";
import SessionForm from "./_components/SessionForm";

export default async function AdminExamsPage() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, exam_type")
    .order("exam_type").order("name");

  const { data: sessions } = await supabase
    .from("exam_sessions")
    .select("id, title, subject_id, exam_type, question_count, duration_minutes, starts_at, ends_at, subjects(name, icon)")
    .order("starts_at", { ascending: false });

  // Participation + averages need all users' attempts → service role
  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const sessionIds = (sessions ?? []).map((s) => s.id);
  const statsBySession: Record<string, { taken: number; avg: number | null }> = {};
  if (sessionIds.length > 0) {
    const { data: attempts } = await admin
      .from("exam_attempts")
      .select("session_id, score, total_marks, status")
      .in("session_id", sessionIds);
    for (const sid of sessionIds) {
      const done = (attempts ?? []).filter((a) => a.session_id === sid && a.status === "submitted" && a.score != null && a.total_marks);
      const avg = done.length > 0
        ? Math.round(done.reduce((sum, a) => sum + (a.score! / a.total_marks!) * 100, 0) / done.length)
        : null;
      statsBySession[sid] = { taken: done.length, avg };
    }
  }

  const all = sessions ?? [];
  const now = Date.now();
  const live = all.filter((s) => sessionStatus(s.starts_at, s.ends_at, now) === "live");
  const upcoming = all.filter((s) => sessionStatus(s.starts_at, s.ends_at, now) === "upcoming");
  const closed = all.filter((s) => sessionStatus(s.starts_at, s.ends_at, now) === "closed");
  const ordered = [...live, ...upcoming, ...closed];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a]">Mock Exam Sessions</h1>
          <p className="text-sm text-[#64748B] mt-1">Schedule timed mock exams and track how students perform</p>
        </div>
        <SessionForm subjects={subjects ?? []} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Live now" value={live.length} tone="green" />
        <Stat label="Upcoming" value={upcoming.length} tone="amber" />
        <Stat label="Closed" value={closed.length} tone="slate" />
      </div>

      {ordered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#E6E4DE] py-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-[#F2F1EE] flex items-center justify-center mx-auto mb-4">
            <CalendarClock className="h-7 w-7 text-[#CBD5E1]" />
          </div>
          <p className="font-bold text-[#334155]">No sessions yet</p>
          <p className="text-sm text-[#94a3b8] mt-1">Click &ldquo;Schedule session&rdquo; to set up your first mock exam.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {ordered.map((s) => {
            const status = sessionStatus(s.starts_at, s.ends_at, now);
            const stats = statsBySession[s.id] ?? { taken: 0, avg: null };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const subj = s.subjects as any;
            return (
              <Link
                key={s.id}
                href={`/admin/exams/${s.id}`}
                className="flex items-center gap-4 bg-white rounded-2xl border border-[#E6E4DE] eb-card eb-lift p-4 hover:border-[#1D4ED8]/40"
              >
                <div className="h-11 w-11 rounded-xl bg-[#F8F7F4] border border-[#E6E4DE] flex items-center justify-center text-xl flex-shrink-0">
                  {subj?.icon ?? "📝"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-[#0f172a] truncate">{s.title}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>
                  </div>
                  <p className="text-xs text-[#94a3b8] mt-0.5">
                    {subj?.name} · {s.exam_type?.toUpperCase()} · {s.question_count} Q · {s.duration_minutes} min
                  </p>
                  <p className="text-xs text-[#94a3b8] mt-0.5">{formatWhen(s.starts_at)} → {formatWhen(s.ends_at)}</p>
                </div>
                <div className="hidden sm:flex items-center gap-4 flex-shrink-0 text-right">
                  <div>
                    <p className="text-base font-black text-[#0f172a] tabular-nums flex items-center gap-1 justify-end"><Users className="h-3.5 w-3.5 text-[#94a3b8]" />{stats.taken}</p>
                    <p className="text-[10px] text-[#94a3b8]">took it</p>
                  </div>
                  <div>
                    <p className="text-base font-black text-[#0f172a] tabular-nums flex items-center gap-1 justify-end"><BarChart2 className="h-3.5 w-3.5 text-[#94a3b8]" />{stats.avg != null ? `${stats.avg}%` : "—"}</p>
                    <p className="text-[10px] text-[#94a3b8]">avg</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#CBD5E1] flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "green" | "amber" | "slate" }) {
  const styles = {
    green: "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]",
    amber: "bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]",
    slate: "bg-white border-[#E6E4DE] text-[#0f172a]",
  }[tone];
  return (
    <div className={`rounded-2xl border p-4 ${styles}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
      <p className="text-3xl font-black tabular-nums mt-1">{value}</p>
    </div>
  );
}
