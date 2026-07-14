import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/auth";
import { ChevronLeft, Users, BarChart2, Trophy, Clock } from "lucide-react";
import { sessionStatus, formatWhen, STATUS_STYLE, STATUS_LABEL } from "@/lib/exam-sessions";
import DeleteSessionButton from "./_components/DeleteSessionButton";

export default async function SessionResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("exam_sessions")
    .select("id, title, exam_type, question_count, duration_minutes, starts_at, ends_at, subjects(name, icon)")
    .eq("id", id)
    .single();
  if (!session) notFound();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subj = session.subjects as any;
  const status = sessionStatus(session.starts_at, session.ends_at);

  // All participants' attempts + names → service role
  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: attempts } = await admin
    .from("exam_attempts")
    .select("id, user_id, score, total_marks, status, submitted_at")
    .eq("session_id", id);

  const rows = attempts ?? [];
  const userIds = [...new Set(rows.map((a) => a.user_id))];
  const nameById: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await admin.from("profiles").select("id, full_name").in("id", userIds);
    (profiles ?? []).forEach((p) => { nameById[p.id] = p.full_name ?? "Student"; });
  }

  const submitted = rows
    .filter((a) => a.status === "submitted" && a.score != null && a.total_marks)
    .map((a) => ({
      name: nameById[a.user_id] ?? "Student",
      attemptId: a.id,
      pct: Math.round((a.score! / a.total_marks!) * 100),
      raw: `${a.score}/${a.total_marks}`,
      submittedAt: a.submitted_at,
    }))
    .sort((x, y) => y.pct - x.pct);

  const inProgress = rows.filter((a) => a.status !== "submitted").length;
  const avg = submitted.length > 0 ? Math.round(submitted.reduce((s, r) => s + r.pct, 0) / submitted.length) : null;
  const top = submitted.length > 0 ? submitted[0].pct : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <Link href="/admin/exams" className="inline-flex items-center gap-1 text-sm font-semibold text-[#64748B] hover:text-[#1D4ED8] transition-colors">
        <ChevronLeft className="h-4 w-4" /> Mock Exam Sessions
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-5">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-[#F8F7F4] border border-[#E6E4DE] flex items-center justify-center text-3xl flex-shrink-0">
            {subj?.icon ?? "📝"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-[#0f172a]">{session.title}</h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>
            </div>
            <p className="text-sm text-[#64748B] mt-1">
              {subj?.name} · {session.exam_type?.toUpperCase()} · {session.question_count} questions · {session.duration_minutes} min
            </p>
            <p className="text-xs text-[#94a3b8] mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatWhen(session.starts_at)} → {formatWhen(session.ends_at)}
            </p>
          </div>
          <DeleteSessionButton sessionId={session.id} />
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<Users className="h-4 w-4" />} label="Took it" value={String(submitted.length)} sub={inProgress > 0 ? `${inProgress} in progress` : undefined} />
        <Stat icon={<BarChart2 className="h-4 w-4" />} label="Class average" value={avg != null ? `${avg}%` : "—"} />
        <Stat icon={<Trophy className="h-4 w-4" />} label="Top score" value={top != null ? `${top}%` : "—"} />
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#F2F1EE]">
          <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">Performance</p>
        </div>
        {submitted.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-[#94a3b8]">No students have completed this session yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F2F1EE]">
            {submitted.map((r, i) => (
              <Link key={r.attemptId} href={`/student/exams/${r.attemptId}`} className="flex items-center gap-4 px-5 py-3 hover:bg-[#F8F7F4] transition-colors">
                <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                  i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-[#F2F1EE] text-[#94a3b8]"
                }`}>{i + 1}</span>
                <p className="flex-1 min-w-0 text-sm font-semibold text-[#0f172a] truncate">{r.name}</p>
                <span className="text-xs text-[#94a3b8] tabular-nums">{r.raw}</span>
                <span className={`text-base font-black tabular-nums w-14 text-right ${
                  r.pct >= 60 ? "text-[#16A34A]" : r.pct >= 40 ? "text-[#D97706]" : "text-[#DC2626]"
                }`}>{r.pct}%</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-4">
      <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">{icon}{label}</p>
      <p className="text-2xl font-black text-[#0f172a] tabular-nums mt-1">{value}</p>
      {sub && <p className="text-[11px] text-[#94a3b8] mt-0.5">{sub}</p>}
    </div>
  );
}
