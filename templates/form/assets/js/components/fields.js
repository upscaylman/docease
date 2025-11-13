/**
 * Gestion de la génération des champs dynamiques
 */

import { CONFIG } from '../core/config.js';
import { getVariablesConfig, setCurrentTemplate } from '../core/state.js';
import { getElement } from '../core/config.js';

/**
 * Créer un champ HTML depuis la configuration
 * @param {string} key - Clé du champ
 * @param {Object} config - Configuration du champ
 * @returns {HTMLElement|null}
 */
export function createField(key, config) {
  const fieldContainer = document.createElement('div');
  fieldContainer.className = 'w-full';

  const label = document.createElement('label');
  label.htmlFor = key;
  label.className = 'block text-xs font-medium text-gray-700 mb-1.5';
  label.textContent = config.label;

  // Ajouter une astérisque rouge pour les champs obligatoires
  if (config.required) {
    const asterisk = document.createElement('span');
    asterisk.textContent = ' *';
    asterisk.style.color = '#c4232d'; // Rouge FO
    asterisk.style.fontWeight = 'bold';
    label.appendChild(asterisk);
  }

  fieldContainer.appendChild(label);

  if (config.type === 'select') {
    const select = createSelectField(key, config);
    fieldContainer.appendChild(select);
    return fieldContainer;
  } else if (config.type === 'textarea') {
    const textarea = createTextareaField(key, config);
    fieldContainer.appendChild(textarea);
    return fieldContainer;
  } else {
    const input = createInputField(key, config);
    fieldContainer.appendChild(input);
    return fieldContainer;
  }
}

/**
 * Créer un champ select
 * @param {string} key - Clé du champ
 * @param {Object} config - Configuration du champ
 * @returns {HTMLSelectElement}
 */
function createSelectField(key, config) {
  const select = document.createElement('select');
  select.id = key;
  select.className = 'md3-input md3-select w-full p-2.5 text-sm bg-white';
  select.required = config.required || false;
  
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Choisir...';
  select.appendChild(defaultOption);
  
  config.options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    select.appendChild(option);
  });
  
  return select;
}

/**
 * Créer un champ textarea avec icône optionnelle
 * @param {string} key - Clé du champ
 * @param {Object} config - Configuration du champ
 * @returns {HTMLElement}
 */
function createTextareaField(key, config) {
  const wrapper = document.createElement('div');
  wrapper.className = 'relative';

  // Icône en haut à gauche (optionnelle)
  if (config.icon) {
    const icon = document.createElement('span');
    icon.className = 'material-icons absolute left-3 top-3 text-gray-400 text-base pointer-events-none';
    icon.textContent = config.icon;
    wrapper.appendChild(icon);
  }

  const textarea = document.createElement('textarea');
  textarea.id = key;
  textarea.placeholder = config.placeholder || config.label;
  textarea.rows = config.rows || 3;
  textarea.className = config.icon ? 'md3-input w-full p-2.5 pl-10 pr-10 text-sm resize-none' : 'md3-input w-full p-2.5 pr-10 text-sm resize-none';
  textarea.required = config.required || false;

  // Bouton pour effacer le champ
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'absolute right-2 top-3 text-gray-400 hover:text-red-500 transition-colors hidden';
  clearBtn.innerHTML = '<span class="material-icons text-base">close</span>';
  clearBtn.title = 'Effacer';

  // Afficher/masquer le bouton selon si le champ est rempli
  const toggleClearBtn = () => {
    if (textarea.value.trim()) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  };

  textarea.addEventListener('input', toggleClearBtn);
  textarea.addEventListener('change', toggleClearBtn);

  // Effacer le champ au clic
  clearBtn.addEventListener('click', () => {
    textarea.value = '';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    clearBtn.classList.add('hidden');
    textarea.focus();
  });

  wrapper.appendChild(textarea);
  wrapper.appendChild(clearBtn);

  // Vérifier initialement si le champ a une valeur
  toggleClearBtn();

  return wrapper;
}

/**
 * Créer un champ input avec icône
 * @param {string} key - Clé du champ
 * @param {Object} config - Configuration du champ
 * @returns {HTMLElement}
 */
