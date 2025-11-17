/**
 * Form Builder - Permet de personnaliser les champs du formulaire
 * Ajouter, supprimer, réorganiser les champs par drag & drop
 */

import { CONFIG } from '../core/config.js';

let isEditMode = false;
let currentTemplate = null;
let availableVariables = {};
let variablesCommunes = {};
let selectedFields = [];
let currentCategory = 'all'; // all, coordonnees, contenu, expediteur
let sortableInstance = null; // Instance Sortable pour le drag & drop

/**
 * Initialiser le form builder pour un template
 * @param {string} templateType - Type de template
 * @param {Object} variables - Variables spécifiques du template
 * @param {Object} communes - Variables communes
 */
export function initFormBuilder(templateType, variables, communes = {}) {
  console.log('initFormBuilder appelé', templateType, variables, communes);

  currentTemplate = templateType;
  availableVariables = variables;
  variablesCommunes = communes;

  // Charger la config sauvegardée ou utiliser les champs par défaut
  const savedConfig = loadFormConfig(templateType);
  if (savedConfig) {
    selectedFields = savedConfig;
  } else {
    // Initialiser avec tous les champs par défaut (communes + spécifiques)
    const allVariables = { ...communes, ...variables };
    selectedFields = Object.keys(allVariables).map(key => ({
      key,
      config: allVariables[key],
      type: allVariables[key].type || 'text',
      category: getVariableCategory(key, communes, variables)
    }));
  }

  console.log('selectedFields:', selectedFields);

  // Ajouter le bouton "Personnaliser" si pas déjà présent
  addCustomizeButton();
}

/**
 * Déterminer la catégorie d'une variable
 */
function getVariableCategory(key, communes, specifiques) {
  // Variables de coordonnées (destinataire)
  const coordonneesKeys = [
    'entreprise',
    'civiliteDestinataire',
    'nomDestinataire',
    'statutDestinataire',
    'batiment',
    'adresse',
    'cpVille',
    'emailDestinataire'
  ];

  // Variables d'expéditeur (signature)
  const expediteurKeys = ['signatureExp'];

  // Variables de contenu (tout le reste)
  const contenuKeys = [
    'codeDocument',
    'numeroCourrier',
    'objet',
    'texteIa',
    'civiliteDelegue',
    'nomDelegue',
    'emailDelegue',
    'civiliteRemplace',
    'nomRemplace'
  ];

  if (coordonneesKeys.includes(key)) return 'coordonnees';
  if (expediteurKeys.includes(key)) return 'expediteur';
  if (contenuKeys.includes(key)) return 'contenu';

  // Par défaut, si c'est une variable spécifique, c'est du contenu
  if (specifiques[key]) return 'contenu';

  // Sinon, par défaut coordonnées
  return 'coordonnees';
}

/**
 * Ajouter le bouton "Personnaliser les champs" dans la barre flottante
 */
function addCustomizeButton() {
  console.log('addCustomizeButton appelé');

  const customizeBtn = document.getElementById('customizeFieldsBtn');
  if (!customizeBtn) {
    console.error('Bouton customizeFieldsBtn non trouvé dans le HTML');
    return;
  }

  // Afficher le bouton (il est caché par défaut)
  customizeBtn.style.display = 'flex';

  // Retirer les anciens listeners en clonant le bouton
  const newBtn = customizeBtn.cloneNode(true);
  customizeBtn.parentNode.replaceChild(newBtn, customizeBtn);

  // Ajouter le listener
  newBtn.addEventListener('click', toggleEditMode);

  console.log('Bouton personnaliser affiché dans la barre flottante');
}

/**
 * Basculer entre mode édition et mode remplissage
 */
function toggleEditMode() {
  isEditMode = !isEditMode;
  
  if (isEditMode) {
    showEditMode();
  } else {
    hideEditMode();
  }
}

/**
 * Afficher le mode édition
 */
