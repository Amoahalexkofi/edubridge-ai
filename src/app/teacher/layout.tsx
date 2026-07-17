import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import TeacherNav from "./_components/TeacherNav";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const role = roleRow?.role ?? "student";
  if (role !== "teacher" && role !== "admin" && role !== "super_admin") {
    redirect("/student");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, content_approved")
    .eq("id", user.id)
    .single();

  // A teacher who hasn't been approved by an admin can't publish content yet.
  const pendingApproval = role === "teacher" && !profile?.content_approved;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F3EF] to-[#E5E3DC]">
      <TeacherNav userName={profile?.full_name ?? "Teacher"} />
      <main className="lg:pl-60 min-h-screen">
        <div className="pt-14 pb-20 lg:pt-0 lg:pb-0">
          {pendingApproval && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
                <Clock className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">Your teacher account is pending approval</p>
                  <p className="text-sm text-amber-700 mt-0.5">
                    You can look around, but publishing lessons and questions is disabled until an admin approves your account. You&apos;ll be able to create content as soon as they do.
                  </p>
                </div>
              </div>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
