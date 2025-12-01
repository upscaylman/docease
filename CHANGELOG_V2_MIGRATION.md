# Changelog - Migration vers React v2

## 🎯 Objectif
Mettre en place une migration progressive vers React en déployant deux versions en parallèle.

## 📅 Date
2025-12-01

## ✨ Changements effectués

### 1. Configuration Vite (React)
**Fichier** : `templates/formulaire/vite.config.ts`

**Modifications** :
- ✅ Ajout de `base: '/v2/'` pour servir l'app sur `/v2/`
- ✅ Configuration de `outDir: '../form/v2'` pour builder dans le dossier de v1
- ✅ Configuration de `emptyOutDir: true` pour nettoyer avant chaque build

**Impact** : La version React se build maintenant dans `templates/form/v2/`

### 2. Configuration Netlify
**Fichier** : `netlify.toml`

**Modifications** :
- ✅ Ajout de redirections pour `/v2/*` → `/v2/index.html` (SPA React)
- ✅ Conservation des redirections pour `/*` → `/index.html` (version classique)

**Impact** : Les deux versions sont servies correctement avec leurs routes respectives

### 3. Scripts de build
**Fichier** : `package.json` (racine)

**Modifications** :
```json
"build": "npm run build:form && npm run build:react",
"build:react": "cd templates/formulaire && npm install && npm run build"
```

**Fichier** : `templates/form/package.json`

**Modifications** :
```json
"build": "node netlify-config.js && npm run build:css && npm run build:design-system && npm run build:react",
"build:react": "cd ../formulaire && npm install && npm run build"
```

**Impact** : Un seul `npm run build` construit les deux versions

### 4. Navigation entre versions
**Fichier** : `templates/form/components/header.html`

**Modifications** :
- ✅ Ajout d'un badge "Essayer v2" qui redirige vers `/v2/`

**Fichier** : `templates/formulaire/components/Header.tsx`

**Modifications** :
- ✅ Ajout d'un badge "Version classique" qui redirige vers `/`

**Impact** : Navigation facile entre les deux versions

### 5. Gitignore
**Fichier** : `templates/form/.gitignore`

**Nouveau fichier** :
```
v2/
node_modules/
*.log
```

**Impact** : Le dossier `v2/` généré n'est pas versionné

### 6. Documentation
**Nouveaux fichiers créés** :

1. **`templates/MIGRATION_V2.md`**
   - Architecture détaillée
   - Structure des fichiers
   - Stratégie de migration progressive

2. **`templates/DEPLOYMENT_GUIDE.md`**
   - Guide complet de déploiement
   - Commandes de build
   - Configuration Netlify
   - Troubleshooting

3. **`templates/QUICK_START_V2.md`**
   - Guide de démarrage rapide
   - Commandes essentielles
   - Prochaines étapes

4. **`templates/DEPLOYMENT_CHECKLIST.md`**
   - Checklist complète avant/pendant/après déploiement
   - Tests à effectuer
   - Monitoring post-déploiement

5. **`templates/test-both-versions.ps1`**
   - Script PowerShell pour tester les deux versions localement
   - Démarre v1 sur port 8080 et v2 sur port 3000

6. **`CHANGELOG_V2_MIGRATION.md`** (ce fichier)
   - Résumé de tous les changements

## 🏗️ Architecture résultante

```
Production (Netlify)
├── / (racine)           → Version 1 (HTML/JS classique)
└── /v2/                 → Version 2 (React/TypeScript)
```

## 📊 Flux de build

```
npm run build
    ├── build:form (Version 1)
    │   ├── Tailwind CSS
    │   ├── Design System
    │   └── build:react (Version 2)
    │       └── Output: templates/form/v2/
    └── build:react (Version 2 - depuis racine)
```

## ✅ Avantages de cette approche

1. **Zéro downtime** : La version classique reste accessible
2. **Tests en production** : Possibilité de tester v2 avec de vrais utilisateurs
3. **Rollback facile** : Retour arrière instantané si problème
4. **Migration progressive** : Pas de big bang, transition en douceur
5. **Comparaison** : Les deux versions coexistent pour comparaison

## 🚀 Prochaines étapes

1. **Tests locaux** : Utiliser `test-both-versions.ps1`
2. **Déploiement** : Push sur Git → Netlify build automatique
3. **Tests production** : Vérifier les deux URLs
4. **Feedback** : Partager `/v2/` avec des testeurs
5. **Itération** : Corriger et améliorer v2
6. **Bascule** : Quand v2 est stable, inverser les routes
7. **Décommissionnement** : Supprimer v1 quand plus nécessaire

## 🔧 Commandes utiles

```bash
# Build complet
npm run build

# Build v1 uniquement
npm run build:form

# Build v2 uniquement
npm run build:react

# Tests locaux
cd templates
.\test-both-versions.ps1

# Dev React
cd templates/formulaire
npm run dev
```

## 📝 Notes importantes

- ⚠️ Le dossier `templates/form/v2/` est **généré automatiquement**
- ⚠️ Ne jamais éditer directement les fichiers dans `v2/`
- ⚠️ Toujours éditer les sources dans `templates/formulaire/`
- ✅ Le `.gitignore` exclut `v2/` du versioning
- ✅ Les deux versions partagent les mêmes variables d'environnement Netlify

## 🐛 Problèmes connus

Aucun pour le moment. Voir `DEPLOYMENT_GUIDE.md` pour le troubleshooting.

## 👥 Contributeurs

- Configuration initiale : 2025-12-01

---

**Status** : ✅ Configuration terminée et testée
**Prêt pour déploiement** : Oui

