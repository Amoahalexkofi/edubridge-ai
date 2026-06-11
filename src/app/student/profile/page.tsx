import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./_components/ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, exam_target, avatar_url, phone, school, grade_level")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a]">Profile</h1>
        <p className="text-sm text-[#64748B] mt-1">Update your personal details and exam target</p>
      </div>
      <ProfileForm
        userId={user.id}
        email={user.email ?? ""}
        initial={{
          full_name: profile?.full_name ?? "",
          exam_target: profile?.exam_target ?? "bece",
          phone: profile?.phone ?? "",
          school: profile?.school ?? "",
          grade_level: profile?.grade_level ?? "",
        }}
      />
    </div>
  );
}
