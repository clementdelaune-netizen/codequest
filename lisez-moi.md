# CodeQuest v9

## Fichiers (lecture rapide pour une IA ou un humain)
- `index.html` (75 Ko) : structure + CSS
- `app.js` (135 Ko) : TOUTE la logique, un seul script fusionné — lire celui-ci en priorité
- `data.js` (18 Mo) : données seulement (THEME, DESC, CUR, LANG_HISTORY, WORLDS), une constante par ligne — ne pas lire en entier
- `netlify/functions/` : paiements Stripe (`create-checkout.js`, `verify-payment.js`, `lib/packs.js`, `lib/stripe.js` — aucune dépendance npm)
- `tools/cq.py` : outil unique (`stats`, `audit`, `export`) + `tools/data_worlds.py` (source des mondes)

## Déploiement
1. Envoie tout ce dossier sur Netlify.
2. Variables d'environnement Netlify : `STRIPE_SECRET_KEY`, puis redéploie.
3. Google Cloud Console : origine autorisée `https://codequeststudio.netlify.app`, API Drive activée, écran de consentement « En production ».

## Mode Invité
Bouton « Continuer en mode Invité » sur l'écran d'entrée : progression sauvegardée sur l'appareil, export/import d'un fichier dans « Compte », et possibilité de passer à Google plus tard (la progression est conservée).

## Si un paiement échoue
Le message d'erreur indique la cause : clé `STRIPE_SECRET_KEY` absente ou publique (`pk_`), fonction introuvable (dossier `netlify/functions` non déployé), ou message de Stripe. Logs détaillés : Netlify > Functions > create-checkout.