function showEditMode() {
  const dynamicFields = document.getElementById('dynamicFields');
  if (!dynamicFields) return;

  // Ajouter une classe pour le style en mode édition
  dynamicFields.classList.add('builder-mode');

  // Détecter l'onglet actif au démarrage
  currentCategory = detectActiveTab();
  console.log('Catégorie détectée:', currentCategory);

  // Écouter les clics sur les onglets existants
  listenToExistingTabs();

  // Ajouter un bandeau en haut avec les variables disponibles
  const existingBanner = document.getElementById('builderBanner');
  if (!existingBanner) {
    const banner = document.createElement('div');
    banner.id = 'builderBanner';
    banner.className = 'builder-banner-simple bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4';
    banner.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="material-icons text-blue-600">build</span>
          <span class="font-semibold text-lg">Mode Construction</span>
        </div>
        <button id="doneEditBtn" type="button" class="md3-button-filled px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-2">
          <span class="material-icons text-base">check</span> Terminer
        </button>
      </div>
      <div>
        <h4 class="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span class="material-icons text-base">widgets</span>
          Variables disponibles
        </h4>
        <div id="availableVariablesChips" class="flex flex-wrap gap-2"></div>
      </div>
    `;
    dynamicFields.insertBefore(banner, dynamicFields.firstChild);
  }

  // Rendre les variables disponibles en chips
  renderAvailableVariablesChips();

  // Ajouter les styles CSS pour le mode builder
  addBuilderStyles();

  // Rendre les champs existants éditables (avec drag & drop et delete)
  // Attendre que le DOM soit prêt
  setTimeout(() => {
    makeFieldsEditable();
  }, 100);

  // Bouton "Terminer"
  document.getElementById('doneEditBtn').addEventListener('click', () => {
    console.log('Sauvegarde de la config pour:', currentTemplate);
    saveFormConfig(currentTemplate, selectedFields);
    console.log('Config sauvegardée !');
    hideEditMode();
  });
}

/**
 * Ajouter les styles CSS pour le mode builder
 */
function addBuilderStyles() {
  if (document.getElementById('builderStyles')) return;

  const style = document.createElement('style');
  style.id = 'builderStyles';
  style.textContent = `
    .builder-mode {
      position: relative;
    }

    .builder-banner {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .builder-banner .material-icons {
      animation: rotate 2s linear infinite;
    }

    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .builder-mode::before {
      content: '';
      position: absolute;
      top: -4px;
      left: -4px;
      right: -4px;
      bottom: -4px;
      border: 3px dashed #3b82f6;
      border-radius: 12px;
      pointer-events: none;
      animation: dashMove 20s linear infinite;
    }

    @keyframes dashMove {
      to { stroke-dashoffset: -100; }
    }

    .builder-field {
      transition: all 0.2s ease;
    }

    .builder-field:hover {
      background-color: rgba(59, 130, 246, 0.05);
      border-radius: 8px;
    }

    .drag-handle {
      cursor: grab;
      opacity: 0.4;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 8px;
      background: transparent;
    }

    .drag-handle:hover {
      opacity: 1;
      background: rgba(59, 130, 246, 0.1);
      transform: scale(1.1);
    }

    .drag-handle:active {
      cursor: grabbing;
      background: rgba(59, 130, 246, 0.2);
      transform: scale(0.95);
    }

    .drag-handle .material-icons {
      color: #3b82f6;
      font-size: 20px;
    }

    .delete-field-btn {
      opacity: 0.4;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 8px;
      background: transparent;
    }

    .delete-field-btn:hover {
      opacity: 1;
      background: rgba(239, 68, 68, 0.1);
      transform: scale(1.1);
    }

    .delete-field-btn:active {
      background: rgba(239, 68, 68, 0.2);
      transform: scale(0.95);
    }

    .delete-field-btn .material-icons {
      color: #ef4444;
      font-size: 20px;
    }

    /* Styles pour le drag & drop - SIMPLE */
    .sortable-ghost {
      opacity: 1 !important;
      background: rgba(59, 130, 246, 0.05) !important;
      border: 2px dashed #3b82f6 !important;
      border-radius: 8px !important;
    }

    .sortable-chosen {
      cursor: grabbing !important;
      opacity: 0.5 !important;
      border: 2px dashed #3b82f6 !important;
      border-radius: 8px !important;
    }

    .sortable-drag {
      opacity: 1 !important;
      cursor: grabbing !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Détecter l'onglet actif au démarrage
 */
function detectActiveTab() {
  // Chercher le bouton d'onglet actif
  const activeTabButton = document.querySelector('.tab-button-floating.active');

  if (activeTabButton) {
    const tabName = activeTabButton.getAttribute('data-tab');
    currentCategory = tabName;
    console.log('Onglet actif détecté:', tabName);
    return tabName;
  } else {
    // Vérifier les sections visibles
    const coordSection = document.getElementById('tab-coordonnees');
    const contenuSection = document.getElementById('tab-contenu');
    const expediteurSection = document.getElementById('tab-expediteur');

    if (coordSection && coordSection.classList.contains('active')) {
      currentCategory = 'coordonnees';
      console.log('Section active: Coordonnées');
      return 'coordonnees';
    } else if (contenuSection && contenuSection.classList.contains('active')) {
      currentCategory = 'contenu';
      console.log('Section active: Contenu');
      return 'contenu';
    } else if (expediteurSection && expediteurSection.classList.contains('active')) {
      currentCategory = 'expediteur';
      console.log('Section active: Expéditeur');
      return 'expediteur';
    } else {
      currentCategory = 'coordonnees'; // Par défaut
      console.log('Onglet par défaut: Coordonnées');
      return 'coordonnees';
    }
  }
}

/**
 * Écouter les clics sur les onglets existants de la barre flottante
 */
function listenToExistingTabs() {
  // Sélectionner tous les boutons d'onglets
  const tabButtons = document.querySelectorAll('.tab-button-floating');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      console.log('Changement vers:', tabName);
      currentCategory = tabName;
      // Rafraîchir les chips avec la nouvelle catégorie
      setTimeout(() => renderAvailableVariablesChips(), 100);
    });
  });
}

