# demos/

Isolated technique demos — each one a single HTML file showing one effect.  
Open any file in a browser. No server needed. No build step.

Each demo is designed to run on **dark backgrounds with painting-like content** and includes copy-paste ready, commented code.

---

## Texture

| File | Technique | Libraries |
|---|---|---|
| [texture-01-rough-sketch.html](texture-01-rough-sketch.html) | Hand-drawn SVG borders, frames, chalk dividers | Rough.js (CDN) |
| [texture-02-svg-filters.html](texture-02-svg-filters.html) | Paper texture, ink edge bleed, watercolor edges | None — pure SVG `<filter>` |

### texture-01: Rough.js hand-drawn frames
Painting card borders that look like charcoal sketches. Redraw on hover — each hover produces a slightly different mark. Section dividers that look like chalk lines.

**Key parameter:** `roughness: 2` — lower = cleaner, higher = more expressive.  
**CDN:** `https://unpkg.com/roughjs@4.6.6/bundled/rough.js`

### texture-02: SVG filter recipes
Three production-ready filter recipes applied with one CSS line:
- `filter: url(#paper-texture)` — aged paper surface on backgrounds
- `filter: url(#ink-dissolve)` on hover — painting edges bleed and dissolve
- `filter: url(#watercolor-edge)` — soft organic edges on color blocks

No JavaScript. No library. Pure SVG `<filter>` defined once in the page.

---

## Typography

| File | Technique | Libraries |
|---|---|---|
| [type-01-variable-font.html](type-01-variable-font.html) | Font weight/opsz driven by scroll + cursor proximity | Splitting.js, Lenis |
| [type-02-scramble.html](type-02-scramble.html) | Text scrambles through symbols before resolving | None — custom ~40 lines |
| [type-03-magnetic.html](type-03-magnetic.html) | Elements drift toward cursor within a radius | None — custom ~30 lines |

### type-01: Variable font
Hero title gains weight as you scroll — from hairline (100) to medium (600). Each character staggered. Also shows cursor proximity driving per-character weight on a hover demo.

**Font:** Fraunces (Google Fonts) with `wght` + `opsz` + `WONK` axes.  
**Works with:** any Google Fonts variable font. Cormorant also supports variable weight.

### type-02: Scramble reveals
Characters cycle through esoteric symbols (`✦ ⬡ ◈ ☽ ⌘`) before resolving to their real values, left-to-right. No library. Three charsets included: esoteric, latin-rune, mixed.

**Use for:** page-load hero titles, painting titles on hover, nav labels, section headings on scroll-enter.

### type-03: Magnetic hover
Elements within a configurable radius drift toward the cursor. Pure JS ~30 lines. No library.

```html
<span data-magnetic
      data-magnetic-strength="0.35"
      data-magnetic-radius="100">
  View paintings
</span>
```

**Sweet spot:** strength `0.2`–`0.4`, radius `60`–`120`px.  
**Use for:** CTA buttons, nav links, painting list titles.

---

## Combining techniques

These work well together on the same page:

- **grain overlay** (from main site) + **paper texture filter** = maximum physicality
- **scramble reveal** (page load) + **variable font weight** (scroll) = title that materializes
- **Rough.js borders** + **ink dissolve** (hover) = paintings feel drawn and dissolving
- **magnetic hover** + **Splitting.js char reveal** = text that arrives then becomes alive

---

## Libraries referenced

| Library | CDN | Docs |
|---|---|---|
| Rough.js | `unpkg.com/roughjs@4.6.6/bundled/rough.js` | [roughjs.com](https://roughjs.com) |
| svg2roughjs | `cdn.jsdelivr.net/npm/svg2roughjs@3.2.3/dist/svg2roughjs.umd.min.js` | [github.com/fskpf/svg2roughjs](https://github.com/fskpf/svg2roughjs) |
| Anime.js v4 | `cdn.jsdelivr.net/npm/animejs@4.3.6/dist/bundles/anime.umd.min.js` | [animejs.com](https://animejs.com) |
| GSAP | `cdnjs.cloudflare.com/ajax/libs/gsap/3.12.4/gsap.min.js` | [gsap.com](https://gsap.com) |
| GSAP MotionPath | `cdnjs.cloudflare.com/ajax/libs/gsap/3.12.4/MotionPathPlugin.min.js` | [gsap.com/motionpath](https://gsap.com/docs/v3/Plugins/MotionPathPlugin/) |
| Splitting.js | `cdn.jsdelivr.net/npm/splitting@1.0.6/dist/splitting.min.js` | [splitting.js.org](https://splitting.js.org) |
| Lenis | `cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js` | [github.com/darkroomengineering/lenis](https://github.com/darkroomengineering/lenis) |
