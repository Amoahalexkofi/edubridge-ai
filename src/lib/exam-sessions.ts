export type SessionStatus = "upcoming" | "live" | "closed";

export function sessionStatus(startsAt: string, endsAt: string, now: number = Date.now()): SessionStatus {
  const s = new Date(startsAt).getTime();
  const e = new Date(endsAt).getTime();
  if (now < s) return "upcoming";
  if (now > e) return "closed";
  return "live";
}

export function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

export const STATUS_STYLE: Record<SessionStatus, string> = {
  live: "bg-green-100 text-green-700",
  upcoming: "bg-amber-100 text-amber-700",
  closed: "bg-slate-100 text-slate-500",
};

export const STATUS_LABEL: Record<SessionStatus, string> = {
  live: "Live now",
  upcoming: "Upcoming",
  closed: "Closed",
};