/**
 * Masquer le mode édition et afficher le formulaire normal
 */
function hideEditMode() {
  // Réinitialiser la catégorie
  currentCategory = 'coordonnees';

  // Sauvegarder le template actuel avant de recharger
  if (currentTemplate) {
    sessionStorage.setItem('lastSelectedTemplate', currentTemplate);
  }

  // Retirer la classe builder-mode et le banner
  const dynamicFields = document.getElementById('dynamicFields');
  if (dynamicFields) {
    dynamicFields.classList.remove('builder-mode');
    const banner = document.getElementById('builderBanner');
    if (banner) banner.remove();
    const container = document.getElementById('builderContainer');
    if (container) container.remove();
  }

  // Recharger le formulaire avec les champs sélectionnés
  window.location.reload();
}

/**
 * Cacher le bouton personnaliser
 */
export function hideCustomizeButton() {
  const customizeBtn = document.getElementById('customizeFieldsBtn');
  if (customizeBtn) {
    customizeBtn.style.display = 'none';
  }
}

/**
 * Rendre la palette des variables disponibles
 */
function renderVariablesPalette() {
  const palette = document.getElementById('variablesPalette');
  if (!palette) return;

  palette.innerHTML = '';

  // Organiser les variables par catégorie
  const categories = {
    coordonnees: { label: 'Coordonnées', icon: 'location_on', vars: {} },
    contenu: { label: 'Contenu', icon: 'edit_document', vars: {} },
    expediteur: { label: 'Expéditeur', icon: 'person', vars: {} }
  };

  // Classer les variables communes
  Object.entries(variablesCommunes).forEach(([key, config]) => {
    const category = getVariableCategory(key, variablesCommunes, {});
    if (categories[category]) {
      categories[category].vars[key] = config;
    }
  });

  // Classer les variables spécifiques
  Object.entries(availableVariables).forEach(([key, config]) => {
    const category = getVariableCategory(key, {}, availableVariables);
    if (categories[category]) {
      categories[category].vars[key] = config;
    }
  });

  console.log('Catégorie actuelle:', currentCategory);
  console.log('Catégories disponibles:', Object.keys(categories));

  // Afficher chaque catégorie (filtrer selon currentCategory)
  Object.entries(categories).forEach(([catKey, catData]) => {
    console.log(`Vérification catégorie ${catKey}:`, catData);

    // Filtrer selon la catégorie sélectionnée
    if (currentCategory !== catKey) {
      console.log(`Catégorie ${catKey} ignorée (currentCategory=${currentCategory})`);
      return;
    }
    if (Object.keys(catData.vars).length === 0) {
      console.log(`Catégorie ${catKey} vide`);
      return;
    }

    console.log(`Affichage catégorie ${catKey}`);

    const section = document.createElement('div');
    section.className = 'mb-4';

    const header = document.createElement('div');
    header.className = 'flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700';
    header.innerHTML = `
      <span class="material-icons text-sm">${catData.icon}</span>
      ${catData.label}
    `;
    section.appendChild(header);

    Object.entries(catData.vars).forEach(([key, config]) => {
      const isSelected = selectedFields.some(f => f.key === key);

      const item = document.createElement('div');
      item.className = `p-2 mb-1 rounded border cursor-pointer transition-all text-xs ${
        isSelected
          ? 'bg-gray-200 border-gray-400 opacity-50 cursor-not-allowed'
          : 'bg-white border-gray-300 hover:border-blue-500 hover:shadow-sm'
      }`;

      item.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="material-icons text-xs text-gray-600">${config.icon || 'label'}</span>
          <div class="flex-1">
            <div class="font-medium text-gray-800">{${key}}</div>
            <div class="text-gray-500">${config.label}</div>
          </div>
        </div>
      `;

      if (!isSelected) {
        item.addEventListener('click', () => addFieldToForm(key, config, catKey));
      }

      section.appendChild(item);
    });

    palette.appendChild(section);
  });
}

/**
 * Ajouter un champ au formulaire
 */
function addFieldToForm(key, config, category) {
  selectedFields.push({
    key,
    config,
    type: config.type || 'text',
    category: category || 'contenu'
  });

  renderVariablesPalette();
  renderSelectedFields();
}

/**
 * Rendre les champs sélectionnés
 */
function renderSelectedFields() {
  const list = document.getElementById('formFieldsList');
  if (!list) return;

  list.innerHTML = '';

  if (selectedFields.length === 0) {
    list.innerHTML = '<div class="text-center text-gray-400 py-8">Aucun champ sélectionné. Cliquez sur une variable pour l\'ajouter.</div>';
    return;
  }

  selectedFields.forEach((field, index) => {
    const item = document.createElement('div');
    item.className = 'field-item p-3 bg-gray-50 rounded border border-gray-300 cursor-move hover:border-blue-500 transition-all';
    item.dataset.index = index;

    item.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="material-icons text-gray-400 drag-handle">drag_indicator</span>
        <span class="material-icons text-sm text-gray-600">${field.config.icon || 'label'}</span>
        <div class="flex-1">
          <div class="text-sm font-medium text-gray-800">{${field.key}}</div>
          <div class="text-xs text-gray-500">${field.config.label}</div>
        </div>
        <select class="field-type-select text-xs border border-gray-300 rounded px-2 py-1" data-index="${index}">
          <option value="text" ${field.type === 'text' ? 'selected' : ''}>Texte</option>
          <option value="textarea" ${field.type === 'textarea' ? 'selected' : ''}>Texte long</option>
          <option value="select" ${field.type === 'select' ? 'selected' : ''}>Liste</option>
        </select>
        <button type="button" class="remove-field text-red-500 hover:text-red-700" data-index="${index}">
          <span class="material-icons text-base">delete</span>
        </button>
      </div>
    `;

    list.appendChild(item);
  });

  // Événements pour supprimer et changer le type
  list.querySelectorAll('.remove-field').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      removeField(index);
    });
  });

  list.querySelectorAll('.field-type-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      selectedFields[index].type = e.currentTarget.value;
    });
  });
}

