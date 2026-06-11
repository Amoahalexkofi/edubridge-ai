import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, ArrowRight, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  mathematics:     { bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-100"   },
  english:         { bg: "bg-green-50",  text: "text-green-600",  border: "border-green-100"  },
  science:         { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
  "social studies":{ bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100" },
  ict:             { bg: "bg-cyan-50",   text: "text-cyan-600",   border: "border-cyan-100"   },
  history:         { bg: "bg-amber-50",  text: "text-amber-600",  border: "border-amber-100"  },
  geography:       { bg: "bg-teal-50",   text: "text-teal-600",   border: "border-teal-100"   },
  economics:       { bg: "bg-rose-50",   text: "text-rose-600",   border: "border-rose-100"   },
  physics:         { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100" },
  chemistry:       { bg: "bg-pink-50",   text: "text-pink-600",   border: "border-pink-100"   },
  biology:         { bg: "bg-lime-50",   text: "text-lime-600",   border: "border-lime-100"   },
};

function getColor(name: string) {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(colorMap)) {
    if (key.includes(k)) return v;
  }
  return { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-100" };
}

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("exam_target")
    .eq("id", user.id)
    .single();

  const params = await searchParams;
  const activeExam = params.exam ?? profile?.exam_target ?? "BECE";

  // Fetch subjects with topic counts
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, slug, icon, color, description, topics(id)")
    .eq("exam_type", activeExam.toLowerCase())
    .order("name");

  // Fetch student's lesson progress to compute per-subject progress
  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id, completed, lessons(topic_id, topics(subject_id))")
    .eq("user_id", user.id)
    .eq("completed", true);

  // Build a set of subject_ids the student has completed lessons in
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completedBySubject: Record<string, number> = {};
  progress?.forEach((p: any) => {
    const subjectId = p.lessons?.topics?.subject_id;
    if (subjectId) completedBySubject[subjectId] = (completedBySubject[subjectId] ?? 0) + 1;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a]">Subjects</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Pick a subject to browse topics and lessons
        </p>
      </div>

      {/* BECE / WASSCE tabs */}
      <div className="flex gap-2">
        {(["BECE", "WASSCE"] as const).map((exam) => (
          <Link
            key={exam}
            href={`/student/subjects?exam=${exam}`}
            className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all ${
              activeExam === exam
                ? "bg-[#1D4ED8] text-white border-[#1D4ED8] shadow-sm"
                : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#1D4ED8]/40"
            }`}
          >
            {exam}
          </Link>
        ))}
      </div>

      {/* Subjects grid */}
      {subjects && subjects.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {subjects.map((subject) => {
            const topicCount = subject.topics?.length ?? 0;
            const completedLessons = completedBySubject[subject.id] ?? 0;
            const color = getColor(subject.name);

            return (
              <Link
                key={subject.id}
                href={`/student/subjects/${subject.slug}`}
                className="group bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-col gap-3 hover:border-[#1D4ED8]/40 hover:shadow-md transition-all"
              >
                {/* Icon */}
                <div className={`h-12 w-12 rounded-2xl border flex items-center justify-center text-2xl ${color.bg} ${color.border}`}>
                  {subject.icon ?? "📚"}
                </div>

                {/* Name & desc */}
                <div className="flex-1">
                  <p className="font-bold text-sm text-[#0f172a] leading-snug">{subject.name}</p>
                  {subject.description && (
                    <p className="text-xs text-[#94a3b8] mt-1 line-clamp-2 leading-relaxed">
                      {subject.description}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#64748B]">
                    {topicCount} {topicCount === 1 ? "topic" : "topics"}
                  </span>
                  {completedLessons > 0 ? (
                    <span className={`text-xs font-semibold ${color.text}`}>
                      {completedLessons} done
                    </span>
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[#CBD5E1] group-hover:text-[#1D4ED8] transition-colors" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-[#E2E8F0] py-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-[#F1F5F9] flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-7 w-7 text-[#94a3b8]" />
          </div>
          <p className="font-semibold text-[#334155]">No {activeExam} subjects yet</p>
          <p className="text-sm text-[#94a3b8] mt-1 max-w-xs mx-auto">
            Subjects will appear here once a teacher or admin adds them.
          </p>
          <Link
            href={`/student/subjects?exam=${activeExam === "BECE" ? "WASSCE" : "BECE"}`}
            className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-[#1D4ED8] hover:underline"
          >
            Browse {activeExam === "BECE" ? "WASSCE" : "BECE"} subjects instead
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
