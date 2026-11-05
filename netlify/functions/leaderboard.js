// Classement persistant CodeQuest via Netlify Blobs.
const { getStore } = require("@netlify/blobs");
const json = (statusCode, data) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" },
  body: JSON.stringify(data)
});
const cleanInt = v => Math.max(0, Math.min(100000000, Number.parseInt(v, 10) || 0));
exports.handler = async event => {
  if (event.httpMethod === "OPTIONS") return json(200, {});
  if (!["GET", "POST"].includes(event.httpMethod)) return json(405, { error: "Méthode non autorisée" });
  try {
    const store = getStore("cq_leaderboard");
    const players = (await store.get("players", { type: "json" })) || [];
    if (event.httpMethod === "GET") return json(200, { ok: true, count: players.length, players });
    let body;
    try { body = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "JSON invalide" }); }
    if (typeof body.uid !== "string" || body.uid.length < 5) return json(400, { error: "Identifiant invalide" });
    const player = {
      uid: body.uid.slice(0, 60),
      u: String(body.u || "Codeur").trim().slice(0, 25) || "Codeur",
      a: String(body.a || "bot_green_code").slice(0, 50),
      xp: cleanInt(body.xp), cd: cleanInt(body.cd), tl: cleanInt(body.tl), st: cleanInt(body.st),
      isReal: true, updatedAt: Date.now()
    };
    const byId = new Map(players.filter(p => p && typeof p.uid === "string").map(p => [p.uid, p]));
    const old = byId.get(player.uid);
    // Empêche une actualisation de diminuer les meilleurs scores enregistrés.
    if (old) {
      player.xp = Math.max(player.xp, cleanInt(old.xp));
      player.cd = Math.max(player.cd, cleanInt(old.cd));
      player.tl = Math.max(player.tl, cleanInt(old.tl));
      player.st = Math.max(player.st, cleanInt(old.st));
    }
    byId.set(player.uid, player);
    const updated = [...byId.values()].sort((a,b) => cleanInt(b.xp) - cleanInt(a.xp)).slice(0, 200);
    await store.setJSON("players", updated);
    return json(200, { ok: true, saved: player, count: updated.length, players: updated });
  } catch (error) {
    console.error("[leaderboard]", error);
    return json(503, { error: "Classement temporairement indisponible." });
  }
};