/**
 * Validation et prévisualisation
 */

import { CONFIG, getElement } from "../core/config.js";
import { getVariablesConfig } from "../core/state.js";

/**
 * Vérifier si tous les champs requis sont remplis
 */
export function checkRequiredFields() {
  const previewBtn = getElement(CONFIG.SELECTORS.previewBtn);
  const templateSelect = getElement(CONFIG.SELECTORS.templateSelect);

  if (!previewBtn || !templateSelect) return;

  // Vérifier si un template est sélectionné
  if (!templateSelect.value) {
    previewBtn.disabled = true;
    return;
  }

  // Vérifier tous les champs required (sauf destinataires qui n'est plus obligatoire)
  const dynamicFields = getElement(CONFIG.SELECTORS.dynamicFields);
  if (!dynamicFields) return;

  const requiredFields = dynamicFields.querySelectorAll("[required]");
  let allFilled = true;

  requiredFields.forEach((field) => {
    if (!field.value || field.value.trim() === "") {
      allFilled = false;
    }
  });

  previewBtn.disabled = !allFilled;
}

/**
 * Collecter les données du formulaire
 * @returns {Object} Données du formulaire
 */
export function collectFormData() {
  const templateSelect = getElement(CONFIG.SELECTORS.templateSelect);
  const destinataires = getElement(CONFIG.SELECTORS.destinatairesHidden);
  const dynamicFields = getElement(CONFIG.SELECTORS.dynamicFields);

  const templateType = templateSelect?.value || "";

  const data = {
    templateType: templateType,
    emailEnvoi: destinataires?.value || "",
  };

  // Ajouter le nom du template pour le nom de fichier
  const variablesConfig = getVariablesConfig();
  if (
    variablesConfig &&
    variablesConfig.templates &&
    variablesConfig.templates[templateType]
  ) {
    const templateConfig = variablesConfig.templates[templateType];
    data.templateName = templateConfig.nom || templateType;
  } else {
    data.templateName = templateType;
  }

  if (dynamicFields) {
    const allInputs = dynamicFields.querySelectorAll("input, select, textarea");
    allInputs.forEach((input) => {
      data[input.id] = input.value || "";
    });
  }

  // Ajouter le message personnalisé s'il existe (depuis l'attribut data)
  const customMessage = document.body.getAttribute("data-custom-email-message");
  if (customMessage) {
    data.customEmailMessage = customMessage;
  }

  return data;
}

/**
 * Charger le template HTML de prévisualisation
 * @returns {Promise<string>} Contenu HTML du template
 */
let previewTemplateCache = null;

async function loadPreviewTemplate() {
  if (previewTemplateCache) {
    console.log("✓ Template template-custom.html récupéré du cache");
    return previewTemplateCache;
  }

  try {
    console.log("Chargement du template depuis /html/template-custom/template-custom.html...");
    const response = await fetch("/html/template-custom/template-custom.html");
    console.log("Réponse du serveur:", response.status, response.statusText);

    if (!response.ok) {
      throw new Error(
        `Erreur lors du chargement du template: ${response.status} ${response.statusText}`
      );
    }

    previewTemplateCache = await response.text();
    console.log(
      "✓ Template chargé, taille:",
      previewTemplateCache.length,
      "caractères"
    );

    // Vérifier que le template contient bien du contenu
    if (!previewTemplateCache || previewTemplateCache.trim().length === 0) {
      throw new Error("Template vide");
    }

    return previewTemplateCache;
  } catch (error) {
    console.error(
      "✗ ERREUR lors du chargement du template template-custom.html:",
      error
    );
    console.error("Détails:", error.message);
    // Retourner null pour utiliser le fallback
    return null;
  }
}

/**
 * Remplacer les variables dans le template HTML
 * @param {string} template - Template HTML avec variables
 * @param {Object} data - Données du formulaire
 * @returns {string} HTML avec variables remplacées
 */
