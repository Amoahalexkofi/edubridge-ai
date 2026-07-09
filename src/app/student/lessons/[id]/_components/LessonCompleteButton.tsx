"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LessonCompleteButton({
  lessonId,
  userId,
  isCompleted: initial,
}: {
  lessonId: string;
  userId: string;
  isCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const supabase = createClient();
    const next = !completed;
    const { error } = await supabase
      .from("lesson_progress")
      .upsert(
        { user_id: userId, lesson_id: lessonId, completed: next, last_viewed_at: new Date().toISOString() },
        { onConflict: "user_id,lesson_id" }
      );
    if (!error) setCompleted(next);
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${
        completed
          ? "bg-green-50 text-green-600 hover:bg-green-100 border border-green-100"
          : "bg-[#F8F7F4] text-[#475569] hover:bg-[#F2F1EE] border border-[#E6E4DE]"
      }`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : completed ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <Circle className="h-4 w-4" />
      )}
      {completed ? "Completed" : "Mark as complete"}
    </button>
  );
}
