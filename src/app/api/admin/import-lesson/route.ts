import { anthropic } from "@ai-sdk/anthropic";
import { generateObject, jsonSchema } from "ai";
import mammoth from "mammoth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300; // lesson generation can run long; avoid a 60s timeout

const MAX_TEXT = 80_000;
const MAX_FILE_BYTES = 4.4 * 1024 * 1024; // stay under Vercel's ~4.5 MB body cap

const SCHEMA = jsonSchema<{ title: string; content: string }>({
  type: "object",
  additionalProperties: false,
  required: ["title", "content"],
  properties: {
    title: { type: "string", description: "A short, clear lesson title with no leading numbering." },
    content: { type: "string", description: "The full lesson body in clean Markdown (no H1 title inside)." },
  },
});

const INSTRUCTION = `You are converting raw teaching material into ONE clean, well-structured lesson for a Ghanaian BECE/WASSCE study platform. The lesson is stored and displayed as Markdown.

Produce:
- "title": a short, clear lesson title (e.g. "Photosynthesis", "Introduction to Fractions"). No numbering, no "Lesson 1:".
- "content": the full lesson body in clean Markdown:
  • Use # for main section headings and ## for sub-headings. Do NOT repeat the title as an H1 inside the content.
  • Use - for bullet points and 1. for ordered steps.
  • Bold key terms with **like this**.
  • Use a Markdown table (header row, a |---|---| separator row, each row on its own line) whenever comparing 2+ things.
  • Write for a 14–18 year old: clear, simple, exam-focused, encouraging.
  • Preserve the source's facts and structure faithfully. Clean up OCR noise, broken line-breaks and obvious typos — but do NOT invent facts that aren't in the material.
  • If the material ALREADY contains images (as <img src="..."> tags or image URLs), reproduce every one IN PLACE using Markdown image syntax ![](exact same URL). Keep each image in the same order and position as the source — never drop, move, or reorder an image. Ignore any <img> whose src is empty.
  • If the material references a diagram/figure that has NO image you can use (e.g. a PDF where you can only see it), insert a line like "*(Diagram: short description — add image here)*" so the teacher can attach it later.`;

function fail(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail("Unauthorized", 401);

  const admin = createAdminClient();
  const { data: callerRole } = await admin
    .from("user_roles").select("role").eq("user_id", user.id).single();
  if (!["teacher", "admin", "super_admin"].includes(callerRole?.role ?? "")) {
    return fail("Forbidden", 403);
  }

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
      if (file.size > MAX_FILE_BYTES) return fail("That file is too large — keep it under ~4 MB, or paste the text instead.");

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
      } else if (name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        sourceLabel = "docx";
        // Convert to HTML so images stay IN POSITION. Each embedded image is
        // uploaded to content-images and its <img src> becomes a public URL;
        // Claude then preserves them in place as Markdown images.
        const WEB_EXT: Record<string, string> = {
          "image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg", "image/gif": "gif", "image/webp": "webp",
        };
        let imgIdx = 0;
        const { value: html } = await mammoth.convertToHtml(
          { buffer: Buffer.from(bytes) },
          {
            convertImage: mammoth.images.imgElement(async (image) => {
              const ext = WEB_EXT[image.contentType];
              if (!ext) return { src: "" }; // skip vector/EMF/WMF the browser can't render
              try {
                const imgBuf = await image.read();
                const path = `${user.id}/lesson-import/${Date.now()}-${imgIdx++}.${ext}`;
                const { error } = await admin.storage
                  .from("content-images")
                  .upload(path, imgBuf, { contentType: image.contentType, upsert: false });
                if (error) return { src: "" };
                const { data: { publicUrl } } = admin.storage.from("content-images").getPublicUrl(path);
                return { src: publicUrl };
              } catch {
                return { src: "" };
              }
            }),
          },
        );
        const text = (html ?? "").trim();
        if (text.length < 20) return fail("Couldn't read any text from that Word file. If it's mostly images, export it as a PDF instead.");
        genOptions = { prompt: `${INSTRUCTION}\n\nMATERIAL (HTML — images are already hosted at the URLs in each <img src>):\n"""\n${text.slice(0, MAX_TEXT)}\n"""` };
      } else if (name.endsWith(".doc")) {
        return fail("Old .doc format isn't supported. Save it as .docx or PDF and try again.");
      } else {
        return fail("Unsupported file type. Upload a PDF or Word (.docx) file, or paste the text.");
      }
    } else {
      const { rawText } = (await request.json()) as { rawText?: string };
      if (!rawText || rawText.trim().length < 20) return fail("Paste some lesson text first.");
      if (rawText.length > MAX_TEXT) return fail("That's a lot of text — bring in one lesson at a time.");
      genOptions = { prompt: `${INSTRUCTION}\n\nMATERIAL:\n"""\n${rawText}\n"""` };
    }
  } catch (err) {
    console.error("[import-lesson] input parsing failed:", err);
    return fail("Couldn't read that upload. Please try again.");
  }

  try {
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-6"),
      schema: SCHEMA,
      maxTokens: 16_000,
      ...genOptions,
    });
    if (!object?.content?.trim()) return fail("Couldn't turn that into a lesson. Try a cleaner copy or paste the text.", 502);
    return Response.json({ title: object.title?.trim() ?? "", content: object.content.trim() });
  } catch (err) {
    console.error(`[import-lesson] generation failed (${sourceLabel}):`, err);
    return fail("Could not convert that material. If it's a scanned or image-heavy file, try a clearer copy or paste the text.", 500);
  }
}
