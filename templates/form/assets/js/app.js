/**
 * Point d'entrée principal de l'application
 * Initialise tous les modules et gère les événements globaux
 */

import { CONFIG, getElement } from './core/config.js';
import { setVariablesConfig, getVariablesConfig } from './core/state.js';
import { loadVariablesConfig } from './core/api.js';
import { generateFields } from './components/fields.js';
import { initEmailChips } from './components/emailChips.js';
import { initModals } from './components/modal.js';
import { initTabs, switchTab } from './components/tabs.js';
import { initPreviewButtons } from './components/preview.js';
import { checkRequiredFields, generateLocalPreview } from './utils/validation.js';
import { initTestDataButton } from './utils/testData.js';
import { showErrorToast } from './utils/toast.js';
import { initFormBuilder, getSelectedFields, hasCustomConfig, hideCustomizeButton } from './components/formBuilder.js';

/**
 * Initialiser l'application
 */
async function initApp() {
  console.log('Initialisation de l\'application...');

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
    await initStepper();
      
    // Écouter les changements d'onglet pour mettre à jour le stepper
    document.addEventListener('tabChanged', updateStepperButtons);

    // Restaurer le template sélectionné si on revient du builder
    restoreLastTemplate();

    console.log('Application initialisée avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    showErrorToast(`${CONFIG.MESSAGES.ERROR_LOAD_CONFIG}: ${error.message}`);
  }
}

/**
 * Remplir le sélecteur de templates
 * @param {Object} config - Configuration chargée
 */
