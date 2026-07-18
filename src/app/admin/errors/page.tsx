import { redirect } from "next/navigation";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/auth";
import { AlertTriangle, Server, Monitor, ShieldCheck } from "lucide-react";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true,
  });
}

export default async function AdminErrorsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: errors } = await admin
    .from("error_logs")
    .select("id, message, source, path, count, last_seen, user_agent")
    .order("last_seen", { ascending: false })
    .limit(100);

  const rows = errors ?? [];
  const totalOccurrences = rows.reduce((s, e) => s + (e.count ?? 1), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a]">Errors</h1>
        <p className="text-sm text-[#64748B] mt-1">Server and browser errors from the live app — most recent first, deduplicated.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Distinct errors" value={rows.length} tone="slate" />
        <Stat label="Total occurrences" value={totalOccurrences} tone="amber" />
        <Stat label="Showing" value={`${rows.length}/100`} tone="slate" />
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#E6E4DE] py-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-[#F0FDF4] flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-7 w-7 text-[#16A34A]" />
          </div>
          <p className="font-bold text-[#334155]">No errors logged 🎉</p>
          <p className="text-sm text-[#94a3b8] mt-1">When something breaks for a user, it&apos;ll show up here.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((e) => (
            <div key={e.id} className="bg-white rounded-xl border border-[#E6E4DE] eb-card p-4">
              <div className="flex items-start gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${e.source === "server" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
                  {e.source === "server" ? <Server className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0f172a] break-words">{e.message}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[11px] text-[#94a3b8]">
                    <span className={`font-bold px-2 py-0.5 rounded-full ${e.source === "server" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"}`}>{e.source}</span>
                    {e.path && <span className="font-mono text-[#64748B]">{e.path}</span>}
                    <span>· last seen {formatWhen(e.last_seen)}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-black text-[#0f172a] tabular-nums flex items-center gap-1 justify-end">
                    <AlertTriangle className="h-3.5 w-3.5 text-[#E8722A]" />{e.count}
                  </p>
                  <p className="text-[10px] text-[#94a3b8]">times</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone: "amber" | "slate" }) {
  const styles = tone === "amber" ? "bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]" : "bg-white border-[#E6E4DE] text-[#0f172a]";
  return (
    <div className={`rounded-2xl border p-4 ${styles}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
      <p className="text-2xl font-black tabular-nums mt-1">{value}</p>
    </div>
  );
}
