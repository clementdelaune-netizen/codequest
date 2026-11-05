// Renvoie uniquement les vidéos payées, approuvées et encore dans leur période.
const { getStore } = require("@netlify/blobs");
exports.handler = async event => {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" };
  if (event.httpMethod !== "GET") return { statusCode: 405, headers, body: JSON.stringify({ error: "Méthode non autorisée." }) };
  try {
    const store = getStore("cq_video_ads");
    const ads = (await store.get("ads", { type: "json" })) || [];
    const now = Date.now();
    const active = ads.filter(a => a && a.status === "approved" && Number(a.startsAt) <= now && Number(a.endsAt) > now)
      .sort((a,b) => Number(b.startsAt) - Number(a.startsAt)).slice(0, 5);
    return { statusCode: 200, headers, body: JSON.stringify({ ads: active }) };
  } catch (error) {
    console.error("[active-ads]", error);
    return { statusCode: 503, headers, body: JSON.stringify({ error: "Publicités indisponibles." }) };
  }
};