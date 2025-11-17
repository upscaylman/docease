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

  // Validation spéciale pour texteIa : minimum 10 caractères pour déclencher l'IA
  if (key === 'texteIa') {
    textarea.minLength = 10;
    textarea.title = 'Minimum 10 caractères requis pour déclencher l\'IA';
  }

  // Bouton pour effacer le champ
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'absolute right-2 top-3 text-gray-400 hover:text-red-500 transition-colors hidden';
  clearBtn.innerHTML = '<span class="material-icons text-base">close</span>';
  clearBtn.title = 'Effacer';

  // Bouton "crayon magique" pour améliorer le texte avec l'IA (uniquement pour texteIa)
  let magicBtn = null;
  if (key === 'texteIa') {
    magicBtn = document.createElement('button');
    magicBtn.type = 'button';
    magicBtn.className = 'absolute right-10 top-3 text-gray-400 hover:text-purple-500 transition-colors hidden';
    magicBtn.innerHTML = '<span class="material-icons text-base">auto_fix_high</span>';
    magicBtn.title = 'Améliorer avec l\'IA';
  }

  // Compteur de caractères pour texteIa
  let charCounter = null;
  if (key === 'texteIa') {
    charCounter = document.createElement('div');
    charCounter.className = 'text-xs text-gray-500 mt-1';
    charCounter.innerHTML = '<span id="charCount">0</span> / 10 caractères minimum (pour déclencher l\'IA)';
  }

  // Afficher/masquer les boutons selon si le champ est rempli
  const toggleClearBtn = () => {
    if (textarea.value.trim()) {
      clearBtn.classList.remove('hidden');
      if (magicBtn) {
        magicBtn.classList.remove('hidden');
      }
    } else {
      clearBtn.classList.add('hidden');
      if (magicBtn) {
        magicBtn.classList.add('hidden');
      }
    }

    // Mettre à jour le compteur de caractères
    if (charCounter) {
      const count = textarea.value.length;
      const countSpan = charCounter.querySelector('#charCount');
      if (countSpan) {
        countSpan.textContent = count;
        // Changer la couleur selon si le minimum est atteint
        if (count >= 10) {
          countSpan.style.color = '#16a34a'; // Vert
          countSpan.style.fontWeight = 'bold';
        } else {
          countSpan.style.color = '#c4232d'; // Rouge FO
          countSpan.style.fontWeight = 'bold';
        }
      }
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

  // Améliorer le texte avec l'IA au clic
  if (magicBtn) {
    magicBtn.addEventListener('click', async () => {
      const originalText = textarea.value.trim();
      if (!originalText || originalText.length < 10) {
        alert('Veuillez saisir au moins 10 caractères pour utiliser l\'IA');
        return;
      }

      // Désactiver le bouton pendant le traitement
      magicBtn.disabled = true;
      magicBtn.innerHTML = '<span class="material-icons text-base animate-spin">autorenew</span>';
      magicBtn.title = 'Amélioration en cours...';

      try {
        // Appeler Ollama directement pour améliorer le texte
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemma2:2b',
            prompt: `Tu es un assistant professionnel. Transforme ce texte simple en un texte professionnel et formel pour un document administratif. Garde le sens original mais améliore la formulation.\n\nTexte original: ${originalText}\n\nTexte amélioré:`,
            stream: false
          })
        });

        if (!response.ok) {
          throw new Error('Erreur lors de l\'appel à l\'IA');
        }

        const data = await response.json();
        const improvedText = data.response.trim();

        // Remplacer le texte dans le textarea
        textarea.value = improvedText;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));

        // Afficher un message de succès via toast
        const { showSuccessToast } = await import('../utils/toast.js');
        showSuccessToast('Texte amélioré avec l\'IA !');

      } catch (error) {
        console.error('Erreur IA:', error);
        const { showErrorToast } = await import('../utils/toast.js');
        showErrorToast('Erreur lors de l\'amélioration du texte. Vérifiez qu\'Ollama est actif.');
      } finally {
        // Réactiver le bouton
        magicBtn.disabled = false;
        magicBtn.innerHTML = '<span class="material-icons text-base">auto_fix_high</span>';
        magicBtn.title = 'Améliorer avec l\'IA';
      }
    });
  }

  wrapper.appendChild(textarea);
  wrapper.appendChild(clearBtn);
  if (magicBtn) {
    wrapper.appendChild(magicBtn);
  }

  // Ajouter le compteur de caractères si présent
  if (charCounter) {
    wrapper.appendChild(charCounter);
  }

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

  // Si c'est le champ codeDocument, le rendre readonly et stylisé
  if (key === 'codeDocument') {
    input.readOnly = true;
    input.className += ' bg-gradient-to-r from-blue-50 to-gray-50 cursor-not-allowed font-mono text-blue-900';
    input.style.fontWeight = '600';
    input.style.letterSpacing = '0.5px';
  }

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
        alert('Les mots "le" ou "la" ne sont pas autorisés dans le statut. Utilisez directement le titre (ex: "Directeur" au lieu de "le Directeur")');
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
 * Extraire les initiales d'un nom (en tenant compte des traits d'union)
 * @param {string} fullName - Nom complet (ex: "Jean-Paul Sartre")
 * @returns {string} Initiales (ex: "JPS")
 */
function getInitials(fullName) {
  if (!fullName) return '';

  // Remplacer les traits d'union par des espaces pour séparer les prénoms composés
  const normalized = fullName.replace(/-/g, ' ').trim();

  // Extraire les initiales de chaque mot
  const initials = normalized
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase())
    .join('');

  return initials;
}

/**
 * Générer automatiquement le code document depuis signatureExp
 */
function setupCodeDocumentAutoGeneration() {
  const signatureExpField = document.getElementById('signatureExp');
  const codeDocumentField = document.getElementById('codeDocument');

  if (!signatureExpField || !codeDocumentField) return;

  // Générer le code au changement de signatureExp
  signatureExpField.addEventListener('change', () => {
    const initials = getInitials(signatureExpField.value);
    if (initials) {
      // Format: INITIALES-ANNEE-XXX
      const year = new Date().getFullYear();
      const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      codeDocumentField.value = `${initials}-${year}-${randomNum}`;

      console.log(`Code document généré: ${codeDocumentField.value}`);
    }
  });

  // Générer automatiquement si signatureExp a déjà une valeur
  if (signatureExpField.value) {
    signatureExpField.dispatchEvent(new Event('change'));
  }
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

  // Configurer la génération automatique du code document
  setTimeout(() => {
    setupCodeDocumentAutoGeneration();
  }, 100);
}

