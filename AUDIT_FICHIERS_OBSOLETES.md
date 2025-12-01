# Audit des fichiers obsolètes - Version 2 (React)

## 📋 Méthodologie

Analyse complète des fichiers du projet pour identifier :
1. ✅ Fichiers utilisés par la v2
2. ❌ Fichiers obsolètes (non utilisés par la v2)
3. ⚠️ Fichiers à conserver (infrastructure, v1, config)

---

## ✅ FICHIERS UTILISÉS PAR LA V2

### Core Application (`templates/formulaire/`)
- ✅ `App.tsx` - Composant principal
- ✅ `index.tsx` - Point d'entrée React
- ✅ `index.html` - HTML de base
- ✅ `styles.css` - Styles globaux
- ✅ `api.ts` - Appels API vers n8n
- ✅ `config.ts` - Configuration webhooks
- ✅ `constants.ts` - Constantes (templates, champs, steps)
- ✅ `types.ts` - Types TypeScript
- ✅ `vite.config.ts` - Configuration Vite
- ✅ `tsconfig.json` - Configuration TypeScript
- ✅ `package.json` - Dépendances
- ✅ `package-lock.json` - Lock des dépendances
- ✅ `.gitignore` - Exclusions Git

### Composants (`templates/formulaire/components/`)
- ✅ `Button.tsx` - Boutons réutilisables
- ✅ `ErrorBoundary.tsx` - Gestion erreurs React
- ✅ `Footer.tsx` - Pied de page
- ✅ `FormStep.tsx` - Étapes du formulaire
- ✅ `Header.tsx` - En-tête avec actions
- ✅ `Input.tsx` - Champs de formulaire
- ✅ `Modals.tsx` - Modales (preview, share)
- ✅ `OptimizedImage.tsx` - Images lazy-loaded
- ✅ `Sidebar.tsx` - Sélection templates
- ✅ `Spinner.tsx` - Loading states
- ✅ `Toast.tsx` - Notifications

### Hooks (`templates/formulaire/hooks/`)
- ✅ `index.ts` - Export des hooks
- ✅ `useDocumentCache.ts` - Cache documents
- ✅ `useFormValidation.ts` - Validation formulaire
- ✅ `useTemplateData.ts` - Données par template

### Constantes (`templates/formulaire/constants/`)
- ✅ `ui.ts` - Constantes UI (couleurs, durées, regex, etc.)

### Utils (`templates/formulaire/utils/`)
- ✅ `validation.ts` - Fonctions de validation

### Assets (`templates/formulaire/public/assets/img/`)
- ✅ `favicon.png` - Icône du site
- ✅ `logo_piedpage.png` - Logo footer
- ✅ `designation_template.png` - Aperçu template
- ✅ `nego_template.png` - Aperçu template
- ✅ `custom_template.png` - Aperçu template

### Scripts (`templates/formulaire/scripts/`)
- ✅ `compress-images.js` - Optimisation images

---

## ❌ FICHIERS OBSOLÈTES (À SUPPRIMER)

### Racine du projet
- ❌ `temp_components.css` - Fichier temporaire
- ❌ `temp_fields.js` - Fichier temporaire
- ❌ `test.txt` - Fichier de test
- ❌ `test_webhook_direct.ps1` - Doublon (existe dans archive/)
- ❌ `test_workflow.ps1` - Doublon (existe dans archive/)
- ❌ `workflow-check.json` - Doublon (existe dans archive/)
- ❌ `workflow-current-check.json` - Doublon (existe dans archive/)
- ❌ `modify_workflow.py` - Doublon (existe dans archive/)

### Documentation obsolète (`templates/`)
- ❌ `templates/DEPLOYMENT_CHECKLIST.md` - Créé pour l'audit, non utilisé
- ❌ `templates/DEPLOYMENT_GUIDE.md` - Créé pour l'audit, non utilisé
- ❌ `templates/MIGRATION_V2.md` - Créé pour l'audit, non utilisé
- ❌ `templates/QUICK_START_V2.md` - Créé pour l'audit, non utilisé
- ❌ `templates/README_V2.md` - Créé pour l'audit, non utilisé

