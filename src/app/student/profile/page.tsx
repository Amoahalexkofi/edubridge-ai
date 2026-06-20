import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./_components/ProfileForm";
import AvatarUpload from "./_components/AvatarUpload";
import ParentInvite from "./_components/ParentInvite";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, exam_target, avatar_url, phone, parent_phone, school, grade_level")
    .eq("id", user.id)
    .single();

  const { data: parentLink } = await supabase
    .from("parent_student")
    .select("id")
    .eq("student_id", user.id)
    .limit(1)
    .single();

  const fullName = profile?.full_name ?? "";
  const examLabel = (profile?.exam_target ?? "bece").toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      <div className="bg-white rounded-3xl border border-[#E8ECF0] p-6 flex flex-col items-center gap-4 text-center">
        <AvatarUpload
          userId={user.id}
          avatarUrl={profile?.avatar_url ?? null}
          fullName={fullName}
        />
        <div>
          <p className="font-bold text-lg text-[#0f172a]">{fullName || "Your name"}</p>
          <p className="text-sm text-[#94a3b8] mt-0.5">{user.email}</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-[#1B3A8A] text-white text-xs font-bold tracking-wider uppercase">
          {examLabel} Candidate
        </span>
      </div>

      <ParentInvite />

      <ProfileForm
        userId={user.id}
        email={user.email ?? ""}
        parentLinked={!!parentLink}
        initial={{
          full_name: fullName,
          exam_target: profile?.exam_target ?? "bece",
          phone: profile?.phone ?? "",
          parent_phone: profile?.parent_phone ?? "",
          school: profile?.school ?? "",
          grade_level: profile?.grade_level ?? "",
        }}
      />
    </div>
  );
}
