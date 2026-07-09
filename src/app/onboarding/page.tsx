import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import OnboardingForm from "./_components/OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: roleRow }] = await Promise.all([
    supabase.from("profiles").select("full_name, exam_target").eq("id", user.id).single(),
    supabase.from("user_roles").select("role").eq("user_id", user.id).single(),
  ]);

  // Only students onboard here. Anyone else (or a student who already set a
  // target) goes straight to where they belong.
  if (roleRow?.role !== "student") redirect("/");
  if (profile?.exam_target) redirect("/student");

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-[#F2F1EE] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Image src="/logo-no-bg.png" alt="EduBridge AI" width={140} height={140} className="h-14 w-auto object-contain" />
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-[#1B3A8A] to-[#1D4ED8]" />
          <div className="p-8 space-y-6">
            <div className="text-center space-y-1">
              <p className="text-xs font-bold tracking-widest uppercase text-[#1D4ED8]">Almost there</p>
              <h1 className="text-2xl font-black text-[#0f172a]">Welcome, {firstName}!</h1>
              <p className="text-sm text-slate-500">Tell us what you&apos;re preparing for so we can tailor your lessons, practice and mock exams.</p>
            </div>

            <OnboardingForm />
          </div>
          <div className="h-1 bg-gradient-to-r from-[#E8722A] to-[#F59E0B]" />
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">© 2026 EduBridge Educational Solutions · Ghana 🇬🇭</p>
      </div>
    </div>
  );
}
