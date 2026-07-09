import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TeacherNav from "./_components/TeacherNav";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#F2F1EE]">
      <TeacherNav userName={profile?.full_name ?? "Teacher"} />
      <main className="lg:pl-60 min-h-screen">
        <div className="pt-14 pb-20 lg:pt-0 lg:pb-0">
          {children}
        </div>
      </main>
    </div>
  );
}
