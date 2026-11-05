# CodeQuest

Site éducatif hébergé sur Netlify.

## Fonctions ajoutées

- QCM : les choix sont mélangés sans perdre la bonne réponse.
- Classement : sauvegarde via Netlify Blobs.
- Boutique : packs de 500 à 50 000 Codes.
- Publicités vidéo sponsorisées : liens YouTube payants pour 1, 7 ou 30 jours, affichés sur l'accueil après modération.

## Configuration Netlify

Dans **Site configuration → Environment variables**, configurer :

- `STRIPE_SECRET_KEY` : clé secrète Stripe (ne jamais la mettre dans GitHub ni dans le code du navigateur).
- `SITE_URL` : `https://codequeststudio.netlify.app` (facultatif si Netlify fournit déjà `URL`).
- `ADMIN_AD_SECRET` : une longue clé secrète aléatoire réservée à l'administrateur.

Le projet utilise `@netlify/blobs` pour conserver le classement et les annonces vidéo. Redéployer le site après avoir configuré les variables.

## Modération des vidéos

1. Ouvrir `https://codequeststudio.netlify.app/admin-pubs.html`.
2. Saisir la valeur de `ADMIN_AD_SECRET`.
3. Examiner chaque vidéo et cliquer sur **Approuver et publier** ou **Refuser**.
4. Une vidéo approuvée apparaît sur l'accueil pour la durée payée (1, 7 ou 30 jours).

Les vidéos doivent être des liens YouTube valides. Une soumission payée reste en attente jusqu'à approbation. Les clés secrètes ne doivent jamais être ajoutées à ce dépôt.

## Paiements

Le site utilise Stripe Checkout hébergé. Les prix et les produits sont définis côté serveur dans `netlify/functions`. Le navigateur ne décide jamais qu'un paiement est confirmé.
