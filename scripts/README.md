# Scripts Utilitaires

Ce dossier contient tous les scripts pour gérer n8n facilement.

## 📋 Scripts Disponibles

### start.sh
Démarre n8n en mode développement local.

**Usage :**
```bash
./scripts/start.sh
```

**Fonctionnalités :**
- Vérifie que Docker est démarré
- Crée le fichier .env si nécessaire
- Démarre les conteneurs Docker
- Affiche le statut et l'URL d'accès

### stop.sh
Arrête n8n et tous les conteneurs associés.

**Usage :**
```bash
./scripts/stop.sh
```

**Fonctionnalités :**
- Arrête proprement tous les conteneurs
- Conserve les données (volumes Docker)

### logs.sh
Affiche les logs de n8n en temps réel.

**Usage :**
```bash
./scripts/logs.sh          # Suit les logs en temps réel
./scripts/logs.sh 100      # Affiche les 100 dernières lignes
```

**Fonctionnalités :**
- Suit les logs en temps réel (Ctrl+C pour quitter)
- Peut afficher un nombre spécifique de lignes

### backup.sh
Sauvegarde tous les workflows et données n8n.

**Usage :**
```bash
./scripts/backup.sh
```

**Fonctionnalités :**
- Exporte tous les workflows
- Sauvegarde les templates
- Sauvegarde le volume Docker n8n_data
- Crée une archive datée dans `backups/`
- Nettoie automatiquement les backups de plus de 30 jours

**Localisation des backups :**
```
backups/n8n_backup_YYYYMMDD_HHMMSS.tar.gz
```

## 🪟 Utilisation sur Windows

Les scripts `.sh` sont conçus pour Linux/macOS. Sur Windows, vous avez plusieurs options :

### Option 1 : Git Bash (recommandé)
Si vous avez Git installé, Git Bash est inclus et permet d'exécuter les scripts `.sh`.

### Option 2 : PowerShell
Vous pouvez créer des équivalents PowerShell (`.ps1`). Exemple pour `start.ps1` :

```powershell
cd docker
docker-compose up -d
Write-Host "✅ n8n démarré sur http://localhost:5678"
docker-compose ps
```

### Option 3 : Commandes Docker directement
Vous pouvez utiliser Docker Compose directement :

```powershell
# Démarrer
cd docker
docker-compose up -d

# Arrêter
docker-compose down

# Logs
docker-compose logs -f n8n
```

## 🔧 Personnalisation

Vous pouvez modifier les scripts selon vos besoins :

- Ajouter des vérifications supplémentaires
- Modifier les chemins
- Ajouter des notifications (email, Slack, etc.)
- Intégrer avec d'autres outils

## ⚠️ Permissions

Sur Linux/macOS, assurez-vous que les scripts sont exécutables :

```bash
chmod +x scripts/*.sh
```

## 🆘 Problèmes Courants

### "Permission denied"
```bash
chmod +x scripts/start.sh
```

### "No such file or directory"
Vérifiez que vous êtes dans le bon répertoire :
```bash
pwd  # Doit afficher le chemin du projet
```

### Scripts ne fonctionnent pas sur Windows
Utilisez Git Bash ou créez des scripts PowerShell équivalents.

---

Pour plus d'informations, consultez la documentation principale dans `docs/`.