### Documentation obsolète (`templates/formulaire/`)
- ❌ `templates/formulaire/PERFORMANCE.md` - Créé pour l'audit, non utilisé
- ❌ `templates/formulaire/README.md` - Créé pour l'audit, non utilisé

### Assets inutilisés (`templates/formulaire/public/assets/img/`)
- ❌ `Capture d'écran 2025-11-13 120922.png` - Screenshot non utilisé

### Documentation racine obsolète
- ❌ `CHANGELOG_V2_MIGRATION.md` - Créé pour l'audit, non utilisé

---

## ⚠️ FICHIERS À CONSERVER (Infrastructure)

### Configuration projet
- ⚠️ `netlify.toml` - Config Netlify (OBLIGATOIRE)
- ⚠️ `package.json` - Scripts de build racine
- ⚠️ `README.md` - Documentation principale
- ⚠️ `QUICK_START.md` - Guide démarrage rapide

### Version 1 (v1) - À CONSERVER
- ⚠️ `templates/form/` - **TOUT LE DOSSIER** (v1 en production)
  - Contient la version classique HTML/JS
  - Utilisée en production sur `/`
  - Le sous-dossier `v2/` est généré automatiquement par le build

### Configuration
- ⚠️ `templates/config/` - Variables d'environnement
- ⚠️ `config/` - Configuration globale

### Infrastructure Docker/n8n
- ⚠️ `docker/` - Configuration Docker
- ⚠️ `workflows/` - Workflows n8n
- ⚠️ `mcp-server/` - Serveur MCP

### Scripts utiles
- ⚠️ `scripts/` - Scripts d'administration
- ⚠️ `start.bat`, `stop.bat`, `start.ps1`, `stop.ps1` - Gestion services
- ⚠️ `install-ngrok.bat`, `setup-ngrok.bat`, `start-ngrok.bat`, `stop-ngrok.bat` - Ngrok
- ⚠️ `prepare-production.bat` - Préparation production

### Archives
- ⚠️ `archive/` - Archives historiques (peut être conservé ou supprimé selon besoin)
- ⚠️ `docs/archive/` - Documentation archivée

### Documentation active
- ⚠️ `docs/` - Documentation n8n/workflow (hors archive/)

### Migration
- ⚠️ `migration/` - Scripts de migration VPS

### Templates Word
- ⚠️ `templates/word/` - Templates Word (.docx)
- ⚠️ `templates/html/` - Templates HTML
- ⚠️ `templates/samples/` - Exemples

---

## 📊 RÉSUMÉ

| Catégorie | Nombre | Action |
|-----------|--------|--------|
| ✅ Fichiers v2 utilisés | ~40 | **Conserver** |
| ❌ Fichiers obsolètes | 13 | **Supprimer** |
| ⚠️ Infrastructure | ~100+ | **Conserver** |

---

## 🗑️ COMMANDES DE SUPPRESSION

```powershell
# Fichiers temporaires racine
Remove-Item "temp_components.css" -Force
Remove-Item "temp_fields.js" -Force
Remove-Item "test.txt" -Force
Remove-Item "test_webhook_direct.ps1" -Force
Remove-Item "test_workflow.ps1" -Force
Remove-Item "workflow-check.json" -Force
Remove-Item "workflow-current-check.json" -Force
Remove-Item "modify_workflow.py" -Force

# Documentation obsolète
Remove-Item "CHANGELOG_V2_MIGRATION.md" -Force
Remove-Item "templates/DEPLOYMENT_CHECKLIST.md" -Force
Remove-Item "templates/DEPLOYMENT_GUIDE.md" -Force
Remove-Item "templates/MIGRATION_V2.md" -Force
Remove-Item "templates/QUICK_START_V2.md" -Force
Remove-Item "templates/README_V2.md" -Force
Remove-Item "templates/formulaire/PERFORMANCE.md" -Force
Remove-Item "templates/formulaire/README.md" -Force

# Asset inutilisé
Remove-Item "templates/formulaire/public/assets/img/Capture d'écran 2025-11-13 120922.png" -Force
```

---

## ✅ VALIDATION

Après suppression, vérifier que :
1. ✅ `npm run build` fonctionne
2. ✅ La v2 se lance en dev : `cd templates/formulaire && npm run dev`
3. ✅ La v1 fonctionne toujours
4. ✅ Le déploiement Netlify passe

