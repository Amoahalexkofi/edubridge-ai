import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Users, BookOpen, Trophy, TrendingUp, ArrowRight, UserPlus } from "lucide-react";

export default async function ParentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  // Get linked students
  const { data: links } = await supabase
    .from("parent_student")
    .select("student_id")
    .eq("parent_id", user.id);

  const studentIds = links?.map((l) => l.student_id) ?? [];

  const { data: students } = studentIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, full_name, exam_target, school, grade_level")
        .in("id", studentIds)
    : { data: [] };

  // Progress for each student
  const { data: progressRows } = studentIds.length > 0
    ? await supabase
        .from("lesson_progress")
        .select("user_id, completed")
        .in("user_id", studentIds)
        .eq("completed", true)
    : { data: [] };

  const { data: examRows } = studentIds.length > 0
    ? await supabase
        .from("exam_attempts")
        .select("user_id, score, total_marks")
        .in("user_id", studentIds)
        .eq("status", "submitted")
        .not("score", "is", null)
    : { data: [] };

  const lessonsMap: Record<string, number> = {};
  progressRows?.forEach((p) => {
    lessonsMap[p.user_id] = (lessonsMap[p.user_id] ?? 0) + 1;
  });

  const examMap: Record<string, { total: number; count: number }> = {};
  examRows?.forEach((e) => {
    if (!examMap[e.user_id]) examMap[e.user_id] = { total: 0, count: 0 };
    examMap[e.user_id].total += (e.score / e.total_marks) * 100;
    examMap[e.user_id].count++;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-8">

      {/* Greeting */}
      <div className="mb-7">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Welcome, {firstName}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Monitor your ward&apos;s learning progress</p>
      </div>

      {students && students.length > 0 ? (
        <div className="space-y-4">
          {students.map((student) => {
            const lessons = lessonsMap[student.id] ?? 0;
            const avg = examMap[student.id]
              ? Math.round(examMap[student.id].total / examMap[student.id].count)
              : null;
            const initials = (student.full_name ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

            return (
              <div key={student.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                {/* Student header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-12 w-12 rounded-full bg-[#1B3A8A] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-lg">{student.full_name}</p>
                    <p className="text-sm text-slate-500">{student.grade_level} · {student.school ?? "—"}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="px-3 py-1.5 rounded-full bg-[#1B3A8A] text-white text-xs font-bold">
                      {student.exam_target}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#F8FAFC] rounded-xl p-3 text-center">
                    <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center mx-auto mb-2">
                      <BookOpen className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-xl font-black text-slate-900 tabular-nums">{lessons}</p>
                    <p className="text-xs text-slate-500 font-medium">Lessons done</p>
                  </div>
                  <div className="bg-[#F8FAFC] rounded-xl p-3 text-center">
                    <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center mx-auto mb-2">
                      <Trophy className="h-4 w-4 text-purple-600" />
                    </div>
                    <p className="text-xl font-black text-slate-900 tabular-nums">{examMap[student.id]?.count ?? 0}</p>
                    <p className="text-xs text-slate-500 font-medium">Exams taken</p>
                  </div>
                  <div className="bg-[#F8FAFC] rounded-xl p-3 text-center">
                    <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="h-4 w-4 text-amber-600" />
                    </div>
                    <p className={`text-xl font-black tabular-nums ${
                      avg == null ? "text-slate-300" :
                      avg >= 60 ? "text-green-600" : avg >= 40 ? "text-amber-600" : "text-red-500"
                    }`}>
                      {avg != null ? `${avg}%` : "—"}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">Avg score</p>
                  </div>
                </div>

                <Link
                  href={`/parent/progress?student=${student.id}`}
                  className="mt-4 flex items-center justify-center gap-2 h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-[#1B3A8A]/30 transition-all"
                >
                  View detailed progress <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg mb-2">No linked students yet</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
            Contact the school administrator to link your ward&apos;s account to yours.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold">
            <UserPlus className="h-4 w-4" /> Ask admin to link your ward
          </div>
        </div>
      )}
    </div>
  );
}
