# Instructions Copilot pour n8n-automate

Ce projet est un système d'automatisation de documents basé sur n8n, utilisant des workflows pour générer des documents Word personnalisés avec validation humaine.

## 🏗️ Architecture Principale

- **Frontend**: Formulaire HTML sur port 3000 (serveur proxy PowerShell)
- **Backend**: n8n sur port 5678 (conteneur Docker)
- **Services**: 
  - Ollama/LM Studio (IA - modèle Gemma2)
  - Docxtemplater (templates Word)
  - SMTP/OAuth2 (envoi emails)

## 📋 Flux de Données Principal

1. `templates/form/form.html` → POST vers `/webhook/formulaire-doc`
2. Proxy CORS (port 3000) → n8n Webhook (port 5678)
3. Workflow n8n:
   - Formatage données (`Préparer Données` node)
   - Génération IA optionnelle (`Appel IA Gemma` node)
   - Remplissage template Word (`Remplir Template Docx` node)
   - Prévisualisation HTML (`Convertir en HTML` node)
   - Validation manuelle (`Validation Webhook` node)
   - Envoi email final (`Envoi Email` node)

## 🔑 Conventions Importantes

### Structure des Variables
```javascript
// Format attendu dans les nodes n8n
{
  civiliteDestinataire: string,  // "Monsieur" | "Madame"
  nomDestinataire: string,
  statutDestinataire: string,
  batiment?: string,
  adresse: string,
  cpVille: string,
  objet: string,
  numeroCourrier?: string
}
```

### Templates Word
- Stockés dans `templates/word/`
- Utiliser la syntaxe Docxtemplater pour les variables: `{variable}`
- Toujours monter en lecture seule dans Docker: `ro` flag

### Workflow Development
- Workflow principal dans `workflows/dev/gpt_generator.json`
- Toujours activer CORS dans les nodes Webhook:
  ```json
  {
    "httpMethod": "POST",
    "path": "validate-doc",
    "options": {
      "allowedOrigins": "*"
    }
  }
  ```

## 🛠️ Commandes Essentielles

- Démarrage: `./start.bat` (Windows) ou `./scripts/start.sh` (Linux)
- Arrêt: `./stop.bat` (Windows) ou `./scripts/stop.sh` (Linux)
- Logs: `docker logs n8n-local -f`
- URLs:
  - Interface n8n: http://localhost:5678
  - Formulaire: http://localhost:3000

## ⚠️ Points d'Attention

1. **Configuration CORS**: Toujours vérifier dans `docker-compose.yml`:
   ```yaml
   environment:
     - N8N_CORS_ENABLED=true
     - N8N_CORS_ALLOW_ORIGIN=*
   ```

2. **Validation Workflow**: Utiliser `test-webhook-modes.ps1` pour tester les différents modes

3. **Modifications de Template**: Toujours utiliser les nodes existants, ne pas créer de duplicatas