# Formulaire de Génération de Document

Ce dossier contient le formulaire HTML pour générer des documents via n8n.

## 🚀 Utilisation

### Option 1 : Utiliser le serveur HTTP intégré (Recommandé)

Pour éviter les problèmes CORS avec l'origine `null`, servez le formulaire via un serveur HTTP :

#### Windows (PowerShell)
```powershell
cd templates/form
.\serve-form.ps1
```

#### Windows (Batch)
```cmd
cd templates/form
serve-form.bat
```

Le formulaire sera accessible sur : **http://localhost:3000**

### Option 2 : Ouvrir directement le fichier

Si vous ouvrez `form.html` directement dans le navigateur (double-clic), vous pouvez rencontrer des erreurs CORS car l'origine sera `null`.

## ⚙️ Configuration CORS

Le serveur configure automatiquement les headers CORS pour permettre les requêtes vers n8n.

## 🔧 Résolution des problèmes CORS

Si vous rencontrez toujours des erreurs CORS :

1. **Redémarrez n8n** après avoir modifié la configuration :
   ```powershell
   cd docker
   docker-compose restart n8n
   ```

2. **Vérifiez que les variables d'environnement sont correctes** dans `docker/.env` :
   ```env
   N8N_CORS_ENABLED=true
   N8N_CORS_ALLOW_ORIGIN=*
   ```

3. **Vérifiez que le webhook est public** dans votre workflow n8n :
   - Ouvrez votre workflow dans n8n
   - Cliquez sur le nœud Webhook
   - Assurez-vous que "Public" est activé

4. **Utilisez le serveur HTTP** au lieu d'ouvrir le fichier directement

## 📝 URLs des Webhooks

Assurez-vous que les URLs dans `form.html` correspondent à vos webhooks n8n :

- Formulaire principal : `http://localhost:5678/webhook-test/formulaire-doc`
- Validation : `http://localhost:5678/webhook-test/validate-doc`

## 🔍 Vérifier le webhook

Pour vérifier que le webhook est accessible :
```powershell
.\scripts\check-webhook.ps1
```

Pour plus d'informations, consultez :
- `docs/ACTIVER_WEBHOOK.md` - Guide d'activation du webhook
- `docs/VERIFIER_WEBHOOK.md` - Guide de vérification et dépannage

