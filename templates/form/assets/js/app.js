/**
 * Point d'entrée principal de l'application
 * Initialise tous les modules et gère les événements globaux
 */

import { CONFIG, getElement } from './core/config.js';
import { setVariablesConfig } from './core/state.js';
import { loadVariablesConfig } from './core/api.js';
import { generateFields } from './components/fields.js';
import { initEmailChips } from './components/emailChips.js';
import { initModals } from './components/modal.js';
import { initTabs } from './components/tabs.js';
import { initPreviewButtons } from './components/preview.js';
import { checkRequiredFields, generateLocalPreview } from './utils/validation.js';
import { initTestDataButton } from './utils/testData.js';
import { showMessage } from './utils/helpers.js';

/**
 * Initialiser l'application
 */
async function initApp() {
  console.log('🚀 Initialisation de l\'application...');
  
  try {
    // Charger la configuration des variables
    const config = await loadVariablesConfig();
    setVariablesConfig(config);
    
    // Remplir le sélecteur de templates
    populateTemplateSelector(config);
    
    // Initialiser les composants
    initEmailChips();
    initModals();
    initTabs();
    initPreviewButtons();
    initTestDataButton();
    
    // Initialiser les événements
    initTemplateSelector();
    initPreviewButton();
    initHeaderPreviewButton();
    initTemplatesGallery(config);
    initFloatingActionBar();
    initShareModal();

    console.log('✅ Application initialisée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    const msg = getElement(CONFIG.SELECTORS.message);
    if (msg) {
      showMessage(msg, `${CONFIG.MESSAGES.ERROR_LOAD_CONFIG}: ${error.message}`, 'error');
    }
  }
}

/**
 * Remplir le sélecteur de templates
 * @param {Object} config - Configuration chargée
 */
function populateTemplateSelector(config) {
  const templateSelect = getElement(CONFIG.SELECTORS.templateSelect);
  if (!templateSelect) return;
  
  templateSelect.innerHTML = '<option value="">📄 Choisir un type de document...</option>';
  
  Object.keys(config.templates).forEach(key => {
    const template = config.templates[key];
    const option = document.createElement('option');
    option.value = key;
    option.textContent = template.nom;
    templateSelect.appendChild(option);
  });
}

/**
 * Initialiser le sélecteur de template
 */
function initTemplateSelector() {
  const templateSelect = getElement(CONFIG.SELECTORS.templateSelect);
  if (!templateSelect) return;
  
  templateSelect.addEventListener('change', (e) => {
    const templateKey = e.target.value;

    if (templateKey) {
      // Afficher les sections
      const tabsContainer = document.getElementById('tabsContainer');
      const destinatairesSection = document.getElementById('destinatairesSection');
      const previewBtnContainer = document.getElementById('previewBtnContainer');

      if (tabsContainer) tabsContainer.style.display = 'flex';
      if (destinatairesSection) destinatairesSection.style.display = 'block';
      if (previewBtnContainer) previewBtnContainer.style.display = 'flex';

      // Générer les champs dynamiques
      generateFields(templateKey);

      // Ajouter des listeners sur tous les champs pour vérifier la validation
      setTimeout(() => {
        addFieldListeners();
        checkRequiredFields();
      }, 100);
    } else {
      // Masquer les sections
      const tabsContainer = document.getElementById('tabsContainer');
      const destinatairesSection = document.getElementById('destinatairesSection');
      const previewBtnContainer = document.getElementById('previewBtnContainer');

      if (tabsContainer) tabsContainer.style.display = 'none';
      if (destinatairesSection) destinatairesSection.style.display = 'none';
      if (previewBtnContainer) previewBtnContainer.style.display = 'none';

      // Vider les conteneurs de champs
      const coordonneesFields = getElement(CONFIG.SELECTORS.coordonneesFields);
      const contenuFields = getElement(CONFIG.SELECTORS.contenuFields);
      const expediteurFields = getElement(CONFIG.SELECTORS.expediteurFields);

      if (coordonneesFields) coordonneesFields.innerHTML = '';
      if (contenuFields) contenuFields.innerHTML = '';
      if (expediteurFields) expediteurFields.innerHTML = '';

      const previewBtn = getElement(CONFIG.SELECTORS.previewBtn);
      if (previewBtn) previewBtn.disabled = true;
    }
  });
}

/**
 * Ajouter des listeners sur tous les champs pour la validation
 */
function addFieldListeners() {
  const dynamicFields = getElement(CONFIG.SELECTORS.dynamicFields);
  if (!dynamicFields) return;
  
  const allInputs = dynamicFields.querySelectorAll('input, select, textarea');
  allInputs.forEach(input => {
    input.addEventListener('input', checkRequiredFields);
    input.addEventListener('change', checkRequiredFields);
  });
  
  // Ajouter listener sur le champ destinataires aussi
  const destinataires = getElement(CONFIG.SELECTORS.destinatairesHidden);
  if (destinataires) {
    destinataires.addEventListener('input', checkRequiredFields);
    destinataires.addEventListener('change', checkRequiredFields);
  }
}

/**
 * Initialiser le bouton de prévisualisation
 */
function initPreviewButton() {
  const previewBtn = getElement(CONFIG.SELECTORS.previewBtn);
  if (!previewBtn) return;

  previewBtn.addEventListener('click', generateLocalPreview);
}

/**
 * Initialiser le bouton de prévisualisation dans le header
 */
function initHeaderPreviewButton() {
  const headerPreviewBtn = document.getElementById('headerPreviewBtn');
  const headerDownloadBtn = document.getElementById('headerDownloadBtn');
  const headerSendBtn = document.getElementById('headerSendBtn');

  if (!headerPreviewBtn) return;

  // Bouton prévisualiser
  headerPreviewBtn.addEventListener('click', generateLocalPreview);

  // Bouton télécharger - appelle directement la fonction downloadWord
  if (headerDownloadBtn) {
    headerDownloadBtn.addEventListener('click', async () => {
      // Importer dynamiquement la fonction downloadWord
      const { downloadWord } = await import('./components/preview.js');
      downloadWord();
    });
  }

  // Bouton partager (ouvre le modal de partage)
  if (headerSendBtn) {
    headerSendBtn.addEventListener('click', () => {
      openShareModal();
    });
  }

  // Synchroniser l'état disabled avec le bouton principal
  const observer = new MutationObserver(() => {
    const previewBtn = getElement(CONFIG.SELECTORS.previewBtn);
    if (previewBtn) {
      const isDisabled = previewBtn.disabled;
      headerPreviewBtn.disabled = isDisabled;
      if (headerDownloadBtn) headerDownloadBtn.disabled = isDisabled;
      if (headerSendBtn) headerSendBtn.disabled = isDisabled;
    }
  });

  const previewBtn = getElement(CONFIG.SELECTORS.previewBtn);
  if (previewBtn) {
    observer.observe(previewBtn, { attributes: true, attributeFilter: ['disabled'] });
  }
}

/**
 * Initialiser la galerie de templates dans le panneau latéral
 */
function initTemplatesGallery(config) {
  const gallery = document.getElementById('templatesGallery');
  if (!gallery || !config?.templates) return;

  gallery.innerHTML = '';

  let firstCard = null;

  Object.entries(config.templates).forEach(([key, template], index) => {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.dataset.templateKey = key;

    // Sélectionner "designation" par défaut
    if (key === 'designation') {
      card.classList.add('selected');
    }

    // Icône selon le type de document
    const icon = getTemplateIcon(template.nom);

    card.innerHTML = `
      <div class="template-thumbnail">
        <span class="material-icons">${icon}</span>
      </div>
      <h3 class="font-bold text-gray-800 mb-1">${template.nom}</h3>
      <p class="text-xs text-gray-600">${template.description || 'Document professionnel'}</p>
    `;

    card.addEventListener('click', () => {
      // Mettre à jour le select principal
      const templateSelect = getElement(CONFIG.SELECTORS.templateSelect);
      if (templateSelect) {
        templateSelect.value = key;
        templateSelect.dispatchEvent(new Event('change'));
      }

      // Mettre à jour la sélection visuelle
      document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });

    gallery.appendChild(card);

    // Garder référence à la carte "designation"
    if (key === 'designation') {
      firstCard = card;
    }
  });

  // Déclencher la sélection par défaut de "designation"
  if (firstCard) {
    setTimeout(() => {
      firstCard.click();
    }, 100);
  }
}

/**
 * Obtenir l'icône appropriée selon le type de template
 */
function getTemplateIcon(nom) {
  const nomLower = nom.toLowerCase();
  if (nomLower.includes('mandat')) return 'gavel';
  if (nomLower.includes('offre') || nomLower.includes('proposition')) return 'description';
  if (nomLower.includes('contrat')) return 'assignment';
  if (nomLower.includes('facture')) return 'receipt';
  if (nomLower.includes('devis')) return 'request_quote';
  if (nomLower.includes('lettre')) return 'mail';
  return 'description';
}

/**
 * Initialiser la barre d'action flottante
 */
function initFloatingActionBar() {
  // Synchroniser les boutons de navigation flottants avec les onglets existants
  const floatingButtons = document.querySelectorAll('.tab-button-floating');
  const originalButtons = document.querySelectorAll('.tab-button');

  floatingButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;

      // Activer l'onglet correspondant
      const targetButton = document.querySelector(`.tab-button[data-tab="${tab}"]`);
      if (targetButton) {
        targetButton.click();
      }

      // Mettre à jour l'état visuel des boutons flottants
      floatingButtons.forEach(b => {
        b.classList.remove('active');
        b.querySelector('.step-indicator-floating').classList.remove('active');
      });
      btn.classList.add('active');
      btn.querySelector('.step-indicator-floating').classList.add('active');
    });
  });

  // Observer les changements sur les onglets originaux pour synchroniser
  const observer = new MutationObserver(() => {
    originalButtons.forEach((btn, index) => {
      if (btn.classList.contains('active')) {
        floatingButtons[index]?.classList.add('active');
        floatingButtons[index]?.querySelector('.step-indicator-floating')?.classList.add('active');
      } else {
        floatingButtons[index]?.classList.remove('active');
        floatingButtons[index]?.querySelector('.step-indicator-floating')?.classList.remove('active');
      }
    });
  });

  originalButtons.forEach(btn => {
    observer.observe(btn, { attributes: true, attributeFilter: ['class'] });
  });

  // Bouton données de test flottant
  const fillTestDataFloating = document.getElementById('fillTestDataFloating');
  const fillTestData = document.getElementById('fillTestData');

  if (fillTestDataFloating && fillTestData) {
    fillTestDataFloating.addEventListener('click', () => {
      fillTestData.click();
    });
  }

  // Bouton effacer tout
  const clearAllDataBtn = document.getElementById('clearAllDataBtn');
  if (clearAllDataBtn) {
    clearAllDataBtn.addEventListener('click', () => {
      if (confirm('⚠️ Êtes-vous sûr de vouloir effacer toutes les données du formulaire ?')) {
        clearAllFormData();
      }
    });
  }
}

