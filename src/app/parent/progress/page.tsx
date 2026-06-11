import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function ParentProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { student: studentId } = await searchParams;
  if (!studentId) redirect("/parent");

  // Verify this parent is linked to this student
  const { data: link } = await supabase
    .from("parent_student")
    .select("student_id")
    .eq("parent_id", user.id)
    .eq("student_id", studentId)
    .single();

  if (!link) redirect("/parent");

  const { data: student } = await supabase
    .from("profiles")
    .select("full_name, exam_target, school, grade_level")
    .eq("id", studentId)
    .single();

  // Subjects
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, slug, icon, topics(id, lessons(id))")
    .eq("exam_type", student?.exam_target ?? "BECE");

  // Completed lessons
  const { data: completed } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", studentId)
    .eq("completed", true);

  const completedSet = new Set(completed?.map((c) => c.lesson_id) ?? []);

  // Recent exam attempts
  const { data: exams } = await supabase
    .from("exam_attempts")
    .select("id, score, total_marks, started_at, subjects(name, icon)")
    .eq("user_id", studentId)
    .eq("status", "submitted")
    .order("started_at", { ascending: false })
    .limit(5);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <Link href="/parent" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] hover:text-[#0f172a] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      {/* Student header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-[#1B3A8A] flex items-center justify-center text-white font-bold text-lg">
            {(student?.full_name ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-lg">{student?.full_name}</p>
            <p className="text-sm text-slate-500">{student?.grade_level} · {student?.school ?? "—"} · {student?.exam_target}</p>
          </div>
        </div>
      </div>

      {/* Subjects progress */}
      <div>
        <h2 className="font-bold text-slate-900 mb-3">Subject progress</h2>
        <div className="space-y-2.5">
          {subjects?.map((subject) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const allLessons = (subject.topics as any[])?.flatMap((t: any) => t.lessons?.map((l: any) => l.id) ?? []) ?? [];
            const done = allLessons.filter((id: string) => completedSet.has(id)).length;
            const pct = allLessons.length > 0 ? Math.round((done / allLessons.length) * 100) : 0;

            return (
              <div key={subject.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{subject.icon ?? "📚"}</span>
                  <p className="font-semibold text-sm text-slate-800 flex-1">{subject.name}</p>
                  <p className="text-xs font-bold text-slate-500 tabular-nums">{done}/{allLessons.length} lessons</p>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pct >= 60 ? "bg-green-500" : pct > 0 ? "bg-[#1D4ED8]" : "bg-slate-200"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">{pct}% complete</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent exams */}
      {exams && exams.length > 0 && (
        <div>
          <h2 className="font-bold text-slate-900 mb-3">Recent exams</h2>
          <div className="space-y-2">
            {exams.map((e) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const sub = e.subjects as any;
              const pct = e.score != null && e.total_marks ? Math.round((e.score / e.total_marks) * 100) : null;
              return (
                <div key={e.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center text-xl flex-shrink-0">
                    {sub?.icon ?? <Trophy className="h-4 w-4 text-purple-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800">{sub?.name ?? "Exam"}</p>
                    <p className="text-xs text-slate-400">{new Date(e.started_at).toLocaleDateString("en-GB")}</p>
                  </div>
                  {pct != null && (
                    <p className={`text-lg font-black tabular-nums ${pct >= 60 ? "text-green-600" : pct >= 40 ? "text-amber-600" : "text-red-500"}`}>
                      {pct}%
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {completedSet.size === 0 && (!exams || exams.length === 0) && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-10 text-center">
          <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-600 text-sm">No activity yet</p>
          <p className="text-xs text-slate-400 mt-1">Your ward hasn&apos;t started any lessons or exams.</p>
        </div>
      )}
    </div>
  );
}
