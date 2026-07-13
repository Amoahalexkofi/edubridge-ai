import { anthropic } from "@ai-sdk/anthropic";
import { generateObject, jsonSchema } from "ai";
import mammoth from "mammoth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TEXT = 60_000;
// Vercel serverless functions cap the request body at ~4.5 MB; stay just under it
// so users get a clear message instead of an opaque platform 413.
const MAX_FILE_BYTES = 4.4 * 1024 * 1024;

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
          correct_index: { type: "integer", description: "0-based index of the correct option." },
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

const INSTRUCTION = `You are helping a Ghanaian BECE/WASSCE teacher digitise a past paper into structured multiple-choice questions.

The material may contain the questions and, optionally, an answer key / marking scheme (often a list like "1. B  2. A  3. D").

Extract EVERY multiple-choice question you find. For each one:
- "prompt": the question text only, with any leading number ("1.", "12)") removed. Keep the full question wording. If a question refers to a diagram or figure you cannot capture as text, still include the question and note "[refers to a diagram]" at the end of the prompt.
- "options": the answer choices in order, WITHOUT their letters (strip "A.", "B)", etc.).
- "correct_index": the 0-based index of the correct option.
- "confidence": "high" ONLY if an answer key in the material tells you the correct answer. If there is no key and you worked out the answer yourself, use "low".
- "explanation": a short reason the answer is correct (1-2 sentences). Empty string "" if you are unsure.
- "difficulty": your estimate — "easy", "medium", or "hard".

Rules:
- If there is no answer key, still solve each question yourself and set the correct_index, but mark confidence "low" so the teacher reviews it.
- Ignore non-question text (instructions, headers, page numbers).
- Only include genuine multiple-choice questions with at least 2 options.
- Do not invent questions that aren't in the material.`;

function fail(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail("Unauthorized", 401);

  // Only content authors may use the importer
  const admin = createAdminClient();
  const { data: callerRole } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (!["teacher", "admin", "super_admin"].includes(callerRole?.role ?? "")) {
    return fail("Forbidden", 403);
  }

  // Build the model call from either an uploaded file or pasted text.
  // PDFs go to Claude natively (it reads scanned pages + diagrams); .docx is
  // converted to text with mammoth; pasted text is used directly.
  const contentType = request.headers.get("content-type") ?? "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let genOptions: Record<string, any>;
  let sourceLabel = "text";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return fail("No file was uploaded.");
      if (file.size === 0) return fail("That file is empty.");
      if (file.size > MAX_FILE_BYTES) return fail("That file is too large — keep it under ~4 MB. For a big scanned paper, split it or paste the text instead.");

      const name = file.name.toLowerCase();
      const bytes = new Uint8Array(await file.arrayBuffer());

      if (file.type === "application/pdf" || name.endsWith(".pdf")) {
        sourceLabel = "pdf";
        genOptions = {
          messages: [{
            role: "user",
            content: [
              { type: "text", text: INSTRUCTION },
              { type: "file", data: bytes, mimeType: "application/pdf" },
            ],
          }],
        };
      } else if (
        name.endsWith(".docx") ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        sourceLabel = "docx";
        const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
        const text = (value ?? "").trim();
        if (text.length < 20) return fail("Couldn't read any text from that Word file. If it's mostly images, export it as a PDF instead.");
        genOptions = { prompt: `${INSTRUCTION}\n\nMATERIAL:\n"""\n${text.slice(0, MAX_TEXT)}\n"""` };
      } else if (name.endsWith(".doc")) {
        return fail("Old .doc format isn't supported. Please save it as .docx or PDF and try again.");
      } else {
        return fail("Unsupported file type. Upload a PDF or Word (.docx) file, or paste the text.");
      }
    } else {
      const { rawText } = (await request.json()) as { rawText?: string };
      if (!rawText || rawText.trim().length < 20) return fail("Paste some question text first.");
      if (rawText.length > MAX_TEXT) return fail("That's a lot of text — paste one paper at a time (up to ~60k characters).");
      genOptions = { prompt: `${INSTRUCTION}\n\nMATERIAL:\n"""\n${rawText}\n"""` };
    }
  } catch (err) {
    console.error("[import-questions] input parsing failed:", err);
    return fail("Couldn't read that upload. Please try again.");
  }

  try {
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-6"),
      schema: SCHEMA,
      maxTokens: 16_000,
      ...genOptions,
    });

    const questions = (object.questions ?? []).filter(
      (q) => q.prompt?.trim() && Array.isArray(q.options) && q.options.length >= 2,
    );

    return Response.json({ questions });
  } catch (err) {
    console.error(`[import-questions] extraction failed (${sourceLabel}):`, err);
    return fail(
      "Could not read that material. If it's a scanned or image-heavy file, try a clearer copy or paste the text.",
      500,
    );
  }
}
