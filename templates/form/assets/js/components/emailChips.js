/**
 * Gestion des chips d'emails
 */

import { CONFIG, getElement } from '../core/config.js';
import { addEmail as addEmailToState, removeEmail as removeEmailFromState, getEmails } from '../core/state.js';
import { checkRequiredFields } from '../utils/validation.js';

/**
 * Créer un chip d'email
 * @param {string} email - Email à afficher
 * @returns {HTMLElement}
 */
export function createChip(email) {
  const chip = document.createElement('div');
  chip.className = 'email-chip flex items-center gap-1.5 bg-[#E8DEF8] text-[#21005D] px-3 py-1.5 rounded-full text-sm font-medium elevation-1';
  chip.innerHTML = `
    <span class="material-icons text-base">email</span>
    <span>${email}</span>
    <button type="button" class="ml-1 flex items-center justify-center text-[#0072ff] hover:text-[#21005D] transition-colors">
      <span class="material-icons" style="font-size: 14px;">close</span>
    </button>
  `;
  
  chip.querySelector('button').addEventListener('click', () => {
    if (removeEmailFromState(email)) {
      chip.remove();
      updateHiddenField();
    }
  });
  
  return chip;
}

/**
 * Mettre à jour le champ caché avec la liste des emails
 */
export function updateHiddenField() {
  const destinatairesHidden = getElement(CONFIG.SELECTORS.destinatairesHidden);
  if (destinatairesHidden) {
    destinatairesHidden.value = getEmails().join(', ');
  }
  checkRequiredFields();
}

/**
 * Ajouter un email
 * @param {string} email - Email à ajouter
 * @returns {boolean} - True si ajouté, false sinon
 */
export function addEmail(email) {
  email = email.trim();
  if (addEmailToState(email)) {
    const emailContainer = getElement(CONFIG.SELECTORS.emailContainer);
    const emailInput = getElement(CONFIG.SELECTORS.emailInput);
    
    if (emailContainer && emailInput) {
      const chip = createChip(email);
      emailContainer.insertBefore(chip, emailInput);
      updateHiddenField();
      return true;
    }
  }
  return false;
}

/**
 * Initialiser la gestion des emails
 */
export function initEmailChips() {
  const emailInput = getElement(CONFIG.SELECTORS.emailInput);
  const emailContainer = getElement(CONFIG.SELECTORS.emailContainer);
  
  if (!emailInput || !emailContainer) return;
  
  // Gérer l'input (virgule, point-virgule, espace)
  emailInput.addEventListener('input', (e) => {
    const value = e.target.value;
    if (value.includes(',') || value.includes(';') || value.includes(' ')) {
      const parts = value.split(/[,;\s]+/);
      parts.forEach(part => {
        if (part.trim()) {
          addEmail(part);
        }
      });
      emailInput.value = '';
    }
  });
  
  // Gérer la touche Backspace
  emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && emailInput.value === '') {
      const emails = getEmails();
      if (emails.length > 0) {
        const lastEmail = emails[emails.length - 1];
        removeEmailFromState(lastEmail);
        
        const chips = emailContainer.querySelectorAll('.email-chip');
        if (chips.length > 0) {
          chips[chips.length - 1].remove();
        }
        updateHiddenField();
      }
    }
    
    // Gérer la touche Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      if (emailInput.value.trim()) {
        addEmail(emailInput.value);
        emailInput.value = '';
      }
    }
  });
  
  // Focus sur l'input quand on clique sur le conteneur
  emailContainer.addEventListener('click', () => {
    emailInput.focus();
  });
}

