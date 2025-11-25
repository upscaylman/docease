// Configuration des variables d'environnement (pour Netlify)
// Variables d'environnement - peuvent être surchargées par Netlify
// En développement local, utilisez le proxy sur localhost:3000
// En production (Netlify), ces valeurs seront remplacées par les variables d'environnement
window.ENV = {
  WEBHOOK_URL: 'https://dee-wakeful-succulently.ngrok-free.dev/webhook/7f72ac69-35b7-4771-a5c6-7acb18947254',
  WEBHOOK_EMAIL_URL: 'https://dee-wakeful-succulently.ngrok-free.dev/webhook/1ee6e745-fc31-4fd8-bc59-531bd4a69997',
  WEBHOOK_PDF_CONVERT_URL: 'https://dee-wakeful-succulently.ngrok-free.dev/webhook/convert-pdf'
};

// Configuration de la version de l'application
// Modifiez cette valeur pour mettre à jour la version dans tout le site
window.APP_VERSION = '1.2.0';
