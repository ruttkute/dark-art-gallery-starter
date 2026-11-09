# dark-art-gallery-starter

A static site template for artists who sell original paintings online.  
No framework. No build step. All CDN. Deploy to Cloudflare Pages in minutes.

**Live on melancholija.com** — this stack powers a real independent art gallery.

---

## What's inside

| Feature | Library | How |
|---|---|---|
| Smooth scroll | [Lenis](https://github.com/darkroomengineering/lenis) | CDN, one `<script>` tag |
| Text char reveals | [Splitting.js](https://splitting.js.org) | CDN, `data-splitting` attribute |
| Full-screen lightbox | [PhotoSwipe v5](https://photoswipe.com) | CDN, ESM import on demand |
| WebGL hover distortion | [curtains.js](https://www.curtainsjs.com) | CDN, GLSL ripple shader |
| Film grain atmosphere | SVG `feTurbulence` | Pure CSS, zero dependencies |
| Single data source | `data/artworks.js` | Plain JS `window.ARTWORKS = [...]` |
| Likes + sold tracking | Cloudflare Worker + D1 | Optional backend |

No webpack. No npm install. Everything loads from CDN.  
You need a text editor and a Cloudflare account.

---

## File structure

```
dark-art-gallery-starter/
├── index.html              ← homepage: hero + spaces + about
├── gallery.html            ← painting grid: likes, sold badges, WebGL hover
├── artwork-detail.html     ← painting detail: PhotoSwipe gallery + buy flow
├── checkout.html           ← cart + order form + PayPal/bank transfer
│
├── data/
│   └── artworks.js         ← single source of truth for all painting data
│
├── css/
│   └── base.css            ← design tokens, layout, typography, grain
│
└── _worker/
    ├── index.js            ← Cloudflare Worker (likes, sold, checkout APIs)
    ├── schema.sql          ← D1 database schema
    └── wrangler.toml.example
```

---

## Quick start

### 1. Add your paintings

Edit `data/artworks.js`:

```js
window.ARTWORKS = [
  {
    slug: 'your-painting-slug',     // URL-safe identifier (used in ?slug=)
    title: 'PAINTING TITLE',
    medium: 'Oil on linen, original',
    year: '2024',
    size: '21 × 30 cm',
    price: 420,
    description: 'Write about this painting in present tense.',
    note: null,                     // optional note shown under price
    images: [
      'images/your-painting-1.jpg', // main image
      'images/your-painting-2.jpg', // shown in PhotoSwipe gallery (optional)
    ],
    available: true,                // false = hidden from gallery
    type: 'original',
  },
];
```

Put your images in the `images/` folder. Any format works (jpg, webp, png).

> **Tip:** Set `available: false` to temporarily hide a painting without deleting it.
> You'll need to set it in both `gallery.html` and `artwork-detail.html` ARTWORKS arrays if you're not yet using the shared `data/artworks.js`.

### 2. Customize the design

Edit `css/base.css` — the `:root` block at the top:

```css
:root {
  --bg:     #f4f1ec;   /* background color */
  --fg:     #1c1b18;   /* text color */
  --accent: #5c4a7a;   /* your brand color — links, hover, liked state */
}
```

### 3. Set your API URL

In `gallery.html`, `artwork-detail.html`, and `checkout.html`, find:

```js
const API_BASE = 'https://your-worker.your-name.workers.dev';
```

Replace with your Worker URL after deploying (see step 5 below).  
For local development, use `http://localhost:8787`.

### 4. Deploy to Cloudflare Pages

1. Push this repo to GitHub
2. In [Cloudflare Pages](https://pages.cloudflare.com): **Create project → Connect to Git**
3. Select your repo, set:
   - **Build command**: _(leave blank)_
   - **Output directory**: `/` (root)
4. Deploy

Your site goes live at `your-project.pages.dev`.

### 5. Deploy the Cloudflare Worker (for likes, sold tracking, checkout)

```bash
cd _worker

# Create a D1 database
wrangler d1 create your-gallery-db

# Note the database_id from the output, then:
cp wrangler.toml.example wrangler.toml
# Edit wrangler.toml: fill in account_id and database_id

# Run the schema
wrangler d1 execute your-gallery-db --file=schema.sql

# Deploy
wrangler deploy
```

Fill in `_worker/index.js` config:
```js
const PAYEE_IBAN = 'YOUR_IBAN_HERE';
const PAYEE_NAME = 'Your Full Name';
const PAYPAL_ME  = 'YOUR_PAYPAL_HANDLE';
```

---

## Integrations in detail

### Lenis — smooth scroll

Lenis replaces browser scroll with weighted interpolation, creating the feeling of physical momentum.

```html
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js"></script>
<script>
  const lenis = new Lenis({ lerp: 0.08 }); // lower = slower/silkier
  function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  window.__lenis = lenis; // expose so other scripts can pause/resume it
</script>
```

> Keep `lerp` between `0.05` and `0.12`. Lower feels more liquid; higher feels snappier.

---

### Splitting.js — character-level text reveals

Splitting.js wraps each character in a `<span class="char">` with a `--char-index` CSS variable. You then stagger reveals with CSS `animation-delay`.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/splitting@1.0.6/dist/splitting.css">
<script src="https://cdn.jsdelivr.net/npm/splitting@1.0.6/dist/splitting.min.js"></script>

<!-- Add data-splitting to any element you want to split -->
<h1 data-splitting>Title That Reveals</h1>

<style>
h1 .char {
  display: inline-block;
  opacity: 0;
  transform: translateY(0.15em);
  animation: char-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--char-index) * 0.02s + 0.1s);
}
@keyframes char-in {
  to { opacity: 1; transform: translateY(0); }
}
</style>

<script>
  Splitting(); // must be called after the DOM is ready
</script>
```

---

### PhotoSwipe v5 — full-screen lightbox

PhotoSwipe v5 uses ES modules. We import it lazily — only on first click — to keep initial page load fast.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe.css">

<!-- Gallery links — data-pswp-width/height must match your actual image dimensions -->
<div id="pswp-gallery">
  <a href="full-image.jpg" data-pswp-width="1600" data-pswp-height="2000">
    <img src="thumb.jpg" alt="...">
  </a>
</div>

<script type="module">
  // Loaded only when the user clicks — not on page load
  async function openGallery(index = 0) {
    const { default: PhotoSwipeLightbox } =
      await import('https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe-lightbox.esm.min.js');

    const lb = new PhotoSwipeLightbox({
      gallery: '#pswp-gallery',
      children: 'a',
      pswpModule: () =>
        import('https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe.esm.min.js'),
    });

    // Pause Lenis while lightbox is open (avoids scroll conflict)
    lb.on('beforeOpen', () => window.__lenis?.stop());
    lb.on('destroy',    () => window.__lenis?.start());

    lb.init();
    lb.loadAndOpen(index);
  }

  document.querySelector('.open-gallery').addEventListener('click', () => openGallery());
</script>
```

> Set `data-pswp-width` and `data-pswp-height` to your actual full-size image dimensions.
> PhotoSwipe v5 uses these to size the lightbox before the image loads.

---

### curtains.js — WebGL hover distortion

curtains.js maps your image to a WebGL mesh and lets you apply GLSL shaders on hover.
The `gallery.html` in this starter uses a ripple vertex displacement shader.

```html
<div id="curtains-canvas" style="position:fixed;inset:0;pointer-events:none;z-index:0;"></div>

<script src="https://cdn.jsdelivr.net/npm/curtainsjs@8.1.6/dist/curtains.umd.min.js"></script>
<script>
const ENABLE_WEBGL = true; // set to false to disable

if (ENABLE_WEBGL) {
  const curtains = new Curtains({ container: 'curtains-canvas', autoResize: true });

  const plane = curtains.addPlane(document.querySelector('img.my-painting'), {
    vertexShader: `
      precision mediump float;
      attribute vec3 aVertexPosition;
      attribute vec2 aTextureCoord;
      uniform mat4 uMVMatrix, uPMatrix;
      uniform mat2 uTextureMatrix0;
      varying vec2 vTextureCoord;
      uniform float uTime, uIntensity;
      uniform vec2 uMousePos;

      void main() {
        vec3 pos = aVertexPosition;
        float dist = distance(aTextureCoord, uMousePos);
        pos.z += sin(dist * 25.0 - uTime * 2.0) * 0.04 * uIntensity * max(0.0, 1.0 - dist * 2.5);
        gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
        vTextureCoord = (uTextureMatrix0 * aTextureCoord).xy;
      }
    `,
    fragmentShader: `
      precision mediump float;
      varying vec2 vTextureCoord;
      uniform sampler2D uSampler0;
      void main() { gl_FragColor = texture2D(uSampler0, vTextureCoord); }
    `,
    widthSegments: 20,
    heightSegments: 20,
    uniforms: {
      time:      { name: 'uTime',      type: '1f', value: 0 },
      mousePos:  { name: 'uMousePos',  type: '2f', value: [0.5, 0.5] },
      intensity: { name: 'uIntensity', type: '1f', value: 0 },
    },
  });

  let targetIntensity = 0;
  let currentIntensity = 0;
  let time = 0;

  img.addEventListener('mouseenter', () => targetIntensity = 1);
  img.addEventListener('mouseleave', () => targetIntensity = 0);

  plane.onRender(() => {
    time += 0.015;
    currentIntensity += (targetIntensity - currentIntensity) * 0.07; // lerp
    plane.uniforms.time.value = time;
    plane.uniforms.intensity.value = currentIntensity;
  });
}
</script>
```

> curtains.js needs WebGL 1.0 — available in every modern browser. It falls back gracefully if WebGL is unavailable (the image just shows normally).

---

### SVG Film Grain — no library, no animation

Add this `<svg>` just inside `<body>`. The `feTurbulence` filter generates a static noise texture. No JavaScript, no animation, no performance cost.

```html
<svg class="grain" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
  <filter id="grain-filter">
    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#grain-filter)"/>
</svg>
```

```css
.grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  width: 100%;
  height: 100%;
  opacity: 0.038;    /* 0.02–0.06 is the useful range */
  mix-blend-mode: overlay;
}
```

> Lower `opacity` = more subtle. `mix-blend-mode: overlay` integrates the noise with the page colors naturally.
> Change `baseFrequency` to adjust grain size (higher = finer grain).

---

### data/artworks.js — single source of truth

Both `gallery.html` and `artwork-detail.html` load `data/artworks.js` via `<script src="data/artworks.js">`.
The file sets `window.ARTWORKS = [...]` — a plain array, no bundler needed.

**Why not an ES module?**  
Using `window.ARTWORKS` instead of `export const ARTWORKS` means the file works with a simple `<script src>` tag, without needing a local HTTP server for `import` to work. Great for artists opening files directly from their filesystem.

**Benefits of this pattern:**
- One edit updates gallery, detail pages, and checkout simultaneously
- No data drift between pages
- Easy to migrate to a CMS later — replace `artworks.js` with a fetch call

```js
// data/artworks.js
window.ARTWORKS = [
  {
    slug: 'painting-slug',    // must match the filename pattern images/painting-slug-1.jpg
    title: 'PAINTING TITLE',
    medium: 'Oil on linen, original',
    year: '2024',
    size: '21 × 30 cm',
    price: 420,
    description: 'Your description here.',
    note: null,
    images: ['images/painting-slug-1.jpg', 'images/painting-slug-2.jpg'],
    available: true,
    type: 'original',
  },
];
```

---

## Sold paintings & order flow

When an order is placed via `/api/checkout`:
1. The Worker inserts each painting's slug into `sold_paintings`
2. `GET /api/sold` returns the full list of sold slugs
3. `gallery.html` fetches this on load and adds `is-sold` class + "SOLD" badge
4. `artwork-detail.html` hides the buy button, shows a sold notice

**Manual unsell** (if an order is cancelled):
```bash
curl -X DELETE https://your-worker.workers.dev/api/sold/painting-slug \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET"
```

Or: Cloudflare Dashboard → D1 → your database → Run query:
```sql
DELETE FROM sold_paintings WHERE slug = 'painting-slug';
```

---

## Multi-painting discount

The Worker automatically applies discounts at checkout:
- 2 paintings → 10% off subtotal
- 3+ paintings → 15% off subtotal

Change these in `_worker/index.js`:
```js
const discount = n >= 3
  ? Math.round(subtotal * 0.15)
  : n >= 2 ? Math.round(subtotal * 0.10) : 0;
```

---

## Local development

```bash
# Serve the static site (pages + Worker together)
npx wrangler pages dev .

# Or just serve static files
npx serve .

# Worker only (for testing API)
cd _worker && wrangler dev
```

---

## CDN version reference

| Library | Version | CDN |
|---|---|---|
| Lenis | 1.1.14 | `cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js` |
| Splitting.js | 1.0.6 | `cdn.jsdelivr.net/npm/splitting@1.0.6/dist/splitting.min.js` |
| PhotoSwipe | 5.4.4 | `cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe-lightbox.esm.min.js` |
| curtains.js | 8.1.6 | `cdn.jsdelivr.net/npm/curtainsjs@8.1.6/dist/curtains.umd.min.js` |

---

## Credits

Built from the stack powering [melancholija.com](https://melancholija.com) — an independent dark art gallery by Arune Rutkute.

MIT License.