/**
 * Effacer toutes les données du formulaire
 */
function clearAllFormData() {
  // Effacer tous les inputs
  const allInputs = document.querySelectorAll('#coordonneesFields input, #contenuFields input, #expediteurFields input');
  allInputs.forEach(input => {
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Effacer tous les textareas
  const allTextareas = document.querySelectorAll('#coordonneesFields textarea, #contenuFields textarea, #expediteurFields textarea');
  allTextareas.forEach(textarea => {
    textarea.value = '';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Effacer tous les selects
  const allSelects = document.querySelectorAll('#coordonneesFields select, #contenuFields select, #expediteurFields select');
  allSelects.forEach(select => {
    select.selectedIndex = 0;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Effacer le champ destinataires caché
  const destinataires = document.getElementById('destinataires');
  if (destinataires) {
    destinataires.value = '';
  }

  console.log('✅ Toutes les données du formulaire ont été effacées');
}

/**
 * Ouvrir le modal de partage
 */
function openShareModal() {
  const modal = document.getElementById('shareModal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

/**
 * Initialiser le modal de partage
 */
function initShareModal() {
  const modal = document.getElementById('shareModal');
  const closeBtn = document.getElementById('closeShareModal');
  const closeBtnFooter = document.getElementById('closeShareModalBtn');
  const confirmBtn = document.getElementById('confirmShareBtn');
  const emailInput = document.getElementById('shareEmailInput');

  if (!modal) return;

  // Fermer le modal
  const closeModal = () => {
    modal.classList.add('hidden');
    emailInput.value = '';
  };

  closeBtn?.addEventListener('click', closeModal);
  closeBtnFooter?.addEventListener('click', closeModal);

  // Fermer en cliquant sur le fond
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Confirmer et envoyer
  confirmBtn?.addEventListener('click', async () => {
    const emails = emailInput.value.trim();

    if (!emails) {
      alert('⚠️ Veuillez entrer au moins une adresse email pour partager le document');
      return;
    }

    // Valider le format des emails
    const emailList = emails.split(',').map(e => e.trim()).filter(e => e);
    const invalidEmails = emailList.filter(email => !email.includes('@'));

    if (invalidEmails.length > 0) {
      alert('⚠️ Certaines adresses email sont invalides : ' + invalidEmails.join(', '));
      return;
    }

    // Mettre à jour le champ destinataires caché
    const destinatairesInput = document.getElementById('destinataires');
    if (destinatairesInput) {
      destinatairesInput.value = emails;
    }

    // Fermer le modal
    closeModal();

    // Déclencher l'envoi via le bouton existant
    const sendBtn = document.getElementById('sendEmailBtn');
    if (sendBtn) {
      sendBtn.click();
    }
  });
}

/**
 * Démarrer l'application quand le DOM est prêt
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

