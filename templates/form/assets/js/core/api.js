/**
 * Gestion des appels API
 * Centralise toutes les requêtes vers les webhooks
 */

import { CONFIG } from './config.js';

/**
 * Créer les headers avec le bypass ngrok si nécessaire
 * @param {string} url - URL de la requête
 * @param {Object} additionalHeaders - Headers supplémentaires
 * @returns {Object} Headers complets
 */
function createHeaders(url, additionalHeaders = {}) {
  const headers = { ...additionalHeaders };
  
  // Ajouter le header pour bypasser l'avertissement ngrok
  if (url && url.includes('ngrok')) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }
  
  return headers;
}

/**
 * Charger la configuration des variables depuis le serveur
 * @returns {Promise<Object>} Configuration chargée
 * @throws {Error} Si le chargement échoue
 */
export async function loadVariablesConfig() {
  try {
    const response = await fetch(CONFIG.VARIABLES_CONFIG_PATH, {
      headers: createHeaders(CONFIG.VARIABLES_CONFIG_PATH)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    if (!text || text.trim() === '') {
      throw new Error(CONFIG.MESSAGES.ERROR_EMPTY_RESPONSE);
    }
    
    const config = JSON.parse(text);
    console.log('Variables config loaded:', config);
    
    return config;
  } catch (error) {
    console.error('Erreur chargement variables.json:', error);
    throw error;
  }
}

/**
 * Générer un document Word via le webhook
 * @param {Object} data - Données du formulaire
 * @returns {Promise<Object>} Résultat avec le document en base64
 * @throws {Error} Si la génération échoue
 */
export async function generateWordDocument(data) {
  try {
    console.log('Génération du Word via formulaire-doc:', data);

    const response = await fetch(CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: createHeaders(CONFIG.WEBHOOK_URL, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}`);
    }

    // Vérifier le type de contenu
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      // Réponse JSON avec base64
      const result = await response.json();
      console.log('Réponse JSON reçue:', result);

      if (!result.success || !result.data) {
        throw new Error('Fichier Word non trouvé dans la réponse');
      }

      return result;
    } else {
      // Réponse binaire directe - convertir en base64
      const blob = await response.blob();
      console.log('Réponse binaire reçue');

      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      return { success: true, data: base64 };
    }
  } catch (error) {
    console.error('Erreur génération Word:', error);
    throw error;
  }
}

/**
 * Envoyer un email avec le document PDF
 * @param {Object} data - Données du formulaire
 * @param {string} pdfBase64 - Document PDF en base64
 * @param {string} customMessage - Message personnalisé pour l'email (optionnel)
 * @returns {Promise<Object>} Résultat de l'envoi
 * @throws {Error} Si l'envoi échoue
 */
export async function sendEmailWithPdf(data, pdfBase64, customMessage = null) {
  try {
    console.log('=== ENVOI EMAIL AVEC PDF ===' );
    console.log('Destinataires:', data.emailEnvoi || data.destinataires || data.emailDestinataire);
    console.log('Message personnalisé:', customMessage);

    const payload = {
      ...data,
      pdfFile: pdfBase64  // Utiliser 'pdfFile' pour n8n (avec majuscule)
    };

    // Ajouter le message personnalisé s'il existe
    if (customMessage) {
      payload.customEmailMessage = customMessage;
    }

    console.log('URL Webhook:', CONFIG.WEBHOOK_EMAIL_URL);
    console.log('Payload avec pdfFile:', {
      ...payload,
      pdfFile: pdfBase64 ? `[PDF PRÉSENT: ${pdfBase64.length} chars]` : '❌ ABSENT !'
    });
    console.log('Type de pdfFile:', typeof payload.pdfFile);
    console.log('pdfFile existe ?', !!payload.pdfFile);

    const response = await fetch(CONFIG.WEBHOOK_EMAIL_URL, {
      method: 'POST',
      headers: createHeaders(CONFIG.WEBHOOK_EMAIL_URL, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });

    console.log('Réponse HTTP:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur réponse:', errorText);
      throw new Error(`Erreur ${response.status}: ${errorText}`);
    }

    let result;
    try {
      result = await response.json();
    } catch (e) {
      result = { success: true, message: 'Email envoyé avec succès' };
    }

    console.log('✅ Email avec PDF envoyé avec succès:', result);

    return result;
  } catch (error) {
    console.error('❌ Erreur envoi email avec PDF:', error);
    throw error;
  }
}

/**
 * Envoyer un email avec le document Word en pièce jointe
 * @param {Object} data - Données du formulaire
 * @param {string} wordBase64 - Document Word en base64
 * @param {string} customMessage - Message personnalisé pour l'email (optionnel)
 * @returns {Promise<Object>} Résultat de l'envoi
 * @throws {Error} Si l'envoi échoue
 */
export async function sendEmailWithWord(data, wordBase64, customMessage = null) {
  try {
    console.log('=== ENVOI EMAIL ===' );
    console.log('Destinataires:', data.destinataires || data.emailDestinataire);
    console.log('Message personnalisé:', customMessage);
    console.log('Envoi de l\'email avec le Word en pièce jointe');

    const payload = {
      ...data,
      wordfile: wordBase64
    };

    // Ajouter le message personnalisé s'il existe
    // S'assurer que les sauts de ligne sont correctement formatés
    if (customMessage) {
      // Le message contient déjà de vrais sauts de ligne depuis le textarea
      // On les garde tels quels, n8n devrait les traiter correctement
      payload.customEmailMessage = customMessage;
    }

    console.log('URL Webhook:', CONFIG.WEBHOOK_EMAIL_URL);
    console.log('Payload (sans wordfile):', { ...payload, wordfile: '[WORD_DATA]' });

    const response = await fetch(CONFIG.WEBHOOK_EMAIL_URL, {
      method: 'POST',
      headers: createHeaders(CONFIG.WEBHOOK_EMAIL_URL, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });

    console.log('Réponse HTTP:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur réponse:', errorText);
      throw new Error(`Erreur ${response.status}: ${errorText}`);
    }

    // Essayer de parser en JSON, sinon retourner un objet simple
    let result;
    try {
      result = await response.json();
    } catch (e) {
      // Si ce n'est pas du JSON, c'est probablement un succès
      result = { success: true, message: 'Email envoyé avec succès' };
    }

    console.log('✅ Email envoyé avec succès:', result);

    return result;
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    throw error;
  }
}

/**
 * Convertir un base64 en Blob
 * @param {string} base64 - Chaîne base64
 * @param {string} mimeType - Type MIME du fichier
 * @returns {Blob}
 */
export function base64ToBlob(base64, mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Télécharger un fichier depuis un Blob
 * @param {Blob} blob - Blob à télécharger
 * @param {string} filename - Nom du fichier
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Convertir un document Word en PDF
 * @param {string} wordBase64 - Document Word en base64
 * @param {string} filename - Nom du fichier (sans extension)
 * @returns {Promise<Object>} Résultat avec le PDF en base64
 * @throws {Error} Si la conversion échoue
 */
export async function convertWordToPdf(wordBase64, filename = 'document') {
  try {
    console.log('🔄 Envoi requête conversion PDF...');
    console.log('URL de conversion:', CONFIG.WEBHOOK_PDF_CONVERT_URL);
    console.log('Taille wordBase64:', wordBase64.length, 'caractères');

    const response = await fetch(CONFIG.WEBHOOK_PDF_CONVERT_URL, {
      method: 'POST',
      headers: createHeaders(CONFIG.WEBHOOK_PDF_CONVERT_URL, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        wordBase64: wordBase64,
        filename: filename
      })
    });

    console.log('📥 Réponse reçue, status:', response.status);
    console.log('📥 Headers:', [...response.headers.entries()]);

    // Lire la réponse en texte brut
    const responseText = await response.text();
    console.log('📥 Réponse brute (500 premiers car):', responseText.substring(0, 500));
    console.log('📥 Longueur totale réponse:', responseText.length);

    if (!response.ok) {
      console.error('❌ Erreur HTTP:', response.status);
      throw new Error(`Erreur serveur ${response.status}: ${responseText}`);
    }

    // Parser le JSON
    let result;
    try {
      result = JSON.parse(responseText);
      console.log('✅ JSON parsé avec succès');
      console.log('Clés présentes:', Object.keys(result));
      if (result.pdfBase64) {
        console.log('✅ pdfBase64 présent, taille:', result.pdfBase64.length, 'caractères');
      }
    } catch (parseError) {
      console.error('❌ Erreur parse JSON:', parseError);
      console.log('Réponse complète:', responseText);
      throw new Error('Réponse invalide du serveur (JSON mal formé)');
    }

    if (result.error) {
      console.error('❌ Erreur retournée par le serveur:', result.error);
      throw new Error(result.error);
    }

    if (!result.pdfBase64) {
      console.error('❌ pdfBase64 manquant dans la réponse');
      throw new Error('Erreur lors de la conversion PDF: pdfBase64 manquant');
    }

    // Convertir le PDF base64 en blob
    const pdfBlob = base64ToBlob(result.pdfBase64, 'application/pdf');
    console.log('✅ PDF généré avec succès, taille blob:', pdfBlob.size, 'bytes');

    return { success: true, data: result.pdfBase64, blob: pdfBlob };
  } catch (error) {
    console.error('❌ Erreur conversion PDF:', error);
    throw error;
  }
}

