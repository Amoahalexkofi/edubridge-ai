---
name: EduBridge AI
description: Curriculum-aligned BECE & WASSCE exam-prep platform for Ghana — a calm, confidence-building study companion.
colors:
  primary: "#1D4ED8"
  brand-navy: "#1B3A8A"
  accent-orange: "#E8722A"
  teal: "#0D9488"
  success-green: "#1A6B3C"
  amber: "#F59E0B"
  error: "#EF4444"
  ink: "#0F172A"
  body: "#334155"
  muted: "#64748B"
  border: "#E6E4DE"
  surface: "#F8F7F4"
  surface-warm: "#F2F1EE"
  background: "#FFFFFF"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    letterSpacing: "0.08em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent-orange}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: "{colors.brand-navy}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  card:
    backgroundColor: "{colors.background}"
    textColor: "{colors.body}"
    rounded: "{rounded.lg}"
    padding: "20px"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
---

# Design System: EduBridge AI

## 1. Overview

**Creative North Star: "The Steady Coach"**

EduBridge is the calm, capable mentor sitting beside a Ghanaian student through the most stressful season of their school life. The interface never shouts and never clutters; it lowers the temperature. Generous white space, a clear single primary action per screen, and constant visible progress are the whole personality. Trust is earned through clarity — this is high-stakes preparation, so legibility and accuracy outrank cleverness every time.

The system is **mobile-first and data-light** by doctrine: most students arrive on a phone, on metered data, sometimes on a shared device. Layouts stack cleanly to one column, tap targets stay large, and nothing decorative costs bandwidth. Navy and a warm orange carry the brand; deep slate carries the words; soft surfaces separate sections without heavy borders or drop shadows.

It explicitly rejects the **generic AI/SaaS template** look (cream backgrounds, gradient text, endless identical icon-card grids, tracked-uppercase eyebrows on every section), the **cluttered government-portal** feel (dense, text-heavy screens), and anything **childish or cartoonish** that would undercut exam credibility.

**Key Characteristics:**
- Calm, high-contrast, confidence-building
- Mobile-first, fast on slow connections
- Navy + orange brand, slate text, soft surfaces
- Progress is always visible
- One clear primary action per screen

## 2. Colors

A confident, education-blue core with a single warm orange for action, grounded in deep slate neutrals.

