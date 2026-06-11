"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const roleRedirects: Record<string, string> = {
  student: "/student",
  teacher: "/teacher",
  parent: "/parent",
  admin: "/admin",
  super_admin: "/admin",
};

function Processor({ onError }: { onError: (msg: string) => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code = searchParams.get("code");
    const role = searchParams.get("role") ?? "student";

    if (!code) {
      onError("No code parameter in URL");
      return;
    }

    const supabase = createClient();

    supabase.auth.exchangeCodeForSession(code).then(async ({ data, error }) => {
      if (error) {
        onError(`exchangeCodeForSession failed: ${error.message} (status: ${error.status})`);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        onError("Session exchanged but getUser() returned null");
        return;
      }

      let finalRole = role;
      try {
        const { data: existing } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (!existing) {
          await supabase.from("user_roles").insert({ user_id: user.id, role });
        } else if (role !== "student" && existing.role === "student") {
          // Trigger defaulted to student but user chose a different role at signup
          await supabase.from("user_roles").update({ role }).eq("user_id", user.id);
          finalRole = role;
        } else {
          finalRole = existing.role;
        }
      } catch {
        // table doesn't exist yet
      }

      router.replace(roleRedirects[finalRole] ?? "/student");
    });
  }, [router, searchParams, onError]);

  return null;
}

function Spinner({ error }: { error: string | null }) {
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="max-w-lg w-full bg-red-50 border border-red-200 rounded-2xl p-6">
          <p className="font-bold text-red-700 mb-2">Auth error — share this screenshot</p>
          <pre className="text-xs text-red-600 whitespace-pre-wrap break-all bg-red-100 rounded-xl p-3">
            {error}
          </pre>
          <a href="/login" className="mt-4 inline-block text-sm text-blue-600 underline">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="h-10 w-10 rounded-full border-[3px] border-[#1B3A8A] border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-slate-600 text-sm font-medium">Signing you in…</p>
      </div>
    </div>
  );
}

function Inner() {
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <Spinner error={error} />
      <Processor onError={setError} />
    </>
  );
}

export default function AuthProcessingPage() {
  return (
    <Suspense fallback={<Spinner error={null} />}>
      <Inner />
    </Suspense>
  );
}
