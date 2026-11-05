// Modération des vidéos. Configurer ADMIN_AD_SECRET dans Netlify.
const { getStore } = require("@netlify/blobs");
const json = (statusCode, data) => ({ statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(data) });
exports.handler = async event => {
  if (!process.env.ADMIN_AD_SECRET) return json(503, { error: "ADMIN_AD_SECRET n'est pas configuré." });
  const supplied = event.headers["x-admin-key"] || event.headers["X-Admin-Key"] || "";
  const a = Buffer.from(String(supplied)), b = Buffer.from(String(process.env.ADMIN_AD_SECRET));
  if (a.length !== b.length || !require("crypto").timingSafeEqual(a,b)) return json(401, { error: "Accès refusé." });
  if (!["GET","POST"].includes(event.httpMethod)) return json(405, { error: "Méthode non autorisée." });
  try {
    const store = getStore("cq_video_ads");
    const ads = (await store.get("ads", { type: "json" })) || [];
    if (event.httpMethod === "GET") return json(200, { ads: ads.filter(a => a.status === "pending") });
    const body = JSON.parse(event.body || "{}");
    const id = String(body.id || "");
    const action = String(body.action || "");
    if (!id || !["approve","reject"].includes(action)) return json(400, { error: "Action ou identifiant invalide." });
    const index = ads.findIndex(a => a.id === id);
    if (index < 0) return json(404, { error: "Vidéo introuvable." });
    if (action === "approve") {
      ads[index].status = "approved";
      ads[index].startsAt = Date.now();
      ads[index].endsAt = ads[index].startsAt + ads[index].days * 86400000;
    } else ads[index].status = "rejected";
    ads[index].moderatedAt = Date.now();
    await store.setJSON("ads", ads);
    return json(200, { ok: true, ad: ads[index] });
  } catch (error) {
    console.error("[admin-ads]", error);
    return json(500, { error: "Erreur de modération." });
  }
};