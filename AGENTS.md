<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# UI & design work — required tooling

For ANY user-facing UI work (new pages, components, styling changes):

1. **`DESIGN.md` (repo root) is the source of truth** — EduBridge colors, typography (Bricolage Grotesque display / Hanken Grotesk body), spacing, and component conventions. Follow it exactly; never invent new palette values.
2. **Apply the `impeccable` skill** (`.claude/skills/impeccable/`) — invoke it for polish passes on anything user-facing. If the session was opened outside this repo, read its SKILL.md manually and follow it.
3. **21st.dev Magic MCP** (`mcp__magic__*` tools) is available for component inspiration/generation — useful for novel components; always restyle output to match DESIGN.md.
4. **Reference design systems**: `~/Documents/EduBridge_AI/awesome-design-md/design-md/` holds 74 brand DESIGN.md files (linear.app, airbnb, apple…) for studying patterns — reference only, EduBridge's own DESIGN.md always wins.
