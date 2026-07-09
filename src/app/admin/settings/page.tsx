import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { Settings, Globe, Bell, Shield, Database, Mail } from "lucide-react";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, exam_target, school")
    .eq("id", user.id)
    .single();

  const sections = [
    {
      icon: Globe,
      title: "Platform",
      description: "General platform configuration",
      items: [
        { label: "Platform name", value: "EduBridge AI", status: "active" },
        { label: "Supported exams", value: "BECE, WASSCE", status: "active" },
        { label: "Default language", value: "English", status: "active" },
        { label: "Custom domain", value: "Not configured", status: "pending" },
      ],
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Email and push notification settings",
      items: [
        { label: "Email verification", value: "Enabled", status: "active" },
        { label: "Welcome email", value: "Enabled", status: "active" },
        { label: "Exam reminders", value: "Coming soon", status: "soon" },
        { label: "Progress reports to parents", value: "Coming soon", status: "soon" },
      ],
    },
    {
      icon: Shield,
      title: "Auth & Security",
      description: "Authentication and access control",
      items: [
        { label: "Email/password login", value: "Enabled", status: "active" },
        { label: "Google OAuth", value: "Coming soon", status: "soon" },
        { label: "Email verification required", value: "Enabled", status: "active" },
        { label: "Role-based access control", value: "Enabled", status: "active" },
      ],
    },
    {
      icon: Database,
      title: "Content",
      description: "Curriculum and content management",
      items: [
        { label: "BECE subjects", value: "22 subjects", status: "active" },
        { label: "WASSCE subjects", value: "Coming soon", status: "soon" },
        { label: "AI Tutor", value: "Coming soon", status: "soon" },
        { label: "Mock exam engine", value: "In progress", status: "progress" },
      ],
    },
    {
      icon: Mail,
      title: "Integrations",
      description: "Third-party service connections",
      items: [
        { label: "Supabase (database)", value: "Connected", status: "active" },
        { label: "Vercel (hosting)", value: "Connected", status: "active" },
        { label: "AI provider", value: "Not configured", status: "pending" },
        { label: "SMS gateway", value: "Coming soon", status: "soon" },
      ],
    },
  ];

  const statusStyles: Record<string, string> = {
    active:   "bg-green-50 text-green-700 border-green-200",
    pending:  "bg-amber-50 text-amber-700 border-amber-200",
    soon:     "bg-[#F1F0EC] text-slate-500 border-[#E6E4DE]",
    progress: "bg-blue-50 text-blue-700 border-blue-200",
  };

  const statusLabels: Record<string, string> = {
    active:   "Active",
    pending:  "Pending",
    soon:     "Soon",
    progress: "In progress",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Platform configuration and status overview</p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-semibold">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          System operational
        </div>
      </div>

      {/* Admin profile card */}
      <div className="bg-white rounded-2xl border border-[#E6E4DE] shadow-sm p-5 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {(profile?.full_name ?? "A").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900">{profile?.full_name ?? "Administrator"}</p>
          <p className="text-sm text-slate-500">Super Administrator · Full access</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold">Admin</span>
      </div>

      {/* Settings sections */}
      <div className="space-y-4">
        {sections.map(({ icon: Icon, title, description, items }) => (
          <div key={title} className="bg-white rounded-2xl border border-[#E6E4DE] shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#EEEDE8] bg-[#F8F7F4]/60">
              <div className="h-8 w-8 rounded-lg bg-[#F1F0EC] flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{title}</p>
                <p className="text-xs text-slate-500">{description}</p>
              </div>
            </div>

            {/* Items */}
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.label} className="flex items-center justify-between px-5 py-3.5">
                  <p className="text-sm text-slate-700 font-medium">{item.label}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">{item.value}</span>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusStyles[item.status]}`}>
                      {statusLabels[item.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-xs text-slate-400 text-center pb-4">
        Settings configuration UI coming in a future update. Changes are managed via environment variables and Supabase dashboard.
      </p>
    </div>
  );
}
