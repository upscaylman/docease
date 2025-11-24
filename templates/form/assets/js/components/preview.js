/**
 * Gestion de la prévisualisation et génération de documents
 */

import { CONFIG, getElement } from '../core/config.js';
import { setGeneratedWord, getGeneratedWord, setFormData } from '../core/state.js';
import { generateWordDocument, sendEmailWithWord, sendEmailWithPdf, base64ToBlob, downloadBlob, convertWordToPdf } from '../core/api.js';
import { collectFormData } from '../utils/validation.js';
import { generateFilename } from '../utils/helpers.js';
import { showSuccessToast, showErrorToast } from '../utils/toast.js';

/**
 * Ouvrir le modal de prévisualisation
 */
export function openPreviewModal() {
  const previewBtn = getElement(CONFIG.SELECTORS.previewBtn);
  if (previewBtn) {
    previewBtn.click();
  }
}

/**
 * Télécharger le document Word
 */
export async function downloadWord() {
  const btn = getElement(CONFIG.SELECTORS.downloadWordBtn);
  const msg = getElement(CONFIG.SELECTORS.message);
  
  if (!btn) return;
  
  const originalHTML = btn.innerHTML;
  
  try {
    btn.disabled = true;
    btn.innerHTML = '<span class="material-icons animate-spin">sync</span> Génération...';
    
    // Collecter les données du formulaire
    const data = collectFormData();
    setFormData(data);
    
    console.log('Génération du Word via formulaire-doc:', data);
    
    // Appeler le webhook pour générer le Word
    const result = await generateWordDocument(data);
    
    // Stocker le base64 pour l'envoi ultérieur
    setGeneratedWord(result.data);
    
    // Convertir base64 en blob pour le téléchargement
    const blob = base64ToBlob(result.data);
    console.log('Word converti en blob:', blob.size, 'octets');
    
    // Télécharger le Word avec le nom du template
    const templateName = data.templateName || data.templateType || 'Document';
    const cleanName = templateName.replace(/\s+/g, '_'); // Remplacer espaces par underscores
    const filename = generateFilename(cleanName, 'docx');
    downloadBlob(blob, filename);
    
    showSuccessToast(CONFIG.MESSAGES.SUCCESS_DOWNLOAD);
    
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  } catch (error) {
    console.error('Erreur:', error);
    
    showErrorToast(`${CONFIG.MESSAGES.ERROR_GENERATION} : ${error.message}`);
    
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
}

/**
 * Télécharger le document en PDF
 */
export async function downloadPdf() {
  const btn = document.getElementById('downloadPdfBtn');
  if (!btn) return;
  
  const originalHTML = btn.innerHTML;
  
  try {
    btn.disabled = true;
    btn.innerHTML = '<span class="material-icons animate-spin">sync</span> Conversion PDF...';
    
    // Vérifier si le Word a été généré
    let wordBase64 = getGeneratedWord();

    // Si pas de Word généré, le générer d'abord
    if (!wordBase64) {
      console.log('Génération du Word avant conversion PDF...');
      const data = collectFormData();
      setFormData(data);
      
      const result = await generateWordDocument(data);
      wordBase64 = result.data;
      setGeneratedWord(wordBase64);
    }
    
    // Collecter les données pour le nom du fichier
    const data = collectFormData();
    const templateName = data.templateName || data.templateType || 'Document';
    const cleanName = templateName.replace(/\s+/g, '_');
    
    // Convertir le Word en PDF
    console.log('Conversion du Word en PDF...');
    const pdfResult = await convertWordToPdf(wordBase64, cleanName);
    
    // Télécharger le PDF
    const filename = generateFilename(cleanName, 'pdf');
    downloadBlob(pdfResult.blob, filename);
    
    showSuccessToast('Document PDF téléchargé avec succès !');
    
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  } catch (error) {
    console.error('Erreur conversion PDF:', error);
    
    showErrorToast(`Erreur lors de la conversion PDF : ${error.message}`);
    
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
}

/**
 * Envoyer l'email avec le document Word
 */
export async function sendEmail() {
  const btn = getElement(CONFIG.SELECTORS.sendEmailBtn);
  const msg = getElement(CONFIG.SELECTORS.message);

  if (!btn) return;

  const originalHTML = btn.innerHTML;

  try {
    btn.disabled = true;
    btn.innerHTML = '<span class="material-icons animate-spin">sync</span> Envoi...';

    // Vérifier si le Word a été généré
    let wordBase64 = getGeneratedWord();

    // Si pas de Word généré, le générer d'abord
    if (!wordBase64) {
      console.log('Génération du Word avant envoi...');
      const data = collectFormData();
      setFormData(data);

      const result = await generateWordDocument(data);
      wordBase64 = result.data;
      setGeneratedWord(wordBase64);
    }

    // Récupérer les données du formulaire
    const data = collectFormData();

    // Récupérer le message personnalisé s'il existe
    const customMessage = document.body.getAttribute('data-custom-email-message');
    
    // Récupérer emailEnvoi depuis l'attribut data et FORCER l'écrasement
    const emailEnvoi = document.body.getAttribute('data-email-envoi');
    if (emailEnvoi) {
      data.emailEnvoi = emailEnvoi; // Écraser avec la bonne valeur
      console.log('✅ emailEnvoi forcé à:', emailEnvoi);
    } else {
      console.warn('⚠️ data-email-envoi non trouvé, utilisation de destinataires');
      // Fallback sur destinataires si emailEnvoi n'est pas défini
      if (data.destinataires) {
        data.emailEnvoi = data.destinataires;
      }
    }

    // Convertir le Word en PDF avant d'envoyer
    console.log('Conversion du Word en PDF...');
    btn.innerHTML = '<span class="material-icons animate-spin">sync</span> Conversion PDF...';
    
    const { convertWordToPdf } = await import('../core/api.js');
    const pdfResult = await convertWordToPdf(wordBase64, data.templateName || 'document');
    const pdfBase64 = pdfResult.data; // Récupérer la string base64 du PDF
    
    console.log('✅ PDF généré avec succès, taille:', pdfBase64.length, 'caractères');

    // Envoyer l'email avec le PDF
    btn.innerHTML = '<span class="material-icons animate-spin">sync</span> Envoi...';
    console.log('Envoi de l\'email avec le PDF en pièce jointe');
    await sendEmailWithPdf(data, pdfBase64, customMessage);

    // Nettoyer le message personnalisé et emailEnvoi après envoi
    if (customMessage) {
      document.body.removeAttribute('data-custom-email-message');
    }
    if (emailEnvoi) {
      document.body.removeAttribute('data-email-envoi');
    }

    showSuccessToast(CONFIG.MESSAGES.SUCCESS_EMAIL_SENT);

    btn.disabled = false;
    btn.innerHTML = originalHTML;

    // Fermer le modal après un court délai
    setTimeout(() => {
      const previewModal = getElement(CONFIG.SELECTORS.previewModal);
      if (previewModal) {
        previewModal.classList.add('hidden');
      }
    }, 1500);
  } catch (error) {
    console.error('Erreur:', error);

    showErrorToast(`${CONFIG.MESSAGES.ERROR_SEND_EMAIL} : ${error.message}`);

    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
}

/**
 * Initialiser les boutons de prévisualisation et génération
 */
export function initPreviewButtons() {
  const downloadWordBtn = getElement(CONFIG.SELECTORS.downloadWordBtn);
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const sendEmailBtn = getElement(CONFIG.SELECTORS.sendEmailBtn);

  if (downloadWordBtn) {
    downloadWordBtn.addEventListener('click', downloadWord);
  }

  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', downloadPdf);
  }

  if (sendEmailBtn) {
    // Le bouton "Partager" ouvre maintenant le modal de partage
    sendEmailBtn.addEventListener('click', async () => {
      // Fermer le modal de prévisualisation
      const previewModal = getElement(CONFIG.SELECTORS.previewModal);
      if (previewModal) {
        previewModal.classList.add('hidden');
      }

      // S'assurer que le champ destinataires est rempli avec l'email du champ "Email Destinataire"
      const emailDestinataireField = document.getElementById('emailDestinataire');
      const destinatairesInput = document.getElementById('destinataires');
      
      if (emailDestinataireField && emailDestinataireField.value && destinatairesInput) {
        // Utiliser l'email du champ "Email Destinataire" pour remplir le champ caché
        destinatairesInput.value = emailDestinataireField.value.trim();
      }

      // Ouvrir le modal de partage avec le message par défaut et l'email pré-rempli
      // La fonction openShareModal est maintenant exportée depuis app.js
      const { openShareModal } = await import('../app.js');
      if (openShareModal) {
        openShareModal();
      } else {
        // Fallback si la fonction n'est pas disponible
        const shareModal = document.getElementById('shareModal');
        if (shareModal) {
          shareModal.classList.remove('hidden');
        }
      }
    });
  }
}