/**
 * Supprimer un champ
 */
function removeField(index) {
  selectedFields.splice(index, 1);
  renderVariablesPalette();
  renderSelectedFields();
}

/**
 * Rendre les variables disponibles en chips horizontaux
 */
function renderAvailableVariablesChips() {
  const container = document.getElementById('availableVariablesChips');
  if (!container) return;

  container.innerHTML = '';

  console.log('Rendu des chips, catégorie:', currentCategory);
  console.log('Variables communes:', variablesCommunes);
  console.log('Variables spécifiques:', availableVariables);

  // Fusionner toutes les variables
  const allVars = { ...variablesCommunes, ...availableVariables };
  console.log('Toutes les variables:', allVars);

  Object.entries(allVars).forEach(([key, config]) => {
    const category = getVariableCategory(key, variablesCommunes, availableVariables);

    console.log(`Variable ${key}: catégorie=${category}, currentCategory=${currentCategory}`);

    // Filtrer selon la catégorie active
    if (currentCategory !== category) return;

    // Vérifier si déjà ajouté
    const isAdded = selectedFields.some(f => f.key === key);

    // Créer le chip
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = isAdded
      ? 'px-3 py-1.5 bg-gray-200 text-gray-400 rounded-full text-sm flex items-center gap-1 cursor-not-allowed'
      : 'px-3 py-1.5 bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 rounded-full text-sm flex items-center gap-1 cursor-pointer transition-all';
    chip.disabled = isAdded;
    chip.innerHTML = `
      <span class="material-icons text-sm">${config.icon || 'label'}</span>
      <span>{${key}}</span>
    `;

    if (!isAdded) {
      chip.addEventListener('click', () => addFieldToFormSimple(key, config, category));
    }

    container.appendChild(chip);
  });

  console.log('Chips rendus:', container.children.length);
}

