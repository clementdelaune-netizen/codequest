// Crée une session Stripe Checkout. La clé secrète n'est jamais envoyée au navigateur.
const PACKS = require("./lib/packs");
const stripe = require("./lib/stripe");
const json = (statusCode, data) => ({ statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(data) });
const RATE = new Map();
exports.handler = async event => {
  if (event.httpMethod !== "POST") return json(405, { error: "Méthode non autorisée" });
  const problem = stripe.keyProblem();
  if (problem) return json(503, { error: problem });
  const ip = (event.headers["x-nf-client-connection-ip"] || event.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const now = Date.now(), entry = RATE.get(ip);
  if (!entry || now > entry.until) RATE.set(ip, { count: 1, until: now + 60000 });
  else if (++entry.count > 8) return json(429, { error: "Trop de tentatives. Réessaie dans une minute." });
  try {
    const body = JSON.parse(event.body || "{}");
    const packId = String(body.packId || "");
    if (!/^[a-z0-9_]{1,40}$/.test(packId) || !PACKS[packId]) return json(400, { error: "Pack inconnu." });
    const pack = PACKS[packId];
    const base = (process.env.SITE_URL || process.env.URL || "https://codequeststudio.netlify.app").replace(/\/$/, "");
    const metadata = { packId, codes: String(pack.codes), uid: String(body.uid || "").slice(0, 80) };
    const params = {
      mode: "payment", locale: "fr", allow_promotion_codes: true,
      line_items: [{ quantity: 1, price_data: { currency: "eur", unit_amount: pack.amount, product_data: { name: pack.label } } }],
      metadata, payment_intent_data: { metadata },
      client_reference_id: metadata.uid || undefined,
      success_url: base + "/?payment=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: base + "/?payment=cancel"
    };
    if (typeof body.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) params.customer_email = body.email.trim().toLowerCase();
    const session = await stripe.call("POST", "/checkout/sessions", params);
    return json(200, { url: session.url });
  } catch (error) {
    console.error("[create-checkout]", error);
    return json(500, { error: "Impossible de créer le paiement pour le moment." });
  }
};