export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 9) return null;

  let n = digits;
  if (n.startsWith("0")) n = "233" + n.slice(1);
  if (!n.startsWith("233")) n = "233" + n;
  return "+" + n;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function matchParentStudent(
  admin: { from: (table: string) => any },
  userId: string,
  role: "student" | "parent",
  phone: string | null | undefined,
  parentPhone: string | null | undefined,
) {
  if (role === "student" && parentPhone) {
    const norm = normalizePhone(parentPhone);
    if (!norm) return;
    const { data: parents } = await admin
      .from("profiles")
      .select("id")
      .eq("phone", norm);
    if (!parents?.length) return;
    const rows = parents.map((p: { id: string }) => ({ parent_id: p.id, student_id: userId }));
    await admin.from("parent_student").upsert(rows, { onConflict: "parent_id,student_id", ignoreDuplicates: true });
  }

  if (role === "parent" && phone) {
    const norm = normalizePhone(phone);
    if (!norm) return;
    const { data: students } = await admin
      .from("profiles")
      .select("id")
      .eq("parent_phone", norm);
    if (!students?.length) return;
    const rows = students.map((s: { id: string }) => ({ parent_id: userId, student_id: s.id }));
    await admin.from("parent_student").upsert(rows, { onConflict: "parent_id,student_id", ignoreDuplicates: true });
  }
}
