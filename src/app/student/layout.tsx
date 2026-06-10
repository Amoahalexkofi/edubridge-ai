import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudentNav from "./_components/StudentNav";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, exam_target, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <StudentNav
        userName={profile?.full_name ?? "Student"}
        examTarget={profile?.exam_target ?? null}
        avatarUrl={profile?.avatar_url ?? null}
      />

      {/* Desktop: offset for sidebar. Mobile: top header + bottom nav spacers */}
      <main className="lg:pl-60 min-h-screen">
        <div className="pt-14 pb-20 lg:pt-0 lg:pb-0">
          {children}
        </div>
      </main>
    </div>
  );
}
