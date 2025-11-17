# 🐳 Configuration Docker

## 📋 Organisation des Fichiers

### Fichiers Docker Compose

| Fichier | Usage | Description |
|---------|-------|-------------|
| **`docker-compose.yml`** | **Développement** | Configuration par défaut pour les tests locaux (SQLite + Ollama) |
| `docker-compose.prod.yml` | Production | Configuration pour la production (PostgreSQL + Caddy) |
| `docker-compose-local.yml` | ⚠️ Déprécié | Ancien fichier, remplacé par `docker-compose.dev.yml` |
| `docker-compose-prod.yml` | ⚠️ Déprécié | Ancien fichier, remplacé par `docker-compose.yml` |

## 🚀 Utilisation

### Développement Local

```bash
# Démarrer en mode développement (fichier par défaut)
cd docker
docker compose up -d

# Ou utiliser les scripts
./start.ps1        # Windows PowerShell
./start.bat        # Windows CMD
./scripts/start.sh # Linux/Mac
```

**Configuration développement :**
- Base de données : PostgreSQL
- Services : n8n + PostgreSQL + Ollama
- Logs : Mode `debug`
- CORS : Permissif (`*`)
- Authentification : Désactivée

### Production

```bash
# Démarrer en mode production
cd docker
docker compose -f docker-compose.prod.yml up -d
```

**Configuration production :**
- Base de données : PostgreSQL
- Services : n8n + PostgreSQL + Caddy
- Logs : Mode `info`
- CORS : Restreint (domaines spécifiques)
- Authentification : Activée
- HTTPS : Automatique (Caddy + Let's Encrypt)

## ⚙️ Configuration

### Variables d'Environnement

Créez un fichier `.env` dans le dossier `docker/` :

```env
# Production
N8N_HOST=votre-domaine.com
N8N_PROTOCOL=https
POSTGRES_PASSWORD=mot_de_passe_securise
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_PASSWORD=mot_de_passe_securise
N8N_CORS_ALLOW_ORIGIN=https://votre-domaine.com
```

Voir `env.example` pour la liste complète des variables.

## 📝 Notes Importantes

1. **Fichier principal = Développement** : `docker-compose.yml` est maintenant la configuration de développement par défaut
2. **Production explicite** : Utilisez `-f docker-compose.prod.yml` pour la production
3. **Sécurité** : Ne commitez jamais le fichier `.env` avec des mots de passe réels
4. **Migration** : Si vous aviez des conteneurs avec l'ancienne configuration, arrêtez-les d'abord :
   ```bash
   docker compose down
   docker compose -f docker-compose.dev.yml down
   ```

## 🔄 Migration depuis l'Ancienne Organisation

Si vous utilisiez `docker-compose-prod.yml` :

```bash
# Ancienne commande
docker compose -f docker-compose-prod.yml up -d

# Nouvelle commande
docker compose -f docker-compose.prod.yml up -d
```

Si vous utilisiez `docker-compose.yml` pour le développement :

```bash
# Ancienne commande
docker compose up -d

# Nouvelle commande (même résultat - c'est maintenant le défaut)
docker compose up -d
```

## 🆘 Dépannage

### Erreur "no configuration file provided"

Assurez-vous d'être dans le dossier `docker/` :
```bash
cd docker
docker compose up -d
```

### Conteneurs en conflit

Si vous avez des conteneurs avec les anciens noms :
```bash
# Arrêter tous les conteneurs
docker compose down
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose-prod.yml down  # Si existe encore

# Supprimer les conteneurs orphelins
docker container prune
```

### Vérifier quelle configuration est utilisée

```bash
# Voir les conteneurs actifs
docker ps

# Voir la configuration d'un conteneur
docker inspect n8n-prod  # Production
docker inspect n8n-local  # Développement
```

