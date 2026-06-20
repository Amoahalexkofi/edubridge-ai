import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, ChevronRight, GraduationCap, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function SubjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, exam_target")
    .eq("id", user.id)
    .single();

  const activeExam = (profile?.exam_target ?? "bece").toUpperCase() as "BECE" | "WASSCE";
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  // Subjects with topics and their lessons
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, slug, icon, description, topics(id, lessons(id))")
    .eq("exam_type", activeExam.toLowerCase())
    .order("name");

  // Student's completed lessons
  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id, completed, lessons(topic_id, topics(subject_id))")
    .eq("user_id", user.id)
    .eq("completed", true);

  const completedBySubject: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  progress?.forEach((p: any) => {
    const subjectId = p.lessons?.topics?.subject_id;
    if (subjectId) completedBySubject[subjectId] = (completedBySubject[subjectId] ?? 0) + 1;
  });

  // Compute totals
  const totalSubjects = subjects?.length ?? 0;
  const totalLessons = subjects?.reduce((acc, s) => {
    return acc + (s.topics?.reduce((t, topic) => t + (topic.lessons?.length ?? 0), 0) ?? 0);
  }, 0) ?? 0;
  const totalCompleted = Object.values(completedBySubject).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B3A8A] via-[#1D4ED8] to-[#2563EB] p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full bg-white/5 translate-y-1/2" />

        <div className="relative space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-white/15 text-white">
              <GraduationCap className="h-3 w-3" /> {activeExam} Curriculum
            </span>
            <span className="text-xs text-white/50 font-medium">
              {activeExam === "BECE" ? "Junior High School" : "Senior High School"}
            </span>
          </div>

          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-white leading-tight">
              Your <span className="text-[#93C5FD]">subjects</span>
            </h1>
            <p className="text-white/70 text-sm mt-2">
              Hi <span className="font-bold text-white">{firstName}</span>! Pick any subject to browse topics and start learning.
            </p>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 pt-1 flex-wrap">
            <div>
              <p className="text-xl sm:text-2xl font-black text-white">{totalSubjects}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Subjects</p>
            </div>
            <div className="hidden sm:block w-px h-8 bg-white/20" />
            <div>
              <p className="text-xl sm:text-2xl font-black text-white">{totalLessons}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Lessons</p>
            </div>
            <div className="hidden sm:block w-px h-8 bg-white/20" />
            <div>
              <p className="text-xl sm:text-2xl font-black text-white">{totalCompleted}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────── */}
      {subjects && subjects.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {subjects.map((subject) => {
            const topicCount = subject.topics?.length ?? 0;
            const lessonCount = subject.topics?.reduce((acc, t) => acc + (t.lessons?.length ?? 0), 0) ?? 0;
            const completedLessons = completedBySubject[subject.id] ?? 0;
            const pct = lessonCount > 0 ? Math.round((completedLessons / lessonCount) * 100) : 0;
            const hasContent = lessonCount > 0;
            const started = completedLessons > 0;

            return (
              <Link
                key={subject.id}
                href={`/student/subjects/${subject.slug}`}
                className="group bg-white rounded-2xl border border-[#E8ECF0] p-5 flex flex-col gap-4 hover:border-[#1D4ED8]/30 hover:shadow-md transition-all duration-200"
              >
                {/* Icon + status */}
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-xl bg-[#F8FAFC] border border-[#E8ECF0] flex items-center justify-center text-2xl">
                    {subject.icon ?? "📚"}
                  </div>
                  {started ? (
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#1D4ED8]">
                      {pct}% done
                    </span>
                  ) : hasContent ? (
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#F0FDF4] text-[#16A34A]">
                      Available
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-[#F8FAFC] text-[#94a3b8]">
                      Coming soon
                    </span>
                  )}
                </div>

                {/* Name & description */}
                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-[15px] text-[#0f172a] leading-snug group-hover:text-[#1D4ED8] transition-colors">
                    {subject.name}
                  </p>
                  {subject.description && (
                    <p className="text-xs text-[#94a3b8] line-clamp-2 leading-relaxed">
                      {subject.description}
                    </p>
                  )}
                </div>

                {/* Progress bar */}
                {started && (
                  <div className="h-1 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#1D4ED8]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-[#94a3b8]">
                    <span>{topicCount} {topicCount === 1 ? "topic" : "topics"}</span>
                    {lessonCount > 0 && (
                      <>
                        <span className="w-px h-3 bg-[#E2E8F0]" />
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
                        </span>
                      </>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#CBD5E1] group-hover:text-[#1D4ED8] transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-[#E2E8F0] py-20 text-center space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-[#F1F5F9] flex items-center justify-center mx-auto">
            <BookOpen className="h-8 w-8 text-[#94a3b8]" />
          </div>
          <div>
            <p className="font-semibold text-[#334155]">No {activeExam} subjects yet</p>
            <p className="text-sm text-[#94a3b8] mt-1">
              Content will appear here once added.
            </p>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#E8722A]">
            <Flame className="h-3.5 w-3.5" /> Coming soon
          </div>
        </div>
      )}
    </div>
  );
}
