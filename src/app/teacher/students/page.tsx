import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Users, TrendingUp } from "lucide-react";

export default async function TeacherStudentsPage() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Service role bypasses RLS so we see all students, not just the caller's own row
  const { data: studentRoles } = await admin
    .from("user_roles")
    .select("user_id")
    .eq("role", "student");

  const studentIds = studentRoles?.map((r) => r.user_id) ?? [];

  const { data: profiles } = studentIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, full_name, exam_target, school, grade_level")
        .in("id", studentIds)
        .order("full_name")
    : { data: [] };

  // Progress per student
  const { data: progressData } = await supabase
    .from("lesson_progress")
    .select("user_id, completed")
    .eq("completed", true);

  const progressMap: Record<string, number> = {};
  progressData?.forEach((p) => {
    progressMap[p.user_id] = (progressMap[p.user_id] ?? 0) + 1;
  });

  const { data: examData } = await supabase
    .from("exam_attempts")
    .select("user_id, score, total_marks")
    .eq("status", "submitted")
    .not("score", "is", null);

  const examMap: Record<string, { total: number; count: number }> = {};
  examData?.forEach((e) => {
    if (!examMap[e.user_id]) examMap[e.user_id] = { total: 0, count: 0 };
    examMap[e.user_id].total += (e.score / e.total_marks) * 100;
    examMap[e.user_id].count++;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a]">Students</h1>
        <p className="text-sm text-[#64748B] mt-1">{profiles?.length ?? 0} registered students</p>
      </div>

      {profiles && profiles.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] text-xs font-semibold text-[#94a3b8] uppercase tracking-wider px-4 py-3 border-b border-[#F1F5F9] bg-[#F8F7F4]">
            <span>Student</span>
            <span className="w-20 text-center">Exam</span>
            <span className="w-24 text-center">Lessons done</span>
            <span className="w-20 text-right">Avg score</span>
          </div>
          <div className="divide-y divide-[#F1F5F9]">
            {profiles.map((p) => {
              const lessons = progressMap[p.id] ?? 0;
              const avg = examMap[p.id]
                ? Math.round(examMap[p.id].total / examMap[p.id].count)
                : null;
              const initials = (p.full_name ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div key={p.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center px-4 py-3 hover:bg-[#F8F7F4] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-[#1B3A8A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0f172a] truncate">{p.full_name ?? "—"}</p>
                      <p className="text-xs text-[#94a3b8]">{p.school ?? "—"} · {p.grade_level ?? "—"}</p>
                    </div>
                  </div>
                  <span className="w-20 text-center">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#1D4ED8] text-white">{p.exam_target ?? "—"}</span>
                  </span>
                  <span className="w-24 text-center">
                    <span className="flex items-center justify-center gap-1 text-sm font-semibold text-[#334155]">
                      <TrendingUp className="h-3.5 w-3.5 text-green-500" /> {lessons}
                    </span>
                  </span>
                  <span className="w-20 text-right">
                    {avg != null ? (
                      <span className={`text-sm font-black tabular-nums ${avg >= 60 ? "text-green-600" : avg >= 40 ? "text-amber-600" : "text-red-500"}`}>
                        {avg}%
                      </span>
                    ) : (
                      <span className="text-xs text-[#CBD5E1]">—</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-[#E6E4DE] py-14 text-center">
          <Users className="h-10 w-10 text-[#CBD5E1] mx-auto mb-3" />
          <p className="font-semibold text-[#334155]">No students yet</p>
          <p className="text-sm text-[#94a3b8] mt-1">Students will appear here once they sign up.</p>
        </div>
      )}
    </div>
  );
}
