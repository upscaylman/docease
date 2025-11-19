/**
 * Script de build pour consolider tous les fichiers CSS du Design System
 * en un seul fichier pour éviter les problèmes de @import en production
 */

const fs = require('fs');
const path = require('path');

// Fonction pour résoudre les @import
function resolveImports(cssContent, baseDir) {
  return cssContent.replace(/@import\s+['"]([^'"]+)['"];?/g, (match, importPath) => {
    // Résoudre le chemin relatif
    const fullPath = path.resolve(baseDir, importPath);
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  Fichier non trouvé: ${fullPath}`);
      return `/* ${match} - FILE NOT FOUND */`;
    }
    
    let importedContent = fs.readFileSync(fullPath, 'utf8');
    
    // Résoudre récursivement les imports dans le fichier importé
    const importedDir = path.dirname(fullPath);
    importedContent = resolveImports(importedContent, importedDir);
    
    return `\n/* Imported from: ${importPath} */\n${importedContent}\n/* End of: ${importPath} */\n`;
  });
}

// Chemin du Design System
const designSystemPath = path.join(__dirname, 'assets', 'design-system', 'index.css');
const outputPath = path.join(__dirname, 'assets', 'design-system', 'index.consolidated.css');

if (!fs.existsSync(designSystemPath)) {
  console.error('❌ Fichier Design System non trouvé:', designSystemPath);
  process.exit(1);
}

console.log('📦 Consolidation du Design System CSS...');

// Lire le fichier principal
let cssContent = fs.readFileSync(designSystemPath, 'utf8');

// Résoudre tous les imports
const baseDir = path.dirname(designSystemPath);
cssContent = resolveImports(cssContent, baseDir);

// Écrire le fichier consolidé
fs.writeFileSync(outputPath, cssContent, 'utf8');

console.log('✅ Design System consolidé créé:', outputPath);
console.log(`📊 Taille: ${(cssContent.length / 1024).toFixed(2)} KB`);

