// Cloudflare Worker — dark-art-gallery-starter
// Handles: likes, sold tracking, order placement, payment-status check
//
// D1 Database bindings required (wrangler.toml):
//   [[d1_databases]]
//   binding = "DB"
//   database_name = "your-gallery-db"
//   database_id = "YOUR_D1_DATABASE_ID"
//
// Run schema.sql to create tables before deploying.

// ── Config ────────────────────────────────────────────────────────────────────
// Replace with your actual frontend domain(s)
const ALLOWED_ORIGINS = [
  'https://your-domain.com',
  'http://localhost:8788', // wrangler pages dev
  'http://localhost:1234',
];

// Orders above this amount use bank transfer; below use PayPal
const CARD_THRESHOLD = 500;

// Your PayPal.me handle (or leave blank and use PayPal.me manually)
const PAYPAL_ME = 'YOUR_PAYPAL_HANDLE';

// Bank transfer details
const PAYEE_IBAN = 'YOUR_IBAN_HERE';
const PAYEE_NAME = 'Your Full Name';

// Shipping rates in EUR by ISO 3166-1 alpha-2 country code
const SHIPPING_RATES = {
  LT:8,  LV:5,  EE:5,  PL:8,
  DE:10, FR:10, NL:10, BE:10,
  AT:10, CH:12, IT:10, ES:12,
  SE:12, NO:15, DK:12, FI:12,
  CZ:10, SK:10, HU:10, RO:12,
  BG:12, HR:12, SI:10, PT:12,
  GR:12, IE:12, GB:15, US:25,
  CA:28, AU:32, OTHER:30,
};

// ── CORS helper ───────────────────────────────────────────────────────────────
function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

function json(data, status = 200, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(request),
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    // ── GET /api/sold ─────────────────────────────────────────────────────────
    if (request.method === 'GET' && url.pathname === '/api/sold') {
      const { results } = await env.DB.prepare(
        'SELECT slug FROM sold_paintings'
      ).all();
      return json(results.map(r => r.slug), 200, request);
    }

    // ── GET /api/counts ───────────────────────────────────────────────────────
    if (request.method === 'GET' && url.pathname === '/api/counts') {
      const { results } = await env.DB.prepare(
        'SELECT slug, count FROM likes ORDER BY count DESC'
      ).all();
      return json(results, 200, request);
    }

    // ── POST /api/like/:slug ──────────────────────────────────────────────────
    const likeMatch = url.pathname.match(/^\/api\/like\/([^/]+)$/);
    if (request.method === 'POST' && likeMatch) {
      const slug = likeMatch[1];
      const body = await request.json().catch(() => ({}));
      const liked = body.liked;

      if (liked) {
        await env.DB.prepare(
          'INSERT INTO likes (slug, count) VALUES (?, 1) ON CONFLICT(slug) DO UPDATE SET count = count + 1'
        ).bind(slug).run();
      } else {
        await env.DB.prepare(
          'UPDATE likes SET count = MAX(0, count - 1) WHERE slug = ?'
        ).bind(slug).run();
      }

      const row = await env.DB.prepare(
        'SELECT count FROM likes WHERE slug = ?'
      ).bind(slug).first();

      return json({ slug, count: row?.count ?? 0 }, 200, request);
    }

    // ── POST /api/checkout ────────────────────────────────────────────────────
    if (request.method === 'POST' && url.pathname === '/api/checkout') {
      const body = await request.json().catch(() => null);
      if (!body) return json({ error: 'Invalid request body' }, 400, request);

      const { customer, cart, country } = body;

      if (!customer?.email || !Array.isArray(cart) || !cart.length || !country) {
        return json({ error: 'Missing required fields: customer.email, cart, country' }, 400, request);
      }

      const subtotal = cart.reduce((s, i) => s + (Number(i.price) || 0), 0);
      const n = cart.length;
      const discount = n >= 3
        ? Math.round(subtotal * 0.15)
        : n >= 2 ? Math.round(subtotal * 0.10) : 0;
      const shipping = SHIPPING_RATES[country] ?? SHIPPING_RATES.OTHER;
      const total = subtotal - discount + shipping;

      const orderRef = 'GAL-' + Date.now().toString(36).toUpperCase();
      const method = subtotal > CARD_THRESHOLD ? 'banktransfer' : 'paypal';

      // Insert order
      await env.DB.prepare(
        'INSERT INTO orders (order_ref, status, total, customer_email, method, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(orderRef, 'pending', total, customer.email, method, Date.now()).run().catch(() => {});

      // Mark paintings as sold (INSERT OR IGNORE = idempotent)
      for (const item of cart) {
        if (item.slug) {
          await env.DB.prepare(
            'INSERT OR IGNORE INTO sold_paintings (slug, order_ref, sold_at) VALUES (?, ?, ?)'
          ).bind(item.slug, orderRef, Date.now()).run().catch(() => {});
        }
      }

      if (method === 'banktransfer') {
        return json({
          method: 'banktransfer',
          orderRef,
          total: total.toFixed(2),
          iban: PAYEE_IBAN,
          beneficiary: PAYEE_NAME,
        }, 200, request);
      }

      return json({
        method: 'paypal',
        orderRef,
        total: total.toFixed(2),
        paypalMe: `https://www.paypal.com/paypalme/${PAYPAL_ME}/${total.toFixed(2)}EUR`,
        items: cart.map(i => i.title).join(', '),
      }, 200, request);
    }

    // ── GET /api/payment-status?ref=GAL-xxx ───────────────────────────────────
    if (request.method === 'GET' && url.pathname === '/api/payment-status') {
      const ref = url.searchParams.get('ref');
      if (!ref) return json({ error: 'Missing ref' }, 400, request);

      const row = await env.DB.prepare(
        'SELECT order_ref, status, total, method, created_at FROM orders WHERE order_ref = ?'
      ).bind(ref).first();

      if (!row) return json({ error: 'Order not found' }, 404, request);
      return json(row, 200, request);
    }

    // ── Manually unsell a painting (admin use) ────────────────────────────────
    // DELETE /api/sold/:slug — remove from sold_paintings table
    // Useful if an order is cancelled before payment
    const unsellMatch = url.pathname.match(/^\/api\/sold\/([^/]+)$/);
    if (request.method === 'DELETE' && unsellMatch) {
      // Basic auth check — set a secret in your Worker env vars
      const authHeader = request.headers.get('Authorization') || '';
      if (env.ADMIN_SECRET && authHeader !== `Bearer ${env.ADMIN_SECRET}`) {
        return json({ error: 'Unauthorized' }, 401, request);
      }
      const slug = unsellMatch[1];
      await env.DB.prepare(
        'DELETE FROM sold_paintings WHERE slug = ?'
      ).bind(slug).run();
      return json({ slug, unsold: true }, 200, request);
    }

    return new Response('Not found', { status: 404 });
  },
};
