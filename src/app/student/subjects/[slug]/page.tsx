import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, CheckCircle2,
  ChevronRight, FileText, PlayCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { slug } = await params;

  // Fetch subject
  const { data: subject } = await supabase
    .from("subjects")
    .select("id, name, slug, icon, color, description, exam_type")
    .eq("slug", slug)
    .single();

  if (!subject) notFound();

  // Fetch topics with lessons
  const { data: topics } = await supabase
    .from("topics")
    .select("id, title, description, order_index, lessons(id, title)")
    .eq("subject_id", subject.id)
    .order("order_index");

  // All lesson IDs in this subject
  const allLessonIds = topics?.flatMap((t) => t.lessons?.map((l) => l.id) ?? []) ?? [];

  // Student's progress on those lessons
  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id, completed")
    .eq("user_id", user.id)
    .in("lesson_id", allLessonIds.length > 0 ? allLessonIds : ["none"]);

  const completedSet = new Set(
    progress?.filter((p) => p.completed).map((p) => p.lesson_id) ?? []
  );

  const totalLessons = allLessonIds.length;
  const totalCompleted = completedSet.size;
  const overallPct = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Back */}
      <Link
        href="/student/subjects"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] hover:text-[#0f172a] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Subjects
      </Link>

      {/* Subject header */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-3xl flex-shrink-0">
            {subject.icon ?? "📚"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-[#0f172a]">
                {subject.name}
              </h1>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1D4ED8] text-white">
                {subject.exam_type}
              </span>
            </div>
            {subject.description && (
              <p className="text-sm text-[#64748B] mt-1 leading-relaxed">{subject.description}</p>
            )}

            {/* Overall progress */}
            {totalLessons > 0 && (
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-[#64748B]">{totalCompleted} of {totalLessons} lessons completed</span>
                  <span className="text-[#1D4ED8]">{overallPct}%</span>
                </div>
                <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1D4ED8] rounded-full transition-all"
                    style={{ width: `${overallPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Topics list */}
      <div>
        <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wider mb-3">
          Topics · {topics?.length ?? 0}
        </h2>

        {topics && topics.length > 0 ? (
          <div className="space-y-2.5">
            {topics.map((topic, idx) => {
              const lessonCount = topic.lessons?.length ?? 0;
              const topicCompleted = topic.lessons?.filter((l) => completedSet.has(l.id)).length ?? 0;
              const topicPct = lessonCount > 0 ? Math.round((topicCompleted / lessonCount) * 100) : 0;
              const isComplete = lessonCount > 0 && topicCompleted === lessonCount;
              const firstLesson = topic.lessons?.[0];

              return (
                <div
                  key={topic.id}
                  className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:border-[#1D4ED8]/30 hover:shadow-sm transition-all group"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Topic number / complete badge */}
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 ${
                        isComplete
                          ? "bg-[#22C55E]/10 text-[#22C55E]"
                          : "bg-[#F1F5F9] text-[#64748B]"
                      }`}>
                        {isComplete ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                      </div>

                      {/* Topic info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base text-[#0f172a] leading-snug">
                          {topic.title}
                        </p>
                        {topic.description && (
                          <p className="text-xs text-[#94a3b8] mt-0.5 line-clamp-2 leading-relaxed">
                            {topic.description}
                          </p>
                        )}

                        {/* Stats row */}
                        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-[#64748B]">
                            <BookOpen className="h-3.5 w-3.5" />
                            {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
                          </span>
                          {topicCompleted > 0 && (
                            <span className="flex items-center gap-1 text-xs text-[#22C55E] font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {topicCompleted} completed
                            </span>
                          )}
                        </div>

                        {/* Progress bar */}
                        {lessonCount > 0 && (
                          <div className="mt-2.5">
                            <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${isComplete ? "bg-[#22C55E]" : "bg-[#1D4ED8]"}`}
                                style={{ width: `${topicPct}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      {firstLesson ? (
                        <Link
                          href={`/student/lessons/${firstLesson.id}`}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all ${
                            isComplete
                              ? "bg-[#F0FDF4] text-[#22C55E] hover:bg-[#DCFCE7]"
                              : topicCompleted > 0
                              ? "bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#DBEAFE]"
                              : "bg-[#1D4ED8] text-white hover:bg-[#1e40af]"
                          }`}
                        >
                          {isComplete ? (
                            <><CheckCircle2 className="h-3.5 w-3.5" /> Review</>
                          ) : topicCompleted > 0 ? (
                            <><PlayCircle className="h-3.5 w-3.5" /> Continue</>
                          ) : (
                            <><PlayCircle className="h-3.5 w-3.5" /> Start</>
                          )}
                        </Link>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-[#CBD5E1] flex-shrink-0">
                          <FileText className="h-3.5 w-3.5" /> No lessons
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-[#E2E8F0] py-14 text-center">
            <div className="h-12 w-12 rounded-2xl bg-[#F1F5F9] flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6 text-[#94a3b8]" />
            </div>
            <p className="font-semibold text-[#334155] text-sm">No topics yet</p>
            <p className="text-xs text-[#94a3b8] mt-1">
              A teacher will add topics and lessons for this subject.
            </p>
          </div>
        )}
      </div>

      {/* Bottom CTA when topics exist */}
      {topics && topics.length > 0 && totalLessons > 0 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <div>
            <p className="text-sm font-semibold text-[#0f172a]">Ready to practice?</p>
            <p className="text-xs text-[#64748B]">Test what you've learned in {subject.name}</p>
          </div>
          <Link
            href={`/student/practice?subject=${subject.id}`}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1D4ED8] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
          >
            Practice <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