/**
 * Ajouter un champ au formulaire (version simplifiée)
 */
function addFieldToFormSimple(key, config, category) {
  selectedFields.push({
    key,
    config,
    type: config.type || 'text',
    category: category || 'contenu'
  });

  // Rafraîchir les chips
  renderAvailableVariablesChips();

  // Ajouter le champ visuellement dans le formulaire
  addFieldVisually(key, config, category);
}

/**
 * Ajouter un champ visuellement dans le formulaire
 */
function addFieldVisually(key, config, category) {
  // Déterminer le conteneur selon la catégorie
  let containerId;
  if (category === 'coordonnees') {
    containerId = 'coordonneesFields';
  } else if (category === 'contenu') {
    containerId = 'contenuFields';
  } else if (category === 'expediteur') {
    containerId = 'expediteurFields';
  } else {
    containerId = 'coordonneesFields'; // Par défaut
  }

  const container = document.getElementById(containerId);
  if (!container) {
    console.error('Conteneur non trouvé:', containerId);
    return;
  }

  // Créer le champ avec icône delete et drag handle (style 2 colonnes)
  const fieldWrapper = document.createElement('div');
  fieldWrapper.className = 'w-full builder-field';
  fieldWrapper.dataset.fieldKey = key;

  fieldWrapper.innerHTML = `
    <div class="flex items-start gap-2">
      <button type="button" class="drag-handle cursor-move p-2 flex-shrink-0">
        <span class="material-icons">drag_indicator</span>
      </button>
      <div class="flex-1">
        <label class="block text-xs font-medium text-gray-700 mb-1.5">
          ${config.label}
          ${config.required ? '<span style="color: #c4232d; font-weight: bold;"> *</span>' : ''}
        </label>
        ${createFieldInput(key, config)}
      </div>
      <button type="button" class="delete-field-btn p-2 flex-shrink-0">
        <span class="material-icons">delete</span>
      </button>
    </div>
  `;

  // Ajouter à la fin du conteneur (dans la grille 2 colonnes)
  container.appendChild(fieldWrapper);

  // Ajouter le listener pour delete
  fieldWrapper.querySelector('.delete-field-btn').addEventListener('click', () => {
    removeFieldSimple(key, fieldWrapper);
  });

  console.log('Champ ajouté:', key, 'dans', containerId);
}

/**
 * Créer l'input HTML pour un champ
 */
function createFieldInput(key, config) {
  if (config.type === 'select' && config.options) {
    const options = config.options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
    return `<select id="${key}" class="md3-input w-full p-2.5 text-sm"><option value="">Choisir...</option>${options}</select>`;
  } else if (config.type === 'textarea') {
    return `<textarea id="${key}" class="md3-input w-full p-2.5 text-sm resize-none" rows="3" placeholder="${config.placeholder || config.label}"></textarea>`;
  } else {
    return `<input type="text" id="${key}" class="md3-input w-full p-2.5 text-sm" placeholder="${config.placeholder || config.label}">`;
  }
}

/**
 * Supprimer un champ (version simplifiée)
 */
function removeFieldSimple(key, fieldElement) {
  // Retirer du tableau
  const index = selectedFields.findIndex(f => f.key === key);
  if (index !== -1) {
    selectedFields.splice(index, 1);
  }

  // Retirer visuellement
  fieldElement.remove();

  // Rafraîchir les chips
  renderAvailableVariablesChips();
}

/**
 * Rendre les champs existants éditables
 */
