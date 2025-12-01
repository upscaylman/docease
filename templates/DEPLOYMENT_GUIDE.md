# Guide de Déploiement - Versions Parallèles

## 🎯 Vue d'ensemble

Votre application est maintenant configurée pour déployer **deux versions en parallèle** :

```
Production (Netlify)
├── / (racine)           → Version 1 (HTML/JS classique)
└── /v2/                 → Version 2 (React/TypeScript)
```

## 📁 Structure des fichiers

```
n8n-automate/
├── package.json                    # Scripts de build racine
├── netlify.toml                    # Configuration Netlify
│
└── templates/
    ├── form/                       # Version 1 - Source
    │   ├── index.html
    │   ├── components/
    │   ├── assets/
    │   ├── package.json
    │   └── v2/                     # Version 2 - Build (généré)
    │       ├── index.html
    │       └── assets/
    │
    └── formulaire/                 # Version 2 - Source
        ├── App.tsx
        ├── components/
        ├── vite.config.ts
        └── package.json
```

## 🚀 Commandes de build

### Build complet (les deux versions)
```bash
npm run build
```

### Build version classique uniquement
```bash
npm run build:form
```

### Build version React uniquement
```bash
npm run build:react
```

## 🧪 Tests en local

### Option 1 : Script automatique (Recommandé)
```bash
cd templates
.\test-both-versions.ps1
```
Cela démarre :
- Version 1 sur http://localhost:8080
- Version 2 sur http://localhost:3000

### Option 2 : Manuel

**Version classique :**
```bash
cd templates/form
npx serve -p 8080 .
```

**Version React :**
```bash
cd templates/formulaire
npm run dev
```

## 🌐 Déploiement Netlify

### Configuration automatique

Le fichier `netlify.toml` est déjà configuré :

```toml
[build]
  base = "templates/form"
  publish = "."
  command = "npm run build"

# Route pour React (v2)
[[redirects]]
  from = "/v2/*"
  to = "/v2/index.html"
  status = 200

# Route pour version classique
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Process de déploiement

1. **Push sur Git** → Netlify détecte le changement
2. **Build automatique** :
   - Installe les dépendances de `templates/form`
   - Exécute `npm run build` qui :
     - Build la version classique
     - Build la version React dans `templates/form/v2/`
3. **Déploiement** : Tout le contenu de `templates/form/` est publié

### URLs de production

- **Version classique** : `https://votre-site.netlify.app/`
- **Version React** : `https://votre-site.netlify.app/v2/`

## 🔄 Navigation entre versions

Des badges ont été ajoutés dans les headers :

- **Version 1** : Badge "Essayer v2" → redirige vers `/v2/`
- **Version 2** : Badge "Version classique" → redirige vers `/`

## ⚙️ Variables d'environnement

Les deux versions partagent les mêmes variables Netlify :

```
GEMINI_API_KEY
N8N_WEBHOOK_URL
WEBHOOK_EMAIL_URL
WEBHOOK_PDF_CONVERT_URL
```

Configurées dans : **Netlify Dashboard → Site settings → Environment variables**

## 📊 Stratégie de migration

### Phase actuelle : Coexistence
- ✅ Les deux versions sont déployées
- ✅ Navigation facile entre les versions
- ✅ Tests utilisateurs possibles sur `/v2/`

### Prochaines étapes

1. **Tests** : Partager `/v2/` avec des utilisateurs test
2. **Feedback** : Collecter les retours et corriger
3. **Validation** : Quand v2 est stable
4. **Bascule** : Inverser les routes (v2 devient `/`, v1 devient `/v1/`)
5. **Décommissionnement** : Supprimer v1 quand plus nécessaire

## 🛠️ Maintenance

### Modifier la version classique
```bash
cd templates/form
# Éditer les fichiers
npm run build
```

### Modifier la version React
```bash
cd templates/formulaire
# Éditer les fichiers
npm run build
```

### Rebuild complet
```bash
# À la racine
npm run build
```

## 🐛 Troubleshooting

### Le build échoue
```bash
# Nettoyer et réinstaller
cd templates/form
rm -rf node_modules v2
npm install
cd ../formulaire
rm -rf node_modules
npm install
cd ../..
npm run build
```

### La version React ne s'affiche pas
- Vérifier que `/v2/` existe dans `templates/form/`
- Vérifier les redirections dans `netlify.toml`
- Vérifier les logs de build Netlify

### Les assets ne chargent pas
- Vérifier `base: '/v2/'` dans `vite.config.ts`
- Vérifier les chemins dans le HTML généré

## 📝 Notes importantes

- ⚠️ Le dossier `templates/form/v2/` est **généré automatiquement**
- ⚠️ Ne pas éditer directement les fichiers dans `v2/`
- ⚠️ Le `.gitignore` exclut `v2/` du versioning
- ✅ Seuls les sources dans `formulaire/` doivent être versionnés

