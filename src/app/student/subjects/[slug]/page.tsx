import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, CheckCircle2,
  ChevronRight, FileText, PlayCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { subjectGradient, subjectIcon } from "@/lib/subject-style";

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (user.user_metadata?.app_verified === false) redirect("/student?verify=1"); // unverified students are limited to dashboard + profile

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
  const SubjIcon = subjectIcon(subject.name);

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
      <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className={`h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br ${subjectGradient(subject.color)} flex items-center justify-center shadow-sm flex-shrink-0`}>
            <SubjIcon className="h-7 w-7 sm:h-8 sm:w-8 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a]">
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
                <div className="h-2 bg-[#EEEDE8] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#1B3A8A] to-[#1D4ED8] rounded-full transition-all"
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

              const inner = (
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Topic number / complete badge */}
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    isComplete ? "bg-[#22C55E]/10 text-[#16A34A]" : "bg-[#F2F1EE] text-[#64748B]"
                  }`}>
                    {isComplete ? <CheckCircle2 className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} /> : idx + 1}
                  </div>

                  {/* Topic info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-[15px] text-[#0f172a] leading-snug truncate group-hover:text-[#1D4ED8] transition-colors">
                      {topic.title}
                    </p>
                    {topic.description && (
                      <p className="text-xs text-[#94a3b8] mt-0.5 truncate">{topic.description}</p>
                    )}
                    <div className="flex items-center gap-2.5 mt-2">
                      <span className="flex items-center gap-1 text-xs text-[#64748B] flex-shrink-0">
                        <BookOpen className="h-3.5 w-3.5" /> {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
                      </span>
                      {lessonCount > 0 && (
                        <div className="h-1.5 flex-1 max-w-[160px] bg-[#EEEDE8] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isComplete ? "bg-[#22C55E]" : "bg-gradient-to-r from-[#1B3A8A] to-[#1D4ED8]"}`}
                            style={{ width: `${topicPct}%` }}
                          />
                        </div>
                      )}
                      {topicCompleted > 0 && (
                        <span className={`text-[11px] font-bold tabular-nums ${isComplete ? "text-[#16A34A]" : "text-[#1D4ED8]"}`}>{topicPct}%</span>
                      )}
                    </div>
                  </div>

                  {/* State pill */}
                  {firstLesson ? (
                    <span className={`flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-xs font-bold flex-shrink-0 transition-colors ${
                      isComplete
                        ? "bg-[#F0FDF4] text-[#16A34A]"
                        : topicCompleted > 0
                        ? "bg-[#EFF6FF] text-[#1D4ED8]"
                        : "bg-[#1D4ED8] text-white group-hover:bg-[#1e40af]"
                    }`}>
                      {isComplete ? (
                        <><CheckCircle2 className="h-3.5 w-3.5" /> Review</>
                      ) : topicCompleted > 0 ? (
                        <><PlayCircle className="h-3.5 w-3.5" /> Continue</>
                      ) : (
                        <><PlayCircle className="h-3.5 w-3.5" /> Start</>
                      )}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-[#CBD5E1] flex-shrink-0">
                      <FileText className="h-3.5 w-3.5" /> Soon
                    </span>
                  )}
                </div>
              );

              return firstLesson ? (
                <Link
                  key={topic.id}
                  href={`/student/lessons/${firstLesson.id}`}
                  className="block bg-white rounded-2xl border border-[#E6E4DE] eb-card eb-lift p-4 group hover:border-[#1D4ED8]/40"
                >
                  {inner}
                </Link>
              ) : (
                <div key={topic.id} className="block bg-white rounded-2xl border border-[#E6E4DE] eb-card p-4 opacity-75">
                  {inner}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-[#E6E4DE] py-14 text-center">
            <div className="h-12 w-12 rounded-2xl bg-[#F2F1EE] flex items-center justify-center mx-auto mb-3">
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
        <div className="flex items-center justify-between bg-white rounded-2xl border border-[#E6E4DE] eb-card p-4">
          <div>
            <p className="text-sm font-semibold text-[#0f172a]">Ready to practice?</p>
            <p className="text-xs text-[#64748B]">Test what you've learned in {subject.name}</p>
          </div>
          <Link
            href={`/student/practice?subject=${subject.id}`}
            className="flex items-center gap-1.5 px-4 py-3 h-11 bg-[#1D4ED8] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
          >
            Practice <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