function makeFieldsEditable() {
  // Récupérer tous les conteneurs de champs (coordonnées, contenu, expéditeur)
  const containers = [
    { id: 'coordonneesFields', category: 'coordonnees' },
    { id: 'contenuFields', category: 'contenu' },
    { id: 'expediteurFields', category: 'expediteur' }
  ];

  containers.forEach(({ id, category }) => {
    const container = document.getElementById(id);
    if (!container) return;

    // Récupérer tous les champs existants dans ce conteneur
    const existingFields = container.querySelectorAll('.w-full:not(.builder-field)');
    console.log(`🔧 Champs existants dans ${id}:`, existingFields.length);

    existingFields.forEach((fieldWrapper, index) => {
      console.log(`🔧 Traitement du champ ${index} dans ${id}`);

      // Créer le wrapper avec les contrôles
      const wrapper = document.createElement('div');
      wrapper.className = 'flex items-start gap-2';

      // Drag handle
      const dragHandle = document.createElement('button');
      dragHandle.type = 'button';
      dragHandle.className = 'drag-handle cursor-move p-2 flex-shrink-0';
      dragHandle.innerHTML = '<span class="material-icons">drag_indicator</span>';

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'delete-field-btn p-2 flex-shrink-0';
      deleteBtn.innerHTML = '<span class="material-icons">delete</span>';

      // Récupérer le contenu existant
      const content = document.createElement('div');
      content.className = 'flex-1';
      content.innerHTML = fieldWrapper.innerHTML;

      // Assembler
      wrapper.appendChild(dragHandle);
      wrapper.appendChild(content);
      wrapper.appendChild(deleteBtn);

      fieldWrapper.innerHTML = '';
      fieldWrapper.appendChild(wrapper);
      fieldWrapper.classList.add('builder-field');

      // Stocker la clé du champ
      const fieldKey = fieldWrapper.querySelector('input, select, textarea')?.id;
      if (fieldKey) {
        fieldWrapper.dataset.fieldKey = fieldKey;

        // Ajouter à selectedFields si pas déjà présent
        const alreadyInSelected = selectedFields.some(f => f.key === fieldKey);
        if (!alreadyInSelected) {
          const allVars = { ...variablesCommunes, ...availableVariables };
          const config = allVars[fieldKey];
          if (config) {
            selectedFields.push({
              key: fieldKey,
              config: config,
              type: config.type || 'text',
              category: category
            });
            console.log(`Ajouté à selectedFields: ${fieldKey}`);
          }
        }

        // Listener pour delete
        deleteBtn.addEventListener('click', () => {
          removeFieldSimple(fieldKey, fieldWrapper);
        });
      }
    });

    // Activer le drag & drop sur ce conteneur
    if (window.Sortable && existingFields.length > 0) {
      new Sortable(container, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        onEnd: (evt) => {
          console.log(`Drag & drop terminé dans ${id}`);
          updateSelectedFieldsOrder();
        }
      });

      console.log(`Drag & drop activé sur ${id} (${existingFields.length} champs)`);
    }
  });

  // Rafraîchir les chips pour griser les variables déjà utilisées
  renderAvailableVariablesChips();
}

/**
 * Mettre à jour l'ordre des selectedFields selon l'ordre visuel
 */
function updateSelectedFieldsOrder() {
  const dynamicFields = document.getElementById('dynamicFields');
  if (!dynamicFields) return;

  const newOrder = [];
  dynamicFields.querySelectorAll('.builder-field').forEach(fieldGroup => {
    const fieldKey = fieldGroup.dataset.fieldKey || fieldGroup.querySelector('input, select, textarea')?.id;
    if (fieldKey) {
      const field = selectedFields.find(f => f.key === fieldKey);
      if (field) {
        newOrder.push(field);
      }
    }
  });

  selectedFields.length = 0;
  selectedFields.push(...newOrder);
}

/**
 * Initialiser le drag & drop avec SortableJS
 */
function initDragAndDrop() {
  const list = document.getElementById('formFieldsList');
  if (!list || !window.Sortable) return;

  new Sortable(list, {
    animation: 150,
    handle: '.drag-handle',
    ghostClass: 'opacity-50',
    onEnd: (evt) => {
      const item = selectedFields.splice(evt.oldIndex, 1)[0];
      selectedFields.splice(evt.newIndex, 0, item);
    }
  });
}

/**
 * Sauvegarder la config du formulaire dans localStorage
 */
function saveFormConfig(templateType, fields) {
  const key = `formConfig_${templateType}`;
  console.log(`Sauvegarde dans localStorage avec clé: ${key}`);
  console.log('Données à sauvegarder:', fields);
  localStorage.setItem(key, JSON.stringify(fields));
  console.log('Sauvegarde réussie !');

  // Vérifier que c'est bien sauvegardé
  const verification = localStorage.getItem(key);
  console.log('Vérification:', verification);
}

/**
 * Charger la config du formulaire depuis localStorage
 */
function loadFormConfig(templateType) {
  const key = `formConfig_${templateType}`;
  const saved = localStorage.getItem(key);
  console.log(`Chargement depuis localStorage avec clé: ${key}`);
  console.log('Données chargées:', saved);
  return saved ? JSON.parse(saved) : null;
}

/**
 * Obtenir les champs sélectionnés
 */
export function getSelectedFields() {
  return selectedFields;
}

/**
 * Vérifier si une config personnalisée existe
 */
export function hasCustomConfig(templateType) {
  const key = `formConfig_${templateType}`;
  return localStorage.getItem(key) !== null;
}
