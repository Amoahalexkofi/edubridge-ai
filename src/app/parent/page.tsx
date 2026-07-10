import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { Users, BookOpen, Trophy, TrendingUp, ArrowRight, Phone } from "lucide-react";
import ParentPhoneForm from "./_components/ParentPhoneForm";

export default async function ParentDashboard() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
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

  const hasStudents = (students?.length ?? 0) > 0;
  const hasPhone = !!profile?.phone;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-8 space-y-6">

      {/* Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Welcome, {firstName}</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor your ward&apos;s learning progress</p>
      </div>

      {/* Phone linking prompt — show when no students linked or phone missing */}
      {(!hasStudents || !hasPhone) && (
        <div className="bg-white rounded-2xl border border-green-200 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <Phone className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 mb-0.5">
                {hasStudents ? "Update your phone number" : "Link to your ward automatically"}
              </p>
              <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                Enter the mobile number your child used when registering. You&apos;ll be linked to their account instantly — no codes needed.
              </p>
              <ParentPhoneForm currentPhone={profile?.phone ?? ""} />
            </div>
          </div>
        </div>
      )}

      {/* Linked students */}
      {hasStudents ? (
        <div className="space-y-4">
          {students!.map((student) => {
            const lessons = lessonsMap[student.id] ?? 0;
            const avg = examMap[student.id]
              ? Math.round(examMap[student.id].total / examMap[student.id].count)
              : null;
            const initials = (student.full_name ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

            return (
              <div key={student.id} className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-5">
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
                      {(student.exam_target ?? "BECE").toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#F8F7F4] rounded-xl p-3 text-center">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-sm">
                      <BookOpen className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-xl font-black text-slate-900 tabular-nums">{lessons}</p>
                    <p className="text-xs text-slate-500 font-medium">Lessons done</p>
                  </div>
                  <div className="bg-[#F8F7F4] rounded-xl p-3 text-center">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mx-auto mb-2 shadow-sm">
                      <Trophy className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-xl font-black text-slate-900 tabular-nums">{examMap[student.id]?.count ?? 0}</p>
                    <p className="text-xs text-slate-500 font-medium">Exams taken</p>
                  </div>
                  <div className="bg-[#F8F7F4] rounded-xl p-3 text-center">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-2 shadow-sm">
                      <TrendingUp className="h-4 w-4 text-white" />
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
                  className="mt-4 flex items-center justify-center gap-2 h-10 rounded-xl border border-[#E6E4DE] text-sm font-semibold text-slate-600 hover:bg-[#F8F7F4] hover:border-[#1B3A8A]/30 transition-all"
                >
                  View detailed progress <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-[#E6E4DE] py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-[#F8F7F4] flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg mb-2">No linked students yet</h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
            Enter your mobile number above. If your child has registered and added your number, you&apos;ll be linked instantly.
          </p>
        </div>
      )}

      {/* Phone update — show at bottom when already linked */}
      {hasStudents && (
        <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Phone className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Your mobile number</p>
            {hasPhone && <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">Saved</span>}
          </div>
          <ParentPhoneForm currentPhone={profile?.phone ?? ""} />
        </div>
      )}
    </div>
  );
}
