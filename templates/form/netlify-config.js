/**
 * Script pour générer la configuration Netlify
 * Ce fichier peut être utilisé avec un build script pour injecter les variables d'environnement
 */

// Ce script peut être exécuté lors du build pour remplacer les valeurs dans index.html
// Exemple d'utilisation avec un script de build :
// node netlify-config.js

const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, 'index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// Récupérer les variables d'environnement
const webhookUrl = process.env.WEBHOOK_URL || 'https://dee-wakeful-succulently.ngrok-free.dev/webhook/7f72ac69-35b7-4771-a5c6-7acb18947254';
const webhookEmailUrl = process.env.WEBHOOK_EMAIL_URL || 'https://dee-wakeful-succulently.ngrok-free.dev/webhook/1ee6e745-fc31-4fd8-bc59-531bd4a69997';
const webhookPdfConvertUrl = process.env.WEBHOOK_PDF_CONVERT_URL || 'https://dee-wakeful-succulently.ngrok-free.dev/webhook/convert-pdf';

// Remplacer les valeurs dans index.html
indexHtml = indexHtml.replace(
  /WEBHOOK_URL: '[^']*'/,
  `WEBHOOK_URL: '${webhookUrl}'`
);
indexHtml = indexHtml.replace(
  /WEBHOOK_EMAIL_URL: '[^']*'/,
  `WEBHOOK_EMAIL_URL: '${webhookEmailUrl}'`
);
indexHtml = indexHtml.replace(
  /WEBHOOK_PDF_CONVERT_URL: '[^']*'/,
  `WEBHOOK_PDF_CONVERT_URL: '${webhookPdfConvertUrl}'`
);

// Écrire le fichier modifié
fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');

console.log('Configuration Netlify appliquée :');
console.log(`  WEBHOOK_URL: ${webhookUrl}`);
console.log(`  WEBHOOK_EMAIL_URL: ${webhookEmailUrl}`);
console.log(`  WEBHOOK_PDF_CONVERT_URL: ${webhookPdfConvertUrl}`);

