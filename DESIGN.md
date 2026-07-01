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
  border: "#E2E8F0"
  surface: "#F8FAFC"
  background: "#FFFFFF"
typography:
  display:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
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

### Neutral
- **Ink** (#0F172A): Strongest headings and high-emphasis text.
- **Body Slate** (#334155): Default body text — meets AA on white and on surface.
- **Muted Slate** (#64748B): Secondary/supporting text, captions, placeholders (use the full muted, not lighter, to keep ≥4.5:1).
- **Border** (#E2E8F0): Hairline borders and dividers.
- **Surface** (#F8FAFC): Page background behind white cards; section separation.
- **Background** (#FFFFFF): Cards and primary surfaces.

### Named Rules
**The One-Action Rule.** Action Orange (#E8722A) marks the single primary action on a screen — never two competing orange buttons. Everything secondary is navy, ghost, or text.

**The Honest-Contrast Rule.** Body text is Body Slate (#334155) or darker; supporting text is Muted Slate (#64748B), never lighter. No light-gray "for elegance."

## 3. Typography

**Display Font:** Bricolage Grotesque (with system-ui, sans-serif) — a confident, contemporary grotesque with character; used product-wide for all headings, from the landing hero to dashboard section titles.
**Body Font:** Hanken Grotesk (with system-ui, sans-serif) — a warm, highly legible humanist grotesque tuned for small sizes and mobile screens.

**Character:** One distinctive display face (Bricolage Grotesque) over one legible humanist workhorse (Hanken Grotesk) — a two-family system used everywhere for a coherent brand across marketing and product. The contrast axis is weight and role, not two near-identical sans fonts: headings feel deliberate and branded; body stays quiet and readable on small screens.

### Hierarchy
- **Display** (700, clamp(1.75rem, 4vw, 2.5rem), 1.1, -0.02em): Page heroes and major page titles (Bricolage Grotesque).
- **Headline** (700, ~1.25rem, 1.2): Section and card titles (Bricolage Grotesque).
- **Title** (600–700, ~1rem): Sub-section labels, list headers.
- **Body** (400, 0.875rem, 1.6): Default reading text (Hanken Grotesk). Cap prose at 65–75ch.
- **Label** (700, 0.6875rem, +0.08em, often uppercase): Stat captions, chips, eyebrow tags — used deliberately, not above every section.

### Named Rules
**The Register-Family Rule.** Body is always Hanken Grotesk; display is always Bricolage Grotesque. Never introduce a third family, and never set body copy in the display face.

## 4. Elevation

Flat-by-default with soft, tonal separation. Depth comes from surface contrast (white cards on #F8FAFC) and hairline borders, not heavy shadows. Shadows are reserved, soft, and brand-tinted — used for floating/elevated affordances (the AI-tutor launcher, the sticky save bar, dropdowns), never as a default decoration on every card.

### Shadow Vocabulary
- **Soft card hover** (`box-shadow: 0 1px 3px rgba(0,0,0,0.06)`): Subtle lift on interactive cards.
- **Floating element** (`box-shadow: 0 8px 28px rgba(27,58,138,0.45)`): Navy-tinted glow under the floating AI-tutor button.
- **Elevated bar** (`box-shadow: 0 8px 30px rgba(0,0,0,0.10)`): Sticky save bar / popovers.

### Named Rules
**The Flat-By-Default Rule.** Cards rest flat on the surface, separated by background tone and a 1px border. A shadow appears only in response to state (hover, float, focus) or true elevation (modal, dropdown).

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
- **Do** keep cards flat on #F8FAFC with a 1px #E2E8F0 border; add shadow only on hover/float/focus.
- **Do** show progress (completion, scores, weak topics, streaks) wherever a student is working.
- **Do** give every animation a `prefers-reduced-motion` alternative.

### Don't:
- **Don't** ship the generic AI/SaaS template look: no cream/sand body backgrounds, no `background-clip:text` gradient text, no endless identical icon-card grids, no tracked-uppercase eyebrow above every section.
- **Don't** make it feel like a cluttered government portal — no dense, text-heavy, hard-to-scan screens.
- **Don't** go childish/cartoonish in a way that undercuts exam credibility.
- **Don't** use a colored `border-left`/`border-right` stripe as an accent on cards or alerts — use full borders or background tints.
- **Don't** use light-gray body text "for elegance"; it fails contrast and trust.
- **Don't** introduce a third font family or set body copy in Bricolage Grotesque.
