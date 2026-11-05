// Vérifie le paiement côté serveur avant de créditer les Codes.
const PACKS = require("./lib/packs");
const stripe = require("./lib/stripe");
const json = (statusCode, data) => ({ statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(data) });
exports.handler = async event => {
  if (event.httpMethod !== "GET") return json(405, { error: "Méthode non autorisée" });
  const problem = stripe.keyProblem();
  if (problem) return json(503, { error: problem });
  const { session_id, uid } = event.queryStringParameters || {};
  if (!session_id || !/^cs_(test|live)_/.test(session_id) || !uid) return json(400, { error: "Paramètres invalides." });
  try {
    const session = await stripe.call("GET", "/checkout/sessions/" + encodeURIComponent(session_id), { expand: ["payment_intent"] });
    if (session.payment_status !== "paid") return json(200, { paid: false });
    if (String(session.metadata?.uid || "") !== String(uid).slice(0, 80)) return json(403, { paid: true, codes: 0, error: "Ce paiement ne correspond pas à ce compte." });
    const pack = PACKS[session.metadata?.packId];
    if (!pack) return json(200, { paid: true, codes: 0, error: "Pack introuvable." });
    const pi = session.payment_intent;
    if (!pi || typeof pi !== "object") return json(200, { paid: true, codes: 0, error: "Paiement sans référence vérifiable." });
    const owner = pi.metadata?.claimed_by;
    if (owner && owner !== uid) return json(200, { paid: true, codes: 0, error: "Ce paiement a déjà été récupéré." });
    if (!owner) await stripe.call("POST", "/payment_intents/" + pi.id, { metadata: { claimed_by: uid } });
    return json(200, { paid: true, codes: pack.codes, session_id });
  } catch (error) {
    console.error("[verify-payment]", error);
    return json(500, { error: "Impossible de vérifier le paiement pour le moment." });
  }
};