function replaceTemplateVariables(template, data) {
  let html = template;

  // Enrichir les données avec des variables calculées
  const enrichedData = { ...data };

  // Ajouter la variable {genre} basée sur la civilité
  if (data.civiliteDestinataire) {
    const civilite = data.civiliteDestinataire.toLowerCase();
    if (civilite.includes('monsieur')) {
      enrichedData.genre = 'M.';
    } else if (civilite.includes('madame')) {
      enrichedData.genre = 'Mme';
    } else {
      enrichedData.genre = '';
    }
  }

  // Ajouter la variable {genre} basée sur la civilité
  if (data.civiliteDestinataire) {
    const civilite = data.civiliteDestinataire.toLowerCase();
    if (civilite.includes('monsieur')) {
      enrichedData.genre = 'M.';
    } else if (civilite.includes('madame')) {
      enrichedData.genre = 'Mme';
    } else {
      enrichedData.genre = '';
    }
  }

  // DÉTECTION DU TYPE DE TEMPLATE ET SUPPRESSION DES SECTIONS INUTILES
  const templateType = data.templateType || 'custom';
  console.log('Type de template détecté:', templateType);

  if (templateType === 'designation') {
    console.log('✓ Mode DÉSIGNATION');
    // Supprimer "Société " en dur dans l'en-tête (Négociation uniquement)
    html = html.replace(/<!-- Société en dur \(Négociation uniquement\) --><span class="wcspan wctext001"[^>]*>Société <\/span>/g, '');
    // Repositionner {entreprise} à left:0pt après suppression de "Société "
    html = html.replace(/(<span class="wcspan wctext001" style="font-size:11pt; )left:40pt(; top:0\.36pt; line-height:12\.29pt;">\{entreprise\}<\/span>)/g, '$1left:0pt$2');
    // Supprimer "Objet : {objet}" variable (garder uniquement "Objet : Lettre recommandée...")
    html = html.replace(/<span class="wcspan wctext003"[^>]*>\{objet\}<\/span>/g, '');
    // Supprimer le corps Custom ({civiliteDestinataire} {nomDestinataire})
    html = html.replace(/<!-- Corps Custom -->[\s\S]*?<div class="wcdiv" style="top:76\.68pt;">[\s\S]*?<\/div>/g, '');
    // Supprimer tout le contenu Négociation
    html = html.replace(/<!-- ========== CORPS - TEMPLATE NÉGOCIATION ========== -->[\s\S]*?(?=<!-- ========== DÉLÉGUÉ - TEMPLATE DÉSIGNATION)/g, '');
    // Supprimer la section délégué Négociation (garder Désignation)
    html = html.replace(/<!-- ========== DÉLÉGUÉ - TEMPLATE NÉGOCIATION ========== -->[\s\S]*?(?=<div class="wcdiv" style="top:165\.23pt;">)/g, '');
    // Supprimer la formule Négociation (garder la formule Désignation "Veuillez agréer, Monsieur...")
    html = html.replace(/<!-- Formule Négociation -->[\s\S]*?Veuillez agréer, \{civiliteDestinataire\}, l'expression de nos sincères salutations\.[\s\S]*?<\/div>/g, '');
  } else if (templateType === 'negociation') {
    console.log('✓ Mode NÉGOCIATION');
    // Supprimer "Objet : Lettre recommandée avec A.R. – Désignation"
    html = html.replace(/<span class="wcspan wctext003"[^>]*>Objet : Lettre recommandée avec A\.R\. – Désignation<\/span>/g, '');
    // Supprimer le corps Custom ({civiliteDestinataire} {nomDestinataire})
    html = html.replace(/<!-- Corps Custom -->[\s\S]*?<div class="wcdiv" style="top:76\.68pt;">[\s\S]*?<\/div>/g, '');
    // Supprimer tout le contenu Désignation spécifique
    html = html.replace(/<!-- ========== CORPS - TEMPLATE DÉSIGNATION ========== -->[\s\S]*?(?=<!-- ========== CORPS - TEMPLATE NÉGOCIATION)/g, '');
    // Supprimer la section délégué Désignation (garder Négociation)
    html = html.replace(/<!-- ========== DÉLÉGUÉ - TEMPLATE DÉSIGNATION ========== -->[\s\S]*?(?=<!-- ========== DÉLÉGUÉ - TEMPLATE NÉGOCIATION)/g, '');
    // Supprimer la phrase de demande de convocations (Désignation uniquement)
    html = html.replace(/<!-- Demande convocations \(Désignation uniquement\) -->[\s\S]*?Nous vous demandons de bien vouloir lui adresser toutes convocations et informations nécessaires à l'exercice de son mandat\.[\s\S]*?<\/div>/g, '');
    // Supprimer le remplacement (Désignation uniquement)
    html = html.replace(/<!-- Remplacement \(Désignation uniquement\) -->[\s\S]*?En remplacement de \{civiliteRemplace\} \{nomRemplace\}\.[\s\S]*?<\/div>/g, '');
    // Supprimer la formule Désignation (garder la formule Négociation avec {civiliteDestinataire})
    html = html.replace(/<!-- Formule Désignation -->[\s\S]*?Veuillez agréer, Monsieur, l'expression de nos sincères salutations\.[\s\S]*?<\/div>/g, '');
  } else {
    console.log('✓ Mode CUSTOM');
    // Supprimer "Société " en dur dans l'en-tête (Négociation uniquement)
    html = html.replace(/<!-- Société en dur \(Négociation uniquement\) --><span class="wcspan wctext001"[^>]*>Société <\/span>/g, '');
    // Repositionner {entreprise} à left:0pt après suppression de "Société "
    html = html.replace(/(<span class="wcspan wctext001" style="font-size:11pt; )left:40pt(; top:0\.36pt; line-height:12\.29pt;">\{entreprise\}<\/span>)/g, '$1left:0pt$2');
    // Supprimer "Objet : Lettre recommandée avec A.R. – Désignation"
    html = html.replace(/<span class="wcspan wctext003"[^>]*>Objet : Lettre recommandée avec A\.R\. – Désignation<\/span>/g, '');
    // Supprimer TOUT le contenu Désignation et Négociation
    html = html.replace(/<!-- ========== CORPS - TEMPLATE DÉSIGNATION ========== -->[\s\S]*?(?=<!-- ========== CONTENU LIBRE)/g, '');
    // Supprimer la phrase de demande de convocations (Désignation uniquement)
    html = html.replace(/<!-- Demande convocations \(Désignation uniquement\) -->[\s\S]*?Nous vous demandons de bien vouloir lui adresser toutes convocations et informations nécessaires à l'exercice de son mandat\.[\s\S]*?<\/div>/g, '');
    // Supprimer TOUTES les formules de politesse (Désignation ET Négociation)
    html = html.replace(/<!-- Formule Négociation -->[\s\S]*?Veuillez agréer, \{civiliteDestinataire\}, l'expression de nos sincères salutations\.[\s\S]*?<\/div>/g, '');
    html = html.replace(/<!-- Formule Désignation -->[\s\S]*?Veuillez agréer, Monsieur, l'expression de nos sincères salutations\.[\s\S]*?<\/div>/g, '');
  }

  // TRAITEMENT DU TEMPLATE template-custom.html
  // Remplacer toutes les variables {variable} par leurs valeurs
  Object.keys(enrichedData).forEach((key) => {
    const value = enrichedData[key] || "";
    const regex = new RegExp(`\\{${key}\\}`, "g");
    html = html.replace(regex, value);
  });

  // Remplacer la date hardcodée "Paris, le 22 November 2025" et la variable {date}
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const dateComplet = `Paris, le ${dateStr}`;
  
  // Remplacer la date hardcodée dans le template
  html = html.replace(/Paris,\s*le\s*\d{1,2}\s+[A-Za-z]+\s+\d{4}/g, dateComplet);
  
  // Remplacer la variable {date}
  html = html.replace(/\{date\}/g, dateStr);

  // Convertir les chemins relatifs en chemins absolus pour que ça fonctionne dans l'iframe
  // Détecter si on est en prod (Netlify) ou en local
  const baseUrl = window.location.hostname.includes('netlify.app') 
    ? window.location.origin 
    : 'http://localhost:8080';
  
  // Remplacer href="1763822792_template-custom/styles.css" par le chemin absolu
  html = html.replace(
    /href="1763822792_template-custom\//g,
    `href="${baseUrl}/html/template-custom/1763822792_template-custom/`
  );
  
  // Remplacer data="1763822792_template-custom/xxx.svg" par le chemin absolu
  html = html.replace(
    /data="1763822792_template-custom\//g,
    `data="${baseUrl}/html/template-custom/1763822792_template-custom/`
  );
  
  // Remplacer src="1763822792_template-custom/" par le chemin absolu
  html = html.replace(
    /src="1763822792_template-custom\//g,
    `src="${baseUrl}/html/template-custom/1763822792_template-custom/`
  );
  
  // Remplacer les chemins des images logo (en-tête et pied de page)
  html = html.replace(
    /src="assets\/img\//g,
    `src="${baseUrl}/assets/img/`
  );

  // Remplacer les variables non définies par des chaînes vides
  html = html.replace(/\{[^}]+\}/g, "");
  
  // Supprimer les lignes qui ne contiennent que des espaces/tags vides après le remplacement
  // Supprimer les spans vides : <span...></span>
  html = html.replace(/<span[^>]*>\s*<\/span>/g, "");
  
  // Supprimer les divs qui ne contiennent que des espaces après suppression des spans
  html = html.replace(/<div[^>]*>\s*<\/div>/g, "");
  
  // Répéter le processus pour les divs imbriqués
  html = html.replace(/<div[^>]*>\s*<\/div>/g, "");

  return html;
}

/**
 * Extraire le contenu du body et les styles du template HTML
 * @param {string} fullHtml - HTML complet avec DOCTYPE, head, body
 * @returns {Object} {styles: string, bodyContent: string}
 */
function extractPreviewContent(fullHtml) {
  // Extraire TOUS les styles du <head> et du <style>
  const styleMatches = fullHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  const styles = styleMatches
    ? styleMatches.map((s) => s.replace(/<\/?style[^>]*>/gi, "")).join("\n")
    : "";

  // Extraire le contenu du <body> complet
  const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyContent = bodyMatch ? bodyMatch[1] : fullHtml;

  // Nettoyer : retirer les scripts qui ne sont pas nécessaires pour l'affichage
  bodyContent = bodyContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

  return { styles, bodyContent };
}

/**
 * Générer le HTML de prévisualisation
 * @param {Object} data - Données du formulaire
 * @returns {Promise<string>} HTML de prévisualisation
 */
export async function generatePreviewHTML(data) {
  // Essayer de charger le template preview.html
  const template = await loadPreviewTemplate();

  if (template) {
    // Utiliser le template preview.html avec la mise en page parfaite
    console.log("Template preview.html chargé, remplacement des variables...");
    const html = replaceTemplateVariables(template, data);
    console.log("Template HTML généré avec succès");
    return html;
  }

  console.warn("Template preview.html non disponible, utilisation du fallback");
  // Fallback vers l'ancienne méthode si le template n'est pas disponible
  const variablesConfig = getVariablesConfig();
  const templateConfig = variablesConfig?.templates[data.templateType];
  const typeDocumentLabel = templateConfig ? templateConfig.nom : "Document";

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR");

  // Fonction pour obtenir le label d'un champ
  const getFieldLabel = (key) => {
    // Chercher dans les variables communes
    if (variablesConfig?.variables_communes[key]) {
      return variablesConfig.variables_communes[key].label;
    }
    // Chercher dans les variables spécifiques du template
    if (templateConfig?.variables_specifiques[key]) {
      return templateConfig.variables_specifiques[key].label;
    }
    // Retourner la clé si pas de label trouvé
    return key;
  };

  // Clés à exclure de la section "Contenu de la demande"
  const excludedKeys = [
    "templateType",
    "emailDestinataire",
    "entreprise",
    "codeDocument",
    "civiliteDestinataire",
    "nomDestinataire",
    "statutDestinataire",
    "batiment",
    "adresse",
    "cpVille",
    "signatureExp",
  ];

  // Générer les lignes pour la section "Contenu de la demande"
  const contenuLines = Object.keys(data)
    .filter((key) => !excludedKeys.includes(key) && data[key])
    .map((key) => {
      const label = getFieldLabel(key);
      return `<div><span class="font-semibold text-green-900">${label}:</span> <strong class="text-green-700">${data[key]}</strong></div>`;
    })
    .join("");

  return `
    <div class="bg-white rounded-lg">
      <!-- En-tête du document -->
      <div class="text-center mb-6 pb-4 border-b-2 border-[#0072ff]">
        <div class="text-sm text-[#49454F] mb-2">Paris, le <strong class="text-[#0072ff]">${dateStr}</strong></div>
        <div class="text-xl font-bold text-[#0072ff]">${typeDocumentLabel}</div>
      </div>

      <!-- Grille 3 colonnes -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <!-- Colonne 1: Coordonnées (Bleu) -->
        <div class="md3-card elevation-1 p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
          <h3 class="text-base font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <span class="material-icons">location_on</span> Coordonnées
          </h3>
          <div class="space-y-2 text-sm">
            ${
              data.entreprise
                ? `<div><span class="font-semibold text-blue-900">${getFieldLabel(
                    "entreprise"
                  )}:</span> <strong class="text-blue-700">${
                    data.entreprise
                  }</strong></div>`
                : ""
            }
            ${
              data.codeDocument
                ? `<div><span class="font-semibold text-blue-900">${getFieldLabel(
                    "codeDocument"
                  )}:</span> <strong class="text-blue-700">${
                    data.codeDocument
                  }</strong></div>`
                : ""
            }
            ${
              data.civiliteDestinataire
                ? `<div><span class="font-semibold text-blue-900">${getFieldLabel(
                    "civiliteDestinataire"
                  )}:</span> <strong class="text-blue-700">${
                    data.civiliteDestinataire
                  }</strong></div>`
                : ""
            }
            ${
              data.nomDestinataire
                ? `<div><span class="font-semibold text-blue-900">${getFieldLabel(
                    "nomDestinataire"
                  )}:</span> <strong class="text-blue-700">${
                    data.nomDestinataire
                  }</strong></div>`
                : ""
            }
            ${
              data.statutDestinataire
                ? `<div><span class="font-semibold text-blue-900">${getFieldLabel(
                    "statutDestinataire"
                  )}:</span> ${data.statutDestinataire}</div>`
                : ""
            }
            ${
              data.batiment
                ? `<div><span class="font-semibold text-blue-900">${getFieldLabel(
                    "batiment"
                  )}:</span> ${data.batiment}</div>`
                : ""
            }
            ${
              data.adresse
                ? `<div><span class="font-semibold text-blue-900">${getFieldLabel(
                    "adresse"
                  )}:</span> ${data.adresse}</div>`
                : ""
            }
            ${
              data.cpVille
                ? `<div><span class="font-semibold text-blue-900">${getFieldLabel(
                    "cpVille"
                  )}:</span> ${data.cpVille}</div>`
                : ""
            }
          </div>
        </div>

        <!-- Colonne 2: Informations spécifiques (Vert) -->
        <div class="md3-card elevation-1 p-5 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
          <h3 class="text-base font-semibold text-green-900 mb-4 flex items-center gap-2">
            <span class="material-icons">edit_document</span> Contenu de la demande
          </h3>
          <div class="space-y-2 text-sm">
            ${
              contenuLines ||
              '<div class="text-gray-500 text-xs">Aucune donnée spécifique</div>'
            }
          </div>
        </div>

        <!-- Colonne 3: Signataire (Violet) -->
        <div class="md3-card elevation-1 p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
          <h3 class="text-base font-semibold text-purple-900 mb-4 flex items-center gap-2">
            <span class="material-icons">person</span> Signataire
          </h3>
          <div class="space-y-2 text-sm">
            ${
              data.signatureExp
                ? `<div><span class="font-semibold text-purple-900">${getFieldLabel(
                    "signatureExp"
                  )}:</span> <strong class="text-purple-700">${
                    data.signatureExp
                  }</strong></div>`
                : ""
            }
            <div class="mt-4">
              <span class="font-semibold text-purple-900">Destinataires email:</span>
              <div class="mt-2 space-y-1">
                ${
                  data.emailDestinataire
                    ? data.emailDestinataire
                        .split(",")
                        .map(
                          (email) =>
                            `<div class="flex items-center gap-2 text-purple-700"><span class="material-icons text-sm">email</span> ${email.trim()}</div>`
                        )
                        .join("")
                    : '<div class="text-gray-500 text-xs">Aucun destinataire</div>'
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Note informative -->
      <div class="mt-6 bg-[#E8DEF8] border-l-4 border-[#0072ff] p-4 rounded">
        <p class="text-sm text-[#21005D]">
          <span class="material-icons text-base align-middle mr-1">info</span>
          <strong>Les données en couleur seront insérées dans le template Word</strong>
        </p>
      </div>
    </div>
  `;
}

/**
 * Générer et afficher la prévisualisation
 */
export async function generateLocalPreview() {
  const templateSelect = getElement(CONFIG.SELECTORS.templateSelect);
  const msg = getElement(CONFIG.SELECTORS.message);
  const previewContent = getElement(CONFIG.SELECTORS.previewContent);
  const previewModal = getElement(CONFIG.SELECTORS.previewModal);

  if (!templateSelect?.value) {
    const { showWarningToast } = await import("./toast.js");
    showWarningToast(CONFIG.MESSAGES.ERROR_SELECT_TEMPLATE);
    return;
  }

  // Afficher le modal avec un loader
  if (previewContent) {
    previewContent.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12">
        <span class="material-icons text-6xl text-blue-500 animate-spin mb-4">sync</span>
        <p class="text-lg text-gray-600">Génération du document en cours...</p>
        <p class="text-sm text-gray-500 mt-2">Veuillez patienter</p>
      </div>
    `;
  }

  if (previewModal) {
    previewModal.classList.remove("hidden");
  }

  try {
    // Collecter les données et générer le document
    const data = collectFormData();
    console.log("Génération du document pour prévisualisation...");

    // Générer le Word d'abord
    const { generateWordDocument, convertWordToPdf, base64ToBlob } = await import("../core/api.js");
    const { setGeneratedWord } = await import("../core/state.js");
    
    const result = await generateWordDocument(data);
    const wordBase64 = result.data;
    
    // Stocker pour téléchargement ultérieur
    setGeneratedWord(wordBase64);
    
    // Convertir le Word en PDF
    const pdfResult = await convertWordToPdf(wordBase64, data.templateName || 'document');
    const pdfBase64 = pdfResult.data;
    
    if (previewContent) {
      // Afficher le PDF dans un iframe
      const viewportHeight = window.innerHeight;
      // Header modal ~80px, Footer modal ~80px, Marges ~40px = 200px
      const availableHeight = Math.max(400, viewportHeight - 250);
      
      const isMobile = window.innerWidth < 768;
      const iframeOverflow = isMobile ? 'overflow: scroll; -webkit-overflow-scrolling: touch;' : 'overflow-y: auto; overflow-x: hidden;';
      
      previewContent.innerHTML = `
        <div style="width: 100%; height: ${availableHeight}px; display: flex; flex-direction: column; background-color: #e5e7eb; border-radius: 0.75rem; padding: 1rem;">
          <iframe 
            id="previewIframe" 
            style="width: 100%; height: 100%; border: none; min-height: 0; ${iframeOverflow} ${isMobile ? 'zoom: 0.50;' : ''}"
          ></iframe>
        </div>
      `;

      // Charger le PDF dans l'iframe
      const iframe = document.getElementById("previewIframe");
      if (iframe) {
        const blob = base64ToBlob(pdfBase64, 'application/pdf');
        const url = URL.createObjectURL(blob);
        iframe.src = url;

        iframe.onload = () => {
          URL.revokeObjectURL(url);
          console.log(
            "✓ PDF chargé dans iframe pour prévisualisation"
          );
        };
        
        // Ajuster la hauteur de l'iframe lors du redimensionnement de la fenêtre
        const resizeIframe = () => {
          const viewportHeight = window.innerHeight;
          const availableHeight = Math.max(400, viewportHeight - 250);
          const container = iframe.parentElement;
          if (container) {
            container.style.height = `${availableHeight}px`;
          }
        };
        
        // Écouter le redimensionnement de la fenêtre
        window.addEventListener('resize', resizeIframe);
        
        // Nettoyer l'écouteur quand la modal se ferme
        const modal = document.getElementById('previewModal');
        if (modal) {
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.attributeName === 'class') {
                if (modal.classList.contains('hidden')) {
                  window.removeEventListener('resize', resizeIframe);
                  observer.disconnect();
                }
              }
            });
          });
          observer.observe(modal, { attributes: true });
        }
      }

      const { showSuccessToast } = await import("./toast.js");
      showSuccessToast("Prévisualisation PDF générée avec succès", {
        icon: "check_circle",
        duration: 3000,
      });
      
      console.log("Prévisualisation PDF affichée avec succès");
      return;
    }
  } catch (error) {
    console.error("Erreur lors de la génération de la prévisualisation:", error);
    
    if (previewContent) {
      previewContent.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12 text-red-600">
          <span class="material-icons text-6xl mb-4">error</span>
          <p class="text-lg font-semibold">Erreur de génération</p>
          <p class="text-sm mt-2">${error.message}</p>
          <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Réessayer
          </button>
        </div>
      `;
    }
    
    const { showErrorToast } = await import("./toast.js");
    showErrorToast(`Erreur: ${error.message}`);
  }
}
