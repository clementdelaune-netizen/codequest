// Checkout pour la mise en avant payante d'une vidéo YouTube.
const stripe = require("./lib/stripe");
const PLANS = {
  ad_1: { days: 1, amount: 299, label: "Vidéo sponsorisée — 1 jour" },
  ad_7: { days: 7, amount: 999, label: "Vidéo sponsorisée — 7 jours" },
  ad_30: { days: 30, amount: 2499, label: "Vidéo sponsorisée — 30 jours" }
};
const json = (statusCode, data) => ({ statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(data) });
function youtubeId(value) {
  try {
    const u = new URL(value);
    if (u.hostname === "youtu.be") return u.pathname.split("/").filter(Boolean)[0] || null;
    if (!["youtube.com","www.youtube.com","m.youtube.com","youtube-nocookie.com"].includes(u.hostname)) return null;
    if (u.pathname === "/watch") return u.searchParams.get("v");
    const m = u.pathname.match(/^\/(?:embed|shorts)\/([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  } catch { return null; }
}
exports.handler = async event => {
  if (event.httpMethod !== "POST") return json(405, { error: "Méthode non autorisée." });
  const problem = stripe.keyProblem();
  if (problem) return json(503, { error: problem });
  try {
    const body = JSON.parse(event.body || "{}");
    const uid = String(body.uid || "").slice(0, 80);
    const title = String(body.title || "").trim().replace(/[<>]/g, "").slice(0, 60);
    const videoId = youtubeId(String(body.videoUrl || ""));
    const plan = PLANS[String(body.planId || "")];
    if (uid.length < 5) return json(400, { error: "Connecte-toi ou crée ton profil avant de proposer une vidéo." });
    if (!title) return json(400, { error: "Ajoute un titre à ta vidéo." });
    if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) return json(400, { error: "Lien YouTube invalide. Utilise un lien youtube.com ou youtu.be." });
    if (!plan) return json(400, { error: "Durée de publicité inconnue." });
    const adId = require("crypto").randomUUID();
    const base = (process.env.SITE_URL || process.env.URL || "https://codequeststudio.netlify.app").replace(/\/$/, "");
    const metadata = { type: "video_ad", adId, uid, videoId, title, days: String(plan.days) };
    const params = {
      mode: "payment", locale: "fr", allow_promotion_codes: true,
      line_items: [{ quantity: 1, price_data: { currency: "eur", unit_amount: plan.amount, product_data: { name: plan.label, description: "Soumission pour modération avant diffusion sur CodeQuest." } } }],
      metadata, payment_intent_data: { metadata },
      success_url: base + "/?payment=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: base + "/?payment=cancel"
    };
    if (typeof body.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) params.customer_email = body.email.trim().toLowerCase();
    const session = await stripe.call("POST", "/checkout/sessions", params);
    return json(200, { url: session.url });
  } catch (error) {
    console.error("[create-ad-checkout]", error);
    return json(500, { error: "Impossible de préparer le paiement publicitaire." });
  }
};