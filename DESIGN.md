---
name: OpenRouter Model Evaluation Kit
description: A white, restrained workbench with blue accents for inspectable experiments.
colors:
  bg: "#ffffff"
  surface: "#f5f7f9"
  raised: "#edf2f6"
  field: "#ffffff"
  border: "#cbd5df"
  text: "#202a33"
  muted: "#526373"
  accent: "#2758a5"
  accent-ink: "#ffffff"
  blue: "#4775b6"
  blue-deep: "#edf3fa"
  selected: "#e7eff9"
  error: "#a53829"
  error-bg: "#fff0ec"
  brand-ink: "#161b20"
  brand-secondary: "#4e5862"
  primary-hover: "#1e4483"
  control-border: "#8496a7"
typography:
  display:
    fontFamily: '"Hanken Grotesk Variable", "Segoe UI", sans-serif'
    fontSize: "clamp(30px, 3.2vw, 43px)"
    fontWeight: 650
    lineHeight: 1.12
    letterSpacing: "-0.03em"
  headline:
    fontFamily: '"Hanken Grotesk Variable", "Segoe UI", sans-serif'
    fontSize: "22px"
    fontWeight: 550
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: '"Hanken Grotesk Variable", "Segoe UI", sans-serif'
    fontSize: "16px"
    fontWeight: 600
  body:
    fontFamily: '"Hanken Grotesk Variable", "Segoe UI", sans-serif'
    fontSize: "15px"
    lineHeight: 1.55
  label:
    fontWeight: 500
    fontFamily: '"Hanken Grotesk Variable", "Segoe UI", sans-serif'
    fontSize: "13px"
  code:
    fontFamily: '"SFMono-Regular", Consolas, monospace'
    fontSize: "12px"
rounded:
  control: "8px"
  surface: "12px"
  chat-marker: "3px"
  circle: "50%"
spacing:
  space-1: "8px"
  space-2: "16px"
  space-3: "24px"
  space-4: "40px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.control}"
    padding: "11px 18px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "11px 18px"
  button-secondary-hover:
    backgroundColor: "{colors.raised}"
  button-text:
    textColor: "{colors.accent}"
    padding: "6px 0"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  navigation:
    textColor: "{colors.muted}"
    padding: "14px 0"
  chip:
    textColor: "{colors.muted}"
    padding: "0"
  execution-panel:
    backgroundColor: "{colors.blue-deep}"
    textColor: "{colors.text}"
    rounded: "{rounded.surface}"
    padding: "24px"
  upload:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.surface}"
    padding: "26px 24px"
---

# Design System: OpenRouter Model Evaluation Kit

## Overview

**Creative North Star: "The Clear Experiment Workbench"**

A white workspace with restrained blue details, organic softness and Bauhaus/constructivist structural discipline. Alignment and open sections establish hierarchy; softened native controls and varied type weights make dense work approachable. The existing semicircle/square logo remains black and gray. All interface and guide copy is English.

**Key Characteristics:**
- White ground, near-black text and sparse blue emphasis.
- Self-hosted variable typography and readable native controls.
- Open sections, functional dividers and labeled geometry.

## Colors

Frontmatter values are normative and correspond to actual CSS custom properties. Blue is reserved for actions, focus, links and state emphasis; pale blue supports execution and selection without filling the page.

### Primary
- `accent` and `primary-hover`: action blue and its darker hover state; `accent-ink` supplies white text.
- `blue`, `blue-deep` and `selected`: secondary blue and pale tonal state surfaces.

### Secondary
- `error` and `error-bg`: explicit error text and its pale warm surface.

### Neutral
- `bg` and `field`: white page and editable field ground.
- `surface` and `raised`: light gray supporting surfaces and hover feedback.
- `text` and `muted`: primary reading text and supporting labels.
- `border` and `control-border`: functional dividers and the stronger native control boundary.
- `brand-ink` and `brand-secondary`: black/gray geometric logo.

**The Evidence Rule.** Color reinforces a written state; it never supplies a measurement or replaces the state label.

## Typography

Hanken Grotesk Variable is self-hosted through `@fontsource-variable/hanken-grotesk`, with Segoe UI and sans-serif fallbacks. Weights 400/450/500/550/600/650 distinguish ordinary text, supporting brand text, labels, section headings, actions and strong names.

Display headings use the frontmatter clamp and weight 650; section headings use 22px/550; subsection headings 16px/600; body 15px/1.55; labels 13px/500. At widths up to 480px, page titles use 32px and section headings 21px. Execution titles use 18px/650; guide step titles use 18px/600. Supporting metadata steps down to 12px, 11px or 10px.

