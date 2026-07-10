import {
  BookOpen, BookText, BookMarked, Calculator, Sigma, FlaskConical, Atom,
  Microscope, Dna, Laptop, Palette, Wrench, Languages, Map, Landmark,
  TrendingUp, Users, GraduationCap, type LucideIcon,
} from "lucide-react";

/**
 * Maps a subject's stored color name (emerald, amber, sky, …) to a saturated
 * gradient tile for its card. Full class strings are written literally so
 * Tailwind's scanner generates them (dynamic `from-${x}` would be purged).
 */
const GRADIENTS: Record<string, string> = {
  emerald: "from-emerald-500 to-emerald-600",
  amber:   "from-amber-500 to-amber-600",
  sky:     "from-sky-500 to-sky-600",
  rose:    "from-rose-500 to-rose-600",
  violet:  "from-violet-500 to-violet-600",
  indigo:  "from-indigo-500 to-indigo-600",
  pink:    "from-pink-500 to-pink-600",
  teal:    "from-teal-500 to-teal-600",
  blue:    "from-blue-500 to-blue-600",
  green:   "from-green-500 to-green-600",
  purple:  "from-purple-500 to-purple-600",
  orange:  "from-orange-500 to-orange-600",
  cyan:    "from-cyan-500 to-cyan-600",
  red:     "from-red-500 to-red-600",
  lime:    "from-lime-500 to-lime-600",
  fuchsia: "from-fuchsia-500 to-fuchsia-600",
  slate:   "from-slate-500 to-slate-600",
};

/** Gradient classes for a subject tile. Pair with `bg-gradient-to-br`. */
export function subjectGradient(color: string | null | undefined): string {
  return GRADIENTS[color ?? ""] ?? "from-slate-500 to-slate-600";
}

/**
 * A consistent line icon per subject — replaces device-inconsistent emoji so
 * the tiles read as a professional, cohesive icon set. Keyword-matched by
 * name, most-specific first, with a graduation-cap fallback.
 */
export function subjectIcon(name: string | null | undefined): LucideIcon {
  const n = (name ?? "").toLowerCase();
  if (n.includes("elective") && n.includes("math")) return Sigma;
  if (n.includes("math")) return Calculator;
  if (n.includes("biology")) return Dna;
  if (n.includes("chemistry")) return FlaskConical;
  if (n.includes("physics")) return Atom;
  if (n.includes("science")) return Microscope;          // Integrated Science
  if (n.includes("comput") || n.includes("ict")) return Laptop;
  if (n.includes("creative") || n.includes("art")) return Palette;
  if (n.includes("career") || n.includes("technolog") || n.includes("technical")) return Wrench;
  if (n.includes("literature")) return BookText;
  if (n.includes("english")) return BookOpen;
  if (n.includes("french") || n.includes("language")) return Languages;
  if (n.includes("geograph")) return Map;
  if (n.includes("government")) return Landmark;
  if (n.includes("econom")) return TrendingUp;
  if (n.includes("social")) return Users;
  if (n.includes("religious") || n.includes("moral") || n.includes("rme")) return BookMarked;
  return GraduationCap;
}
