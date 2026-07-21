import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, BookOpen, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { hasBasic } from "@/lib/pricing";
import LessonCompleteButton from "./_components/LessonCompleteButton";
import LessonContent from "./_components/LessonContent";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (user.user_metadata?.app_verified === false) redirect("/student?verify=1"); // unverified students are limited to dashboard + profile

  const { id } = await params;

  const { data: lesson } = await supabase
    .from("lessons")
    .select(`
      id, title, content, order_index,
      topic_id,
      topics(
        id, title,
        subject_id,
        subjects(id, name, slug, icon)
      )
    `)
    .eq("id", id)
    .single();

  if (!lesson) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topic = lesson.topics as any;
  const subject = topic?.subjects;

  // Sibling lessons for prev/next navigation
  const { data: siblings } = await supabase
    .from("lessons")
    .select("id, title, order_index")
    .eq("topic_id", lesson.topic_id)
    .order("order_index");

  const currentIdx = siblings?.findIndex((l) => l.id === id) ?? 0;
  const prevLesson = siblings?.[currentIdx - 1] ?? null;
  const nextLesson = siblings?.[currentIdx + 1] ?? null;

  // First lesson in each topic is a free preview; the rest need Basic+.
  const isFreePreview = currentIdx === 0;
  if (!isFreePreview) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, subscription_expires_at, trial_ends_at, grandfathered")
      .eq("id", user.id)
      .single();
    if (!hasBasic(profile)) redirect("/student/upgrade");
  }

  // Mark as viewed (upsert progress row)
  await supabase.from("lesson_progress").upsert(
    { user_id: user.id, lesson_id: id, last_viewed_at: new Date().toISOString() },
    { onConflict: "user_id,lesson_id", ignoreDuplicates: false }
  );

  // Check if already completed
  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("completed")
    .eq("user_id", user.id)
    .eq("lesson_id", id)
    .single();

  const isCompleted = progress?.completed ?? false;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[#64748B] mb-6 flex-wrap">
        <Link href="/student/subjects" className="hover:text-[#0f172a] transition-colors">Subjects</Link>
        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
        {subject && (
          <>
            <Link href={`/student/subjects/${subject.slug}`} className="hover:text-[#0f172a] transition-colors">
              {subject.icon} {subject.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
          </>
        )}
        <span className="text-[#0f172a] font-medium">{topic?.title}</span>
      </nav>

      {/* Lesson card */}
      <article className="bg-white rounded-2xl border border-[#E6E4DE] eb-card overflow-hidden mb-6">

        {/* Header */}
        <div className="px-6 py-5 border-b border-[#EEEDE8]">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center flex-shrink-0 mt-0.5">
              <BookOpen className="h-5 w-5 text-[#1D4ED8]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#64748B] font-medium mb-1">
                Lesson {currentIdx + 1} of {siblings?.length ?? 1}
              </p>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-[#0f172a] leading-tight">
                {lesson.title}
              </h1>
            </div>
            {isCompleted && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 flex-shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs font-semibold text-green-600">Completed</span>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {lesson.content ? (
            <LessonContent content={lesson.content} />
          ) : (
            <div className="text-center py-10">
              <BookOpen className="h-8 w-8 text-[#CBD5E1] mx-auto mb-3" />
              <p className="text-sm text-[#94a3b8]">Lesson content coming soon.</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-[#EEEDE8] flex items-center justify-between gap-3 flex-wrap">
          <LessonCompleteButton lessonId={id} userId={user.id} isCompleted={isCompleted} />
          {nextLesson && (
            <Link
              href={`/student/lessons/${nextLesson.id}`}
              className="flex items-center gap-1.5 px-4 py-2.5 h-10 rounded-xl bg-[#1D4ED8] hover:bg-[#1e40af] text-white text-sm font-semibold transition-colors"
            >
              Next lesson <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </article>

      {/* Prev / Next navigation */}
      <div className="grid grid-cols-2 gap-3">
        {prevLesson ? (
          <Link
            href={`/student/lessons/${prevLesson.id}`}
            className="flex items-center gap-2 p-4 bg-white rounded-xl border border-[#E6E4DE] eb-card eb-lift hover:border-[#1D4ED8]/40 group"
          >
            <ArrowLeft className="h-4 w-4 text-[#64748B] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-[#94a3b8]">Previous</p>
              <p className="text-sm font-semibold text-[#334155] truncate">{prevLesson.title}</p>
            </div>
          </Link>
        ) : (
          <div />
        )}
        {nextLesson ? (
          <Link
            href={`/student/lessons/${nextLesson.id}`}
            className="flex items-center gap-2 p-4 bg-white rounded-xl border border-[#E6E4DE] eb-card eb-lift hover:border-[#1D4ED8]/40 text-right col-start-2"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#94a3b8]">Next</p>
              <p className="text-sm font-semibold text-[#334155] truncate">{nextLesson.title}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-[#64748B] flex-shrink-0" />
          </Link>
        ) : (
          <div />
        )}
      </div>

      {/* Back to subject */}
      {subject && (
        <div className="mt-4 text-center">
          <Link
            href={`/student/subjects/${subject.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0f172a] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to {subject.name}
          </Link>
        </div>
      )}
    </div>
  );
}