function createInputField(key, config) {
  const wrapper = document.createElement('div');
  wrapper.className = 'relative';

  // Icône à gauche (optionnelle)
  if (config.icon) {
    const icon = document.createElement('span');
    icon.className = 'material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-base pointer-events-none';
    icon.textContent = config.icon;
    wrapper.appendChild(icon);
  }

  const input = document.createElement('input');
  input.id = key;
  input.type = config.type === 'email' ? 'email' : 'text';
  input.placeholder = config.placeholder || config.label;
  input.className = config.icon ? 'md3-input w-full p-2.5 pl-10 pr-10 text-sm' : 'md3-input w-full p-2.5 pr-10 text-sm';
  input.required = config.required || false;
  if (config.default) input.value = config.default;

  // Variable pour savoir si on est en train d'effacer via le bouton
  let isClearing = false;

  // Validation spéciale pour le champ statutDestinataire
  if (key === 'statutDestinataire') {
    input.addEventListener('input', (e) => {
      const value = e.target.value.toLowerCase();
      // Vérifier si le texte contient " le " ou " la " (avec espaces) ou commence par "le " ou "la "
      if (value.match(/\b(le|la)\b/)) {
        e.target.setCustomValidity('Les mots "le" ou "la" ne sont pas autorisés dans le statut');
        e.target.style.borderColor = '#c4232d';
      } else {
        e.target.setCustomValidity('');
        e.target.style.borderColor = '';
      }
    });

    input.addEventListener('blur', (e) => {
      // Ne pas afficher l'alerte si on est en train d'effacer
      if (isClearing) {
        isClearing = false;
        return;
      }

      const value = e.target.value.toLowerCase();
      if (value.match(/\b(le|la)\b/)) {
        alert('⚠️ Les mots "le" ou "la" ne sont pas autorisés dans le statut. Utilisez directement le titre (ex: "Directeur" au lieu de "le Directeur")');
      }
    });
  }

  // Bouton pour effacer le champ
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors hidden';
  clearBtn.innerHTML = '<span class="material-icons text-base">close</span>';
  clearBtn.title = 'Effacer';

  // Afficher/masquer le bouton selon si le champ est rempli
  const toggleClearBtn = () => {
    if (input.value.trim()) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  };

  input.addEventListener('input', toggleClearBtn);
  input.addEventListener('change', toggleClearBtn);

  // Effacer le champ au clic
  clearBtn.addEventListener('click', () => {
    // Marquer qu'on est en train d'effacer pour éviter l'alerte de validation
    if (key === 'statutDestinataire') {
      isClearing = true;
    }

    input.value = '';

    // Réinitialiser la validation
    input.setCustomValidity('');
    input.style.borderColor = '';

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    clearBtn.classList.add('hidden');
    input.focus();
  });

  wrapper.appendChild(input);
  wrapper.appendChild(clearBtn);

  // Vérifier initialement si le champ a une valeur
  toggleClearBtn();

  return wrapper;
}

/**
 * Générer les champs dynamiquement selon le template sélectionné
 * @param {string} templateKey - Clé du template
 */
export function generateFields(templateKey) {
  const variablesConfig = getVariablesConfig();
  if (!variablesConfig) return;
  
  setCurrentTemplate(templateKey);
  const template = variablesConfig.templates[templateKey];
  if (!template) return;
  
  // Vider les conteneurs de champs
  const coordonneesFields = getElement(CONFIG.SELECTORS.coordonneesFields);
  const contenuFields = getElement(CONFIG.SELECTORS.contenuFields);
  const expediteurFields = getElement(CONFIG.SELECTORS.expediteurFields);
  
  if (coordonneesFields) coordonneesFields.innerHTML = '';
  if (contenuFields) contenuFields.innerHTML = '';
  if (expediteurFields) expediteurFields.innerHTML = '';
  
  // Générer les champs de coordonnées
  CONFIG.FIELD_ORDER.coordonnees.forEach(key => {
    const variable = variablesConfig.variables_communes[key];
    if (variable && variable.type !== 'auto') {
      const field = createField(key, variable);
      if (field && coordonneesFields) coordonneesFields.appendChild(field);
    }
  });

  // Générer les champs communs de contenu (ex: codeDocument)
  if (CONFIG.FIELD_ORDER.contenu) {
    CONFIG.FIELD_ORDER.contenu.forEach(key => {
      const variable = variablesConfig.variables_communes[key];
      if (variable && variable.type !== 'auto') {
        const field = createField(key, variable);
        if (field && contenuFields) contenuFields.appendChild(field);
      }
    });
  }

  // Générer les champs spécifiques au template
  if (template.variables_specifiques) {
    Object.keys(template.variables_specifiques).forEach(key => {
      const variable = template.variables_specifiques[key];
      const field = createField(key, variable);
      if (field && contenuFields) contenuFields.appendChild(field);
    });
  }

  // Générer les champs d'expéditeur
  CONFIG.FIELD_ORDER.expediteur.forEach(key => {
    const variable = variablesConfig.variables_communes[key];
    if (variable && variable.type !== 'auto') {
      const field = createField(key, variable);
      if (field && expediteurFields) expediteurFields.appendChild(field);
    }
  });
}

