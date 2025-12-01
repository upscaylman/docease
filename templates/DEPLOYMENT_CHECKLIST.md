# ✅ Checklist de Déploiement - Version React v2

## Avant le déploiement

### 1. Tests locaux
- [ ] Tester la version classique (v1) sur http://localhost:8080
- [ ] Tester la version React (v2) sur http://localhost:3000
- [ ] Vérifier la navigation entre les deux versions (badges)
- [ ] Tester toutes les fonctionnalités principales :
  - [ ] Sélection de template
  - [ ] Remplissage du formulaire
  - [ ] Prévisualisation
  - [ ] Téléchargement
  - [ ] Partage par email

### 2. Build local
- [ ] Exécuter `npm run build` sans erreurs
- [ ] Vérifier que `templates/form/v2/` est créé
- [ ] Vérifier que `templates/form/v2/index.html` existe
- [ ] Vérifier que `templates/form/v2/assets/` contient les fichiers JS

### 3. Configuration
- [ ] Vérifier `netlify.toml` :
  - [ ] `base = "templates/form"`
  - [ ] `publish = "."`
  - [ ] Redirections pour `/v2/*` et `/*`
- [ ] Vérifier `vite.config.ts` :
  - [ ] `base: '/v2/'`
  - [ ] `outDir: '../form/v2'`
- [ ] Vérifier `package.json` (racine) :
  - [ ] Script `build` appelle `build:form` et `build:react`

### 4. Variables d'environnement Netlify
- [ ] `GEMINI_API_KEY` configurée
- [ ] `N8N_WEBHOOK_URL` configurée
- [ ] `WEBHOOK_EMAIL_URL` configurée
- [ ] `WEBHOOK_PDF_CONVERT_URL` configurée

## Déploiement

### 5. Git
```bash
# Vérifier les fichiers modifiés
git status

# Ajouter les fichiers
git add .

# Commit
git commit -m "feat: ajout version React v2 en parallèle"

# Push
git push
```

- [ ] Commit créé
- [ ] Push effectué
- [ ] Netlify détecte le changement

### 6. Build Netlify
- [ ] Ouvrir Netlify Dashboard
- [ ] Vérifier que le build démarre
- [ ] Surveiller les logs de build
- [ ] Vérifier que le build se termine avec succès
- [ ] Temps de build : ~2-3 minutes

### 7. Vérification du déploiement
- [ ] Le site est déployé
- [ ] Pas d'erreurs dans les logs
- [ ] Le dossier `v2/` est présent dans le déploiement

## Après le déploiement

### 8. Tests en production

**Version classique (v1)**
- [ ] Accéder à `https://votre-site.netlify.app/`
- [ ] La page se charge correctement
- [ ] Les styles sont appliqués
- [ ] Les fonctionnalités marchent
- [ ] Le badge "Essayer v2" est visible

**Version React (v2)**
- [ ] Accéder à `https://votre-site.netlify.app/v2/`
- [ ] La page se charge correctement
- [ ] Les styles sont appliqués
- [ ] Les composants React s'affichent
- [ ] Le badge "Version classique" est visible

### 9. Navigation
- [ ] Cliquer sur "Essayer v2" dans v1 → redirige vers `/v2/`
- [ ] Cliquer sur "Version classique" dans v2 → redirige vers `/`
- [ ] Les URLs sont correctes
- [ ] Pas d'erreurs 404

### 10. Fonctionnalités
Tester dans **les deux versions** :
- [ ] Sélection de template
- [ ] Formulaire multi-étapes
- [ ] Validation des champs
- [ ] Prévisualisation du document
- [ ] Téléchargement Word
- [ ] Envoi par email
- [ ] Responsive mobile

### 11. Performance
- [ ] Temps de chargement < 3 secondes
- [ ] Pas d'erreurs dans la console
- [ ] Pas de warnings critiques
- [ ] Les assets se chargent correctement

### 12. SEO et Métadonnées
- [ ] Titre de la page correct
- [ ] Meta description présente
- [ ] Favicon visible
- [ ] Open Graph tags (si applicable)

## En cas de problème

### Rollback rapide
Si la v2 ne fonctionne pas :
1. La v1 reste accessible sur `/` (pas d'impact)
2. Corriger le problème en local
3. Rebuild et redéployer

### Debug
```bash
# Logs Netlify
# Aller dans : Netlify Dashboard → Deploys → [dernier deploy] → Deploy log

# Tester le build localement
npm run build

# Vérifier les fichiers générés
ls templates/form/v2/

# Nettoyer et rebuilder
cd templates/form
rm -rf node_modules v2
npm install
cd ../formulaire
rm -rf node_modules
npm install
cd ../..
npm run build
```

## Communication

### 13. Annonce aux utilisateurs
- [ ] Préparer un message d'annonce
- [ ] Partager le lien `/v2/` avec les testeurs
- [ ] Collecter les retours
- [ ] Créer un formulaire de feedback (optionnel)

### 14. Documentation
- [ ] Mettre à jour le README principal
- [ ] Documenter les nouvelles fonctionnalités de v2
- [ ] Créer un guide de migration pour les utilisateurs

## Suivi post-déploiement

### 15. Monitoring (première semaine)
- [ ] Vérifier les logs d'erreurs Netlify
- [ ] Surveiller les analytics (si configurés)
- [ ] Collecter les retours utilisateurs
- [ ] Noter les bugs éventuels

### 16. Itération
- [ ] Corriger les bugs critiques rapidement
- [ ] Planifier les améliorations
- [ ] Préparer la bascule complète vers v2

---

## 🎉 Déploiement réussi !

Une fois toutes les cases cochées, votre migration progressive est en place.

**Prochaine étape** : Collecter les retours et itérer sur la v2 avant la bascule complète.

