/**
 * Script de build pour garantir la cohérence entre local et production
 * Ce script s'assure que tous les fichiers CSS sont correctement générés
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Démarrage du build pour Netlify...\n');

// 1. Vérifier que tous les fichiers CSS nécessaires existent
const requiredCssFiles = [
  'assets/css/tailwind.css',
  'assets/css/base.css',
  'assets/css/animations.css',
  'assets/css/components.css',
  'assets/css/layout.css',
  'assets/design-system/index.css'
];

console.log('📋 Vérification des fichiers CSS requis...');
requiredCssFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fichier manquant: ${file}`);
    process.exit(1);
  }
  console.log(`✅ ${file}`);
});

// 2. Compiler Tailwind CSS
console.log('\n🎨 Compilation de Tailwind CSS...');
try {
  execSync('npx tailwindcss -i ./src/input.css -o ./assets/css/tailwind.css --minify', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  console.log('✅ Tailwind CSS compilé avec succès');
} catch (error) {
  console.error('❌ Erreur lors de la compilation Tailwind:', error.message);
  process.exit(1);
}

// 3. Vérifier que le fichier compilé existe et a une taille raisonnable
const tailwindPath = path.join(__dirname, 'assets/css/tailwind.css');
if (fs.existsSync(tailwindPath)) {
  const stats = fs.statSync(tailwindPath);
  console.log(`✅ tailwind.css généré (${Math.round(stats.size / 1024)} KB)`);
  
  // Vérifier que le fichier n'est pas vide
  if (stats.size < 1000) {
    console.error('❌ Le fichier tailwind.css est trop petit, la compilation a probablement échoué');
    process.exit(1);
  }
} else {
  console.error('❌ Le fichier tailwind.css n\'a pas été généré');
  process.exit(1);
}

// 4. Vérifier que index.html existe
const indexPath = path.join(__dirname, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html introuvable');
  process.exit(1);
}
console.log('✅ index.html trouvé');

// 5. Vérifier que tous les liens CSS dans index.html pointent vers des fichiers existants
console.log('\n🔍 Vérification des liens CSS dans index.html...');
const indexContent = fs.readFileSync(indexPath, 'utf8');
const cssLinks = indexContent.match(/href=["']([^"']+\.css)["']/g) || [];

cssLinks.forEach(link => {
  const href = link.match(/href=["']([^"']+)["']/)[1];
  // Ignorer les URLs externes
  if (href.startsWith('http') || href.startsWith('//')) {
    return;
  }
  
  const cssPath = path.join(__dirname, href);
  if (!fs.existsSync(cssPath)) {
    console.error(`❌ Fichier CSS introuvable: ${href}`);
    process.exit(1);
  }
  console.log(`✅ ${href}`);
});

console.log('\n✅ Build terminé avec succès !');
console.log('📦 Le projet est prêt pour le déploiement sur Netlify');