### Primary
- **Royal Blue** (#1D4ED8): Primary interactive blue — active states, links, selected pills, focus rings, progress bars.
- **Brand Navy** (#1B3A8A): The anchor identity color — sidebars, headings, avatars, hero gradients, "Candidate" badges. Pairs with Royal Blue in gradients (navy → blue).

### Secondary
- **Action Orange** (#E8722A): The single call-to-action color — primary buttons ("Save changes", "Continue", "Create account"). Its scarcity is the point; it means "do this."
- **Amber** (#F59E0B): Token accent / highlights and warnings-adjacent emphasis. Used sparingly.

### Tertiary
- **Teal** (#0D9488): Secondary brand accent for variety on marketing/landing and occasional iconography.
- **Success Green** (#1A6B3C / #22C55E): Completion, "Linked", verified, passing scores.

### Neutral — warm, not cool
The neutral ramp is deliberately **warm** (a faint warm-gray bias), not the cool blue-slate of a clinical dashboard. This is what gives the product its calm, study-friendly atmosphere. Text stays neutral-dark for legibility; the warmth lives in the surfaces and borders.
- **Ink** (#0F172A): Strongest headings and high-emphasis text.
- **Body Slate** (#334155): Default body text — meets AA on white and on surface.
- **Muted Slate** (#64748B): Secondary/supporting text, captions, placeholders (use the full muted, not lighter, to keep ≥4.5:1).
- **Border** (#E6E4DE): Warm, soft hairline borders and dividers (was cool #E2E8F0).
- **Surface** (#F8F7F4): Warm off-white page background behind white cards.
- **Surface Warm** (#F2F1EE): Slightly deeper warm neutral for app shells / page backgrounds behind the content column.
- **Background** (#FFFFFF): Cards and primary surfaces (stay white for contrast against the warm surface).

**Not cream.** The warm neutrals are low-chroma warm grays, not the cream/sand (#F4F1EA) of the generic AI-template look. The warmth is subtle — it should read as "calm and soft," never as a beige theme.

### Named Rules
**The One-Action Rule.** Action Orange (#E8722A) marks the single primary action on a screen — never two competing orange buttons. Everything secondary is navy, ghost, or text.

**The Honest-Contrast Rule.** Body text is Body Slate (#334155) or darker; supporting text is Muted Slate (#64748B), never lighter. No light-gray "for elegance."

## 3. Typography

**One family, product-wide:** Plus Jakarta Sans (with system-ui, sans-serif) — a warm, humanist sans used for everything: hero, headings, body, labels, data. Its open, rounded letterforms read as serious and trustworthy (a real study platform) while feeling soft rather than hard.

**Character:** A single high-quality humanist family across marketing and product, differentiated by weight and size rather than a display/body pairing. This reads as calm, cohesive, and professional — deliberately not the quirk of a display grotesque. Headings use 700–800 weight; body 400–500. Never introduce a second family.

### Hierarchy
- **Display** (700, clamp(1.75rem, 4vw, 2.5rem), 1.1, -0.02em): Page heroes and major page titles (Bricolage Grotesque).
- **Headline** (700, ~1.25rem, 1.2): Section and card titles (Bricolage Grotesque).
- **Title** (600–700, ~1rem): Sub-section labels, list headers.
- **Body** (400, 0.875rem, 1.6): Default reading text (Hanken Grotesk). Cap prose at 65–75ch.
- **Label** (700, 0.6875rem, +0.08em, often uppercase): Stat captions, chips, eyebrow tags — used deliberately, not above every section.

### Named Rules
**The One-Family Rule.** Everything is Plus Jakarta Sans — headings, body, labels, data. Differentiate by weight (700–800 headings, 400–500 body) and size, never by adding a second typeface.

## 4. Elevation

**Soft depth on a warm ground.** The atmosphere is warm and calm, not clinical. White cards rest on a warm off-white surface (#F8F7F4) and carry a **soft, warm-tinted ambient shadow** for gentle depth — cards feel like they float slightly rather than being boxed in by hard borders. Borders are still present but softened (warm #E6E4DE) and secondary to the shadow. Shadows use a warm tint (rgba(31,26,15,…)) rather than pure black, so depth reads as soft, not harsh.

### Shadow Vocabulary
- **Soft card (default)** (`box-shadow: 0 1px 2px rgba(31,26,15,0.04), 0 6px 20px -6px rgba(31,26,15,0.07)`): The gentle ambient depth on resting cards. Warm-tinted, barely-there, but enough to lift the card off the surface.
- **Floating element** (`box-shadow: 0 8px 28px rgba(27,58,138,0.45)`): Navy-tinted glow under the floating AI-tutor button.
- **Elevated bar** (`box-shadow: 0 8px 30px rgba(0,0,0,0.10)`): Sticky save bar / popovers.

### Named Rules
**The Soft-Depth Rule.** Resting cards carry the soft ambient shadow plus a warm 1px border. Depth is gentle and warm — never a hard-edged flat box, never a heavy drop shadow. Interactive cards deepen slightly on hover.

## 5. Components

### Buttons
- **Shape:** Rounded (12px, `rounded-md`/`rounded-xl`).
- **Primary:** Action Orange (#E8722A) bg, white text, 12px×20px padding, soft orange shadow. The one "do this" control.
- **Secondary:** Brand Navy (#1B3A8A) bg, white text — confirmations and navigation actions.
- **Hover / Focus:** Darken ~8% on hover; visible focus ring in Royal Blue. Disabled = reduced opacity, no shadow.

### Chips / Badges
- **Style:** Pill (9999px), tinted background of the relevant hue at low opacity with the same hue's dark text — e.g. exam-target badge (navy on #EFF6FF), "Completed"/"Linked" (green on #F0FDF4), "Deactivated" (red on #FEF2F2).
- **State:** Status communication, not interactive.

### Cards / Containers
- **Corner Style:** 16px (`rounded-2xl`), heroes 24px (`rounded-3xl`).
- **Background:** White (#FFFFFF) on Surface (#F8FAFC).
- **Shadow Strategy:** Flat by default; `shadow-sm` only where interactive (see Elevation).
- **Border:** 1px Border (#E2E8F0). Never a colored side-stripe.
- **Internal Padding:** 20–24px.

### Inputs / Fields
- **Style:** White bg, 1px Border (#E2E8F0), 12px radius, 44px height, 14px text.
- **Focus:** Border shifts to Royal Blue (#1D4ED8) with a soft 4px Royal-Blue ring.
- **Error:** Red (#EF4444) border + ring, inline message below in red.
- **Disabled:** Surface bg, muted text, not editable (e.g. email field).

### Navigation
- **Desktop:** Fixed left sidebar, white, with navy logo, icon+label items; active item gets a navy tint pill + orange dot. User block + sign-out pinned bottom.
- **Mobile:** Top bar (logo + exam badge + avatar) and a fixed bottom tab bar; locked items show a 🔒 until verified.

### Signature: Floating AI-Tutor Launcher
A navy→blue gradient pill (desktop) / round button (mobile), fixed bottom-right, with a soft navy glow. Shows an "Online" status and an unread-reply badge + pulse only when there's a genuinely new message.

## 6. Do's and Don'ts

### Do:
- **Do** keep one Action-Orange (#E8722A) primary button per screen; make everything else navy/ghost/text.
- **Do** use Body Slate (#334155) for body and Muted Slate (#64748B) for support — verify ≥4.5:1.
- **Do** design the phone layout first; stack to one column, keep tap targets ≥44px, keep it light on slow data.
- **Do** give resting cards the soft warm ambient shadow + a 1px #E6E4DE border on the warm #F8F7F4 surface; deepen slightly on hover.
- **Do** show progress (completion, scores, weak topics, streaks) wherever a student is working.
- **Do** give every animation a `prefers-reduced-motion` alternative.

### Don't:
- **Don't** ship the generic AI/SaaS template look: no cream/sand body backgrounds, no `background-clip:text` gradient text, no endless identical icon-card grids, no tracked-uppercase eyebrow above every section.
- **Don't** make it feel like a cluttered government portal — no dense, text-heavy, hard-to-scan screens.
- **Don't** go childish/cartoonish in a way that undercuts exam credibility.
- **Don't** use a colored `border-left`/`border-right` stripe as an accent on cards or alerts — use full borders or background tints.
- **Don't** use light-gray body text "for elegance"; it fails contrast and trust.
- **Don't** introduce a second font family — everything is Plus Jakarta Sans, differentiated by weight and size.
