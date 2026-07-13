import { anthropic } from "@ai-sdk/anthropic";
import { generateObject, jsonSchema } from "ai";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

// Shape Claude must return. Options are plain strings and the correct answer is
// an index into them — simplest for the model to get right. We convert to the
// app's {id,text} + letter format on the client after review.
const SCHEMA = jsonSchema<{
  questions: {
    prompt: string;
    options: string[];
    correct_index: number;
    explanation: string;
    difficulty: "easy" | "medium" | "hard";
    confidence: "high" | "low";
  }[];
}>({
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["prompt", "options", "correct_index", "explanation", "difficulty", "confidence"],
        properties: {
          prompt: { type: "string", description: "The question text, cleaned of numbering." },
          options: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            maxItems: 6,
            description: "The answer choices, in order, without their A/B/C/D letters.",
          },
          correct_index: {
            type: "integer",
            description: "0-based index of the correct option.",
          },
          explanation: {
            type: "string",
            description: "One or two sentences on why the answer is correct. Empty string if unknown.",
          },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          confidence: {
            type: "string",
            enum: ["high", "low"],
            description: "high if the correct answer came from a provided answer key; low if you inferred it yourself.",
          },
        },
      },
    },
  },
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Only content authors may use the importer
  const admin = createAdminClient();
  const { data: callerRole } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (!["teacher", "admin", "super_admin"].includes(callerRole?.role ?? "")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { rawText } = (await request.json()) as { rawText?: string };
  if (!rawText || rawText.trim().length < 20) {
    return Response.json({ error: "Paste some question text first." }, { status: 400 });
  }
  if (rawText.length > 60_000) {
    return Response.json({ error: "That's a lot of text — paste one paper at a time (up to ~60k characters)." }, { status: 400 });
  }

  try {
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-6"),
      schema: SCHEMA,
      maxTokens: 8000,
      prompt: `You are helping a Ghanaian BECE/WASSCE teacher digitise a past paper into structured multiple-choice questions.

Below is pasted text from a past paper. It may contain the questions and, optionally, an answer key / marking scheme (often a list like "1. B  2. A  3. D" at the end).

Extract EVERY multiple-choice question you find. For each one:
- "prompt": the question text only, with any leading number ("1.", "12)") removed. Keep the full question wording.
- "options": the answer choices in order, WITHOUT their letters (strip "A.", "B)", etc.).
- "correct_index": the 0-based index of the correct option.
- "confidence": "high" ONLY if an answer key in the text tells you the correct answer. If there is no key and you worked out the answer yourself, use "low".
- "explanation": a short reason the answer is correct (1-2 sentences). Empty string "" if you are unsure.
- "difficulty": your estimate — "easy", "medium", or "hard".

Rules:
- If there is no answer key, still solve each question yourself and set the correct_index, but mark confidence "low" so the teacher reviews it.
- Ignore non-question text (instructions, headers, page numbers).
- Only include genuine multiple-choice questions with at least 2 options.
- Do not invent questions that aren't in the text.

PASTED TEXT:
"""
${rawText}
"""`,
    });

    const questions = (object.questions ?? []).filter(
      (q) => q.prompt?.trim() && Array.isArray(q.options) && q.options.length >= 2,
    );

    return Response.json({ questions });
  } catch (err) {
    console.error("[import-questions] extraction failed:", err);
    return Response.json(
      { error: "Could not read that text. Try pasting a cleaner copy, or fewer questions at a time." },
      { status: 500 },
    );
  }
}