SFMono-Regular, Consolas, monospace is reserved for identifiers, answers and code/raw evidence. Numeric comparisons use tabular numerals. Supporting prose is bounded to 65–72ch; raw blocks wrap long values.

**The One Family Rule.** Keep ordinary interface text in Hanken Grotesk; reserve monospace for data and code.

## Layout

Center a workspace up to 1560px wide, using horizontal padding `clamp(24px, 4.5vw, 72px)`. Reused spacing steps are 8/16/24/40px. Open work areas use functional dividers instead of nested cards.

The current desktop workbench uses an asymmetric 1.6fr configuration column beside a minimum 330px candidate column; up to 1100px it narrows to 1.4fr and a minimum 300px column. Up to 800px, work areas and documentation examples stack with 24px outer padding. Up to 480px, outer padding becomes 20px and mappings stack. Tables scroll within containers, lists scroll vertically and long IDs wrap. These responsive patterns do not require future pages to repeat this exact composition.

The guide uses open sections, numbered steps and definition rows. Its paired examples and definition columns stack at 800px. The inspector is at most 780px wide and otherwise fills the available width.

## Elevation & Depth

No box shadows are used. Pale tonal surfaces, thin dividers and spacing supply hierarchy. The inspector backdrop is `rgb(22 32 42 / 40%)`. Control feedback uses 180ms ease-out background/color transitions; loading uses a one-second linear spin. Reduced-motion preferences suppress animation and transitions.

**The Flat Workbench Rule.** Use tonal surfaces and functional boundaries without decorative elevation.

## Shapes

Controls use 8px softened corners; upload and execution surfaces use 12px. Inline guide code uses 4px. The logo retains its semicircle beside a shorter square-edged block. Decision markers are circles; generative markers use a 3px rounded square. Native checkboxes, circular icon controls and inline SVG retain their functional roles. Markers accompany readable labels. No shipping raster imagery is used.

## Components

- **Buttons:** 46px minimum height, 11px 18px padding, 13px/600. Primary uses blue with white text and a darker hover. Secondary is transparent with a muted border and light hover surface. Text actions gain an underline on hover. Disabled controls use opacity 0.5 and a not-allowed cursor.
- **Focus:** keyboard controls have a 2px accent outline offset by 4px. Small text/icon actions increase to a 44px minimum height at the narrow breakpoint.
- **Fields:** white, 14px, 46px minimum height, stronger control border and 12px 14px padding. Hover changes the border to muted; focus uses the shared outline. Textareas resize vertically. Native 15px checkboxes use blue accent.
- **Column selections:** plain checkbox-and-label rows, 28px minimum height and 12px text; selection changes muted text to primary text rather than adding a pill.
- **Navigation:** labeled horizontal tabs with a functional baseline and blue selected underline. Documentation links use a pale bordered control and underline on hover. Guide anchors wrap naturally.
- **Containers:** open sections by default. Upload is a bordered gray actionable surface; execution is a bordered pale-blue surface. Catalog hover is gray and selection pale blue. Candidate names use weight 650; IDs use monospace.
- **Feedback:** errors have explicit text and warm color pairing; notices use pale blue and status roles. Progress is a thin blue track. Missing values remain an em dash or `NOT MEASURED YET`, and fictional samples remain labeled.
- **Inspector:** locks page scroll, focuses the close control, traps Tab, closes with Escape/backdrop click and restores previous focus. Expandable raw evidence uses wrapped monospace blocks.
- **API reference:** Swagger is integrated with the interface family, pale backgrounds, 8px corners and no shadows. Current GET/POST method labels use accent blue; library-specific method conventions are not global brand tokens. Preserve its real endpoint and schema content.

## Do's and Don'ts

### Do:
- **Do** keep the white ground, restrained blue emphasis and black/gray logo.
- **Do** vary Hanken Grotesk weights and preserve readable native controls and visible focus.
- **Do** use English copy and explicit state labels alongside colors and geometry.
- **Do** preserve unavailable measurements and visibly identify fictional examples.
- **Do** stack constrained layouts and contain wide tables within scrolling areas.

### Don't:
- **Don't** restore the obsolete dark-blue/mint, Manrope or IBM Plex Mono identity.
- **Don't** fill every work area with saturated blue, cards, gradients or shadows.
- **Don't** invent model performance, brand claims or decorative benchmark metrics.
- **Don't** replace labeled navigation and native controls with ambiguous glyphs.