function populateTemplateSelector(config) {
  const templateSelect = getElement(CONFIG.SELECTORS.templateSelect);
  if (!templateSelect) return;
  
  templateSelect.innerHTML = '<option value="">Choisir un type de document...</option>';
  
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
  
  templateSelect.addEventListener('change', async (e) => {
    const templateKey = e.target.value;

    // Sauvegarder les valeurs du template actuel avant de changer
    const currentTemplate = templateSelect.dataset.currentTemplate;
    if (currentTemplate) {
      saveFormValues(currentTemplate);
    }

    // Cacher le bouton personnaliser par défaut
    hideCustomizeButton();

    if (templateKey) {
      // Marquer le nouveau template comme actuel
      templateSelect.dataset.currentTemplate = templateKey;
      // Afficher les sections
      const tabsContainer = document.getElementById('tabsContainer');
      const destinatairesSection = document.getElementById('destinatairesSection');
      const previewBtnContainer = document.getElementById('previewBtnContainer');

      if (tabsContainer) tabsContainer.style.display = 'flex';
      if (destinatairesSection) destinatairesSection.style.display = 'block';
      if (previewBtnContainer) previewBtnContainer.style.display = 'flex';

      // Mettre à jour le nom du template sélectionné
      updateSelectedTemplateName(templateKey);

      // S'assurer que la première section est active
      switchTab('coordonnees');

      // Générer les champs dynamiques
      generateFields(templateKey);

      // Ajouter des listeners sur tous les champs pour vérifier la validation
      setTimeout(async () => {
        addFieldListeners();
        checkRequiredFields();

        // Restaurer les valeurs sauvegardées pour ce template
        restoreFormValues(templateKey);

        // Initialiser le form builder pour le template "custom"
        if (templateKey === 'custom') {
          const config = await loadVariablesConfig();
          console.log('Config chargée:', config);
          const templateConfig = config.templates ? config.templates[templateKey] : null;
          console.log('Template config:', templateConfig);
          if (templateConfig && templateConfig.variables_specifiques) {
            console.log('Appel initFormBuilder');
            initFormBuilder(templateKey, templateConfig.variables_specifiques, config.variables_communes || {});
          } else {
            console.error('Pas de variables_specifiques trouvées');
          }
        }

        // Ajouter auto-save sur tous les champs
        initAutoSave(templateKey);
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
 * Mettre à jour le nom du template sélectionné dans les sections du formulaire
 * @param {string} templateKey - Clé du template sélectionné
 */
function updateSelectedTemplateName(templateKey) {
  // Mettre à jour les titres dans les sections du formulaire
  updateTemplateNameInSections(templateKey);
}

/**
 * Mettre à jour le nom du template dans les sections du formulaire
 * @param {string} templateKey - Clé du template sélectionné
 */
function updateTemplateNameInSections(templateKey) {
  const variablesConfig = getVariablesConfig();
  let templateName = '-';
  
  if (variablesConfig && variablesConfig.templates && variablesConfig.templates[templateKey]) {
    templateName = variablesConfig.templates[templateKey].nom || templateKey;
  }
  
  // Mettre à jour dans chaque section
  const sections = [
    { containerId: 'templateNameTitleCoordonnees', textId: 'templateNameTextCoordonnees' },
    { containerId: 'templateNameTitleContenu', textId: 'templateNameTextContenu' },
    { containerId: 'templateNameTitleExpediteur', textId: 'templateNameTextExpediteur' }
  ];
  
  sections.forEach(section => {
    const container = document.getElementById(section.containerId);
    const textElement = document.getElementById(section.textId);
    
    if (container && textElement) {
      if (templateKey && templateName !== '-') {
        textElement.textContent = templateName;
        container.style.display = 'block';
      } else {
        textElement.textContent = '-';
        container.style.display = 'none';
      }
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

    // Image selon le type de template
    const imagePath = getTemplateImage(key);

    card.innerHTML = `
      <img src="${imagePath}" alt="${template.nom}" class="template-thumbnail">
      <h3 class="font-bold text-gray-800 mb-1">${template.nom}</h3>
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
      
      // Mettre à jour le nom du template dans la barre d'action
      updateSelectedTemplateName(key);
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
 * Obtenir l'image appropriée selon la clé du template
 */
function getTemplateImage(templateKey) {
  const images = {
    'designation': 'assets/img/designation_template.png',
    'negociation': 'assets/img/nego_template.png',
    'custom': 'assets/img/custom_template.png'
  };

  // Retourner l'image correspondante ou une image par défaut
  return images[templateKey] || 'assets/img/designation_template.png';
}

/**
 * Initialiser la barre d'action flottante
 */
function initFloatingActionBar() {
  // Synchroniser les boutons de navigation flottants avec les onglets
  const floatingButtons = document.querySelectorAll('.tab-button-floating');

  floatingButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const tab = btn.dataset.tab;
      if (!tab) {
        console.warn('Bouton sans data-tab:', btn);
        return;
      }

      console.log('Changement d\'onglet vers:', tab);

      // Utiliser directement switchTab pour changer d'onglet
      switchTab(tab);

      // Mettre à jour l'état visuel des boutons flottants (switchTab le fait déjà, mais on le fait aussi ici pour être sûr)
      floatingButtons.forEach(b => {
        b.classList.remove('active');
        const indicator = b.querySelector('.step-indicator-floating');
        if (indicator) {
          indicator.classList.remove('active');
        }
      });
      btn.classList.add('active');
      const indicator = btn.querySelector('.step-indicator-floating');
      if (indicator) {
        indicator.classList.add('active');
      }
    });
  });
  
  console.log(`Initialisé ${floatingButtons.length} boutons flottants`);

  // Synchroniser les boutons flottants avec l'onglet actif
  // Observer les changements sur les sections pour synchroniser
  const observer = new MutationObserver(() => {
    const activeSection = document.querySelector('.tab-section.active');
    if (activeSection) {
      const tabId = activeSection.id.replace('tab-', '');
      floatingButtons.forEach(btn => {
        const btnTab = btn.dataset.tab;
        if (btnTab === tabId) {
          btn.classList.add('active');
          const indicator = btn.querySelector('.step-indicator-floating');
          if (indicator) {
            indicator.classList.add('active');
          }
        } else {
          btn.classList.remove('active');
          const indicator = btn.querySelector('.step-indicator-floating');
          if (indicator) {
            indicator.classList.remove('active');
          }
        }
      });
    }
  });

  // Observer toutes les sections d'onglets
  const tabSections = document.querySelectorAll('.tab-section');
  tabSections.forEach(section => {
    observer.observe(section, { attributes: true, attributeFilter: ['class'] });
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
      if (confirm('Êtes-vous sûr de vouloir effacer toutes les données du formulaire ?')) {
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

  console.log('Toutes les données du formulaire ont été effacées');
}

/**
 * Générer le message d'email par défaut
 */
function generateDefaultEmailMessage() {
  const data = {};

  // Collecter les données du formulaire
  const allInputs = document.querySelectorAll('#coordonneesFields input, #coordonneesFields select, #coordonneesFields textarea, #contenuFields input, #contenuFields select, #contenuFields textarea, #expediteurFields input, #expediteurFields select, #expediteurFields textarea');
  allInputs.forEach(input => {
    data[input.id] = input.value || '';
  });

  const civilite = data.civiliteDestinataire || 'Madame, Monsieur';
  const nom = data.nomDestinataire || '';
  const destinataire = nom ? `${civilite} ${nom}` : civilite;

  const message = `Bonjour ${destinataire},

Veuillez trouver ci-joint le courrier de notre Fédération FO,
Fait pour valoir ce que de droit,

Bonne réception,

Cordialement,
FO METAUX`;

  return message;
}

/**
 * Ouvrir le modal de partage
 */
export function openShareModal() {
  const modal = document.getElementById('shareModal');
  const messageTextarea = document.getElementById('shareEmailMessage');
  const emailInput = document.getElementById('shareEmailInput');
  const emailContainer = document.getElementById('shareEmailContainer');

  if (modal) {
    // Préremplir le message d'email
    if (messageTextarea) {
      messageTextarea.value = generateDefaultEmailMessage();
    }

    // Pré-remplir les emails depuis le champ caché ou directement depuis le champ "Email Destinataire"
    const destinatairesInput = document.getElementById('destinataires');
    const emailDestinataireField = document.getElementById('emailDestinataire');
    
    // Vider les chips existants
    if (emailContainer) {
      const existingChips = emailContainer.querySelectorAll('.email-chip');
      existingChips.forEach(chip => chip.remove());
    }
    
    // Déterminer quelle adresse email utiliser
    let emailToUse = null;
    
    // Priorité 1: Champ caché destinataires (si rempli)
    if (destinatairesInput && destinatairesInput.value && destinatairesInput.value.trim()) {
      emailToUse = destinatairesInput.value.trim();
    }
    // Priorité 2: Champ "Email Destinataire" directement
    else if (emailDestinataireField && emailDestinataireField.value && emailDestinataireField.value.trim()) {
      emailToUse = emailDestinataireField.value.trim();
      // Mettre à jour le champ caché pour cohérence
      if (destinatairesInput) {
        destinatairesInput.value = emailToUse;
      }
    }
    
    // Ajouter l'email comme chip dans le modal
    if (emailToUse && emailContainer) {
      const emails = emailToUse.split(',').map(e => e.trim()).filter(e => e && e.includes('@'));
      
      emails.forEach(email => {
        // Créer le chip manuellement pour le modal de partage
        const chip = document.createElement('div');
        chip.className = 'email-chip share-email-chip flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium elevation-1';
        chip.style.backgroundColor = '#e04142';
        chip.style.color = 'white';
        chip.innerHTML = `
          <span class="material-icons text-base">email</span>
          <span>${email}</span>
          <button type="button" class="ml-1 text-white">
            <span class="material-icons text-base">close</span>
          </button>
        `;

        chip.querySelector('button').addEventListener('click', () => {
          chip.remove();
        });

        emailContainer.insertBefore(chip, emailInput);
      });
    }

    modal.classList.remove('hidden');
  }
}

/**
 * Initialiser le modal de partage
 */
function initShareModal() {
  const modal = document.getElementById('shareModal');
  const closeBtn = document.getElementById('closeShareModal');
  const confirmBtn = document.getElementById('confirmShareBtn');
  const emailInput = document.getElementById('shareEmailInput');
  const emailContainer = document.getElementById('shareEmailContainer');

  if (!modal) return;

  // Tableau pour stocker les emails du modal de partage
  let shareEmails = [];

  // Créer un chip d'email pour le modal de partage
  function createShareChip(email) {
    const chip = document.createElement('div');
    chip.className = 'email-chip share-email-chip flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium elevation-1';
    chip.style.backgroundColor = '#e04142';
    chip.style.color = 'white';
    chip.innerHTML = `
      <span class="material-icons text-base">email</span>
      <span>${email}</span>
      <button type="button" class="ml-1 text-white">
        <span class="material-icons text-base">close</span>
      </button>
    `;

    chip.querySelector('button').addEventListener('click', () => {
      const index = shareEmails.indexOf(email);
      if (index > -1) {
        shareEmails.splice(index, 1);
      }
      chip.remove();
    });

    return chip;
  }

  // Ajouter un email au modal de partage
  function addShareEmail(email) {
    email = email.trim();
    if (!email || !email.includes('@')) return false;
    if (shareEmails.includes(email)) return false;

    shareEmails.push(email);
    const chip = createShareChip(email);
    emailContainer.insertBefore(chip, emailInput);
    return true;
  }

  // Gérer l'input (virgule, point-virgule, espace)
  emailInput?.addEventListener('input', (e) => {
    const value = e.target.value;
    if (value.includes(',') || value.includes(';') || value.includes(' ')) {
      const parts = value.split(/[,;\s]+/);
      parts.forEach(part => {
        if (part.trim()) {
          addShareEmail(part);
        }
      });
      emailInput.value = '';
    }
  });

  // Gérer la touche Backspace
  emailInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && emailInput.value === '') {
      if (shareEmails.length > 0) {
        shareEmails.pop();
        const chips = emailContainer.querySelectorAll('.email-chip');
        if (chips.length > 0) {
          chips[chips.length - 1].remove();
        }
      }
    }

    // Gérer la touche Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      if (emailInput.value.trim()) {
        addShareEmail(emailInput.value);
        emailInput.value = '';
      }
    }
  });

  // Focus sur l'input quand on clique sur le conteneur
  emailContainer?.addEventListener('click', () => {
    emailInput.focus();
  });

  // Fermer le modal
  const closeModal = () => {
    modal.classList.add('hidden');
    emailInput.value = '';
    // Vider les chips
    shareEmails = [];
    emailContainer.querySelectorAll('.email-chip').forEach(chip => chip.remove());
  };

  closeBtn?.addEventListener('click', closeModal);

  // Fermer en cliquant sur le fond
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Confirmer et envoyer
  confirmBtn?.addEventListener('click', async () => {
    // Ajouter l'email en cours de saisie s'il y en a un
    if (emailInput && emailInput.value.trim()) {
      addShareEmail(emailInput.value.trim());
      emailInput.value = '';
    }

    // Récupérer les emails depuis les chips (au lieu du tableau shareEmails)
    const emailChips = emailContainer.querySelectorAll('.email-chip span:nth-child(2)');
    const emails = Array.from(emailChips).map(span => span.textContent.trim()).filter(e => e);

    if (emails.length === 0) {
      alert('Veuillez entrer au moins une adresse email pour partager le document');
      return;
    }

    // Récupérer le message personnalisé
    const messageTextarea = document.getElementById('shareEmailMessage');
    const customMessage = messageTextarea ? messageTextarea.value.trim() : '';

    // Mettre à jour le champ destinataires caché AVEC emailEnvoi pour n8n
    const destinatairesInput = document.getElementById('destinataires');
    if (destinatairesInput) {
      destinatairesInput.value = emails.join(', ');
    }
    
    // Stocker aussi dans emailEnvoi pour compatibilité n8n
    document.body.setAttribute('data-email-envoi', emails.join(', '));

    // Stocker le message personnalisé dans un champ caché ou dans le state
    // On va le passer via un attribut data temporaire
    if (customMessage) {
      document.body.setAttribute('data-custom-email-message', customMessage);
    }

    // Fermer le modal
    closeModal();

    // Appeler directement la fonction sendEmail au lieu de cliquer sur le bouton
    const { sendEmail } = await import('./components/preview.js');
    sendEmail();
  });
}

/**
 * Restaurer le dernier template sélectionné
 */
function restoreLastTemplate() {
  const lastTemplate = sessionStorage.getItem('lastSelectedTemplate');
  if (lastTemplate) {
    console.log('Restauration du template:', lastTemplate);
    const templateSelect = document.getElementById('template');
    if (templateSelect) {
      templateSelect.value = lastTemplate;
      // Déclencher l'événement change pour afficher le formulaire
      templateSelect.dispatchEvent(new Event('change'));
    }
    // Nettoyer le sessionStorage
    sessionStorage.removeItem('lastSelectedTemplate');
  }
}

/**
 * Initialiser le stepper de navigation
 */
async function initStepper() {
  const prevBtn = document.getElementById('prevStepBtn');
  const nextBtn = document.getElementById('nextStepBtn');
  const previewBtn = document.getElementById('previewStepBtn');
  const actionPrevBtn = document.getElementById('actionPrevBtn');
  const actionNextBtn = document.getElementById('actionNextBtn');
  
  if (!prevBtn || !nextBtn || !previewBtn) return;
  
  // Navigation entre les étapes
  nextBtn.addEventListener('click', async () => {
    const { nextTab } = await import('./components/tabs.js');
    nextTab();
    await updateStepperButtons();
  });
  
  prevBtn.addEventListener('click', async () => {
    const { previousTab } = await import('./components/tabs.js');
    previousTab();
    await updateStepperButtons();
  });
  
  // Navigation depuis la barre d'action
  if (actionNextBtn) {
    actionNextBtn.addEventListener('click', async () => {
      const { nextTab } = await import('./components/tabs.js');
      nextTab();
      await updateStepperButtons();
    });
  }
  
  if (actionPrevBtn) {
    actionPrevBtn.addEventListener('click', async () => {
      const { previousTab } = await import('./components/tabs.js');
      previousTab();
      await updateStepperButtons();
    });
  }
  
  // Écouter les changements d'onglet pour mettre à jour les boutons
  document.addEventListener('tabChanged', async () => {
    await updateStepperButtons();
  });
  
  // Bouton de prévisualisation
  previewBtn.addEventListener('click', async () => {
    const { generateLocalPreview } = await import('./utils/validation.js');
    generateLocalPreview();
  });
  
  // Synchroniser l'état disabled avec le bouton principal
  const previewBtnObserver = new MutationObserver(() => {
    const mainPreviewBtn = getElement(CONFIG.SELECTORS.previewBtn);
    if (mainPreviewBtn) {
      const isDisabled = mainPreviewBtn.disabled;
      previewBtn.disabled = isDisabled;
    }
  });
  
  const mainPreviewBtn = getElement(CONFIG.SELECTORS.previewBtn);
  if (mainPreviewBtn) {
    previewBtnObserver.observe(mainPreviewBtn, { attributes: true, attributeFilter: ['disabled'] });
  }
  
  // Mettre à jour l'état initial des boutons
  await updateStepperButtons();
}

/**
 * Mettre à jour l'état des boutons du stepper
 */
async function updateStepperButtons() {
  const prevBtn = document.getElementById('prevStepBtn');
  const nextBtn = document.getElementById('nextStepBtn');
  const previewBtn = document.getElementById('previewStepBtn');
  const downloadBtn = document.getElementById('downloadStepBtn');
  const actionPrevBtn = document.getElementById('actionPrevBtn');
  const actionNextBtn = document.getElementById('actionNextBtn');
  
  const { getActiveTab } = await import('./core/state.js');
  const activeTab = getActiveTab();
  
  const tabs = ['coordonnees', 'contenu', 'expediteur'];
  const currentIndex = tabs.indexOf(activeTab);
  
  // Mettre à jour la visibilité des boutons
  if (currentIndex > 0) {
    // Afficher le bouton précédent si on n'est pas sur la page 1
    if (prevBtn) {
      prevBtn.classList.remove('hidden');
      prevBtn.style.display = '';
    }
    if (actionPrevBtn) {
      actionPrevBtn.style.display = 'flex';
    }
  } else {
    // Masquer le bouton précédent sur la page 1 (index 0)
    if (prevBtn) {
      prevBtn.classList.add('hidden');
      prevBtn.style.display = 'none';
    }
    if (actionPrevBtn) {
      actionPrevBtn.style.display = 'none';
    }
  }
  
  if (currentIndex < tabs.length - 1) {
    if (nextBtn) nextBtn.classList.remove('hidden');
    if (actionNextBtn) actionNextBtn.classList.remove('hidden');
    // Cacher le bouton de prévisualisation
    if (previewBtn) previewBtn.style.display = 'none';
    // Cacher le conteneur des boutons
    const formActionButtons = document.getElementById('formActionButtons');
    if (formActionButtons) formActionButtons.style.display = 'none';
  } else {
    if (nextBtn) nextBtn.classList.add('hidden');
    if (actionNextBtn) actionNextBtn.classList.add('hidden');
    // Afficher le bouton de prévisualisation
    if (previewBtn) previewBtn.style.display = 'flex';
    // Afficher le conteneur des boutons
    const formActionButtons = document.getElementById('formActionButtons');
    if (formActionButtons) formActionButtons.style.display = 'flex';
  }
  
  // Mettre à jour les indicateurs d'étape du stepper
  const stepIndicators = document.querySelectorAll('.w-8.h-8.rounded-full');
  stepIndicators.forEach((indicator, index) => {
    if (index < currentIndex) {
      // Étape complétée
      indicator.classList.remove('bg-gray-300', 'text-gray-600');
      indicator.classList.add('bg-[#a84383]', 'text-white');
    } else if (index === currentIndex) {
      // Étape actuelle
      indicator.classList.remove('bg-gray-300', 'text-gray-600');
      indicator.classList.add('bg-[#a84383]', 'text-white');
    } else {
      // Étapes futures
      indicator.classList.remove('bg-[#a84383]', 'text-white');
      indicator.classList.add('bg-gray-300', 'text-gray-600');
    }
  });
  
  // Mettre à jour les textes des étapes
  const stepTexts = document.querySelectorAll('.text-sm.font-medium');
  stepTexts.forEach((text, index) => {
    if (index < currentIndex) {
      text.classList.remove('text-gray-500');
      text.classList.add('text-gray-700');
    } else if (index === currentIndex) {
      text.classList.remove('text-gray-500');
      text.classList.add('text-gray-700');
    }
  });
  
  // Mettre à jour les indicateurs d'étape
  const { updateStepIndicators } = await import('./components/tabs.js');
  updateStepIndicators();
}

/**
 * Sauvegarder les valeurs du formulaire pour un template
 */
function saveFormValues(templateKey) {
  console.log('Sauvegarde des valeurs pour:', templateKey);
  const formData = {};

  // Récupérer tous les champs du formulaire
  const inputs = document.querySelectorAll('#dynamicFields input, #dynamicFields select, #dynamicFields textarea');
  inputs.forEach(input => {
    const fieldId = input.id || input.name;
    if (fieldId) {
      if (input.type === 'checkbox') {
        formData[fieldId] = input.checked;
      } else if (input.type === 'radio') {
        if (input.checked) {
          formData[fieldId] = input.value;
        }
      } else {
        formData[fieldId] = input.value;
      }
    }
  });

  // Sauvegarder aussi les destinataires
  const destinataires = document.getElementById('destinataires');
  if (destinataires) {
    formData['destinataires'] = destinataires.value;
  }

  console.log('Données sauvegardées:', formData);
  localStorage.setItem(`formValues_${templateKey}`, JSON.stringify(formData));
}

/**
 * Restaurer les valeurs du formulaire pour un template
 */
function restoreFormValues(templateKey) {
  const saved = localStorage.getItem(`formValues_${templateKey}`);
  if (!saved) {
    console.log('Pas de valeurs sauvegardées pour:', templateKey);
    return;
  }

  console.log('Restauration des valeurs pour:', templateKey);
  const formData = JSON.parse(saved);
  console.log('Données restaurées:', formData);

  // Restaurer les valeurs dans les champs
  Object.entries(formData).forEach(([fieldId, value]) => {
    // Chercher par ID d'abord, puis par name
    let input = document.getElementById(fieldId);
    if (!input) {
      input = document.querySelector(`[name="${fieldId}"]`);
    }

    if (input) {
      if (input.type === 'checkbox') {
        input.checked = value;
      } else if (input.type === 'radio') {
        if (input.value === value) {
          input.checked = true;
        }
      } else {
        input.value = value;
      }

      // Déclencher l'événement input pour mettre à jour l'UI
      input.dispatchEvent(new Event('input', { bubbles: true }));
      console.log(`Restauré ${fieldId}:`, value);
    } else {
      console.log(`Champ non trouvé: ${fieldId}`);
    }
  });
}

/**
 * Initialiser l'auto-save pour un template
 */
function initAutoSave(templateKey) {
  console.log('Initialisation auto-save pour:', templateKey);

  // Écouter tous les changements de champs
  const inputs = document.querySelectorAll('#dynamicFields input, #dynamicFields select, #dynamicFields textarea');
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      // Debounce: sauvegarder après 500ms d'inactivité
      clearTimeout(window.autoSaveTimeout);
      window.autoSaveTimeout = setTimeout(() => {
        saveFormValues(templateKey);
      }, 500);
    });
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

