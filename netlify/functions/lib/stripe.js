// Client Stripe REST : la clé secrète reste exclusivement dans les variables Netlify.
function keyProblem() {
  const k = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!k) return "STRIPE_SECRET_KEY manquante dans les variables d'environnement Netlify.";
  if (k.startsWith("pk_")) return "Une clé publique a été fournie au lieu de la clé secrète Stripe.";
  if (!/^(sk|rk)_(test|live)_/.test(k)) return "STRIPE_SECRET_KEY invalide.";
  return null;
}
function flatten(obj, prefix, out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? prefix + "[" + k + "]" : k;
    if (v == null) continue;
    if (Array.isArray(v)) v.forEach((x, i) => {
      if (x && typeof x === "object") flatten(x, key + "[" + i + "]", out);
      else out.append(key + "[" + i + "]", String(x));
    });
    else if (typeof v === "object") flatten(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}
async function call(method, path, params) {
  const problem = keyProblem();
  if (problem) throw new Error(problem);
  let url = "https://api.stripe.com/v1" + path;
  const opts = { method, headers: { Authorization: "Bearer " + process.env.STRIPE_SECRET_KEY.trim() } };
  if (params && method === "GET") url += "?" + flatten(params).toString();
  else if (params) {
    opts.headers["Content-Type"] = "application/x-www-form-urlencoded";
    opts.body = flatten(params).toString();
  }
  const response = await fetch(url, opts);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Erreur Stripe " + response.status);
  return data;
}
module.exports = { keyProblem, call };