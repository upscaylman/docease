/**
 * Gestion de la navigation par onglets
 */

import { getElements } from '../core/config.js';
import { setActiveTab, getActiveTab, setStepCompleted, isStepCompleted } from '../core/state.js';

const TABS = ['coordonnees', 'contenu', 'expediteur'];

/**
 * Changer d'onglet
 * @param {string} tabName - Nom de l'onglet à activer
 */
export function switchTab(tabName) {
  if (!TABS.includes(tabName)) {
    console.warn('Onglet invalide:', tabName);
    return;
  }
  
  console.log('switchTab appelé pour:', tabName);
  setActiveTab(tabName);
  const currentIndex = TABS.indexOf(tabName);
  
  // Mettre à jour les boutons d'onglets
  const tabButtons = getElements('.tab-button');
  tabButtons.forEach(btn => {
    btn.classList.remove('active');
    const indicator = btn.querySelector('.step-indicator');
    if (indicator) {
      indicator.classList.remove('active');
    }
  });
  
  // Activer le bouton de l'onglet actuel
  const activeBtn = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
    const indicator = activeBtn.querySelector('.step-indicator');
    if (indicator) {
      indicator.classList.add('active');
    }
  }
  
  // S'assurer que le conteneur est visible
  const tabsContainer = document.getElementById('tabsContainer');
  if (tabsContainer && tabsContainer.style.display === 'none') {
    tabsContainer.style.display = 'flex';
    console.log('Conteneur tabsContainer affiché');
  }
  
  // Mettre à jour les sections
  const tabSections = getElements('.tab-section');
  tabSections.forEach(section => {
    section.classList.remove('active');
    section.style.display = 'none'; // Forcer le masquage
  });
  
  const activeSection = document.getElementById(`tab-${tabName}`);
  if (activeSection) {
    activeSection.classList.add('active');
    activeSection.style.display = 'block'; // Forcer l'affichage
    console.log('Section activée:', activeSection.id);
  } else {
    console.error('Section non trouvée:', `tab-${tabName}`);
  }
  
  // Mettre à jour les boutons flottants
  const floatingButtons = document.querySelectorAll('.tab-button-floating');
  floatingButtons.forEach(btn => {
    const btnTab = btn.dataset.tab;
    if (btnTab === tabName) {
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
  
  // Mettre à jour les indicateurs d'étapes complétées
  updateStepIndicators();
  
  // Mettre à jour les boutons du stepper
  // We need to call updateStepperButtons from app.js
  // This is a bit hacky but it works for now
  setTimeout(() => {
    const event = new CustomEvent('tabChanged');
    document.dispatchEvent(event);
  }, 0);
}

/**
 * Aller à l'onglet suivant
 */
export function nextTab() {
  const currentTab = getActiveTab();
  const currentIndex = TABS.indexOf(currentTab);
  
  if (currentIndex < TABS.length - 1) {
    // Marquer l'étape actuelle comme complétée
    setStepCompleted(currentTab, true);
    
    // Passer à l'onglet suivant
    switchTab(TABS[currentIndex + 1]);
  }
}

/**
 * Aller à l'onglet précédent
 */
export function previousTab() {
  const currentTab = getActiveTab();
  const currentIndex = TABS.indexOf(currentTab);
  
  if (currentIndex > 0) {
    switchTab(TABS[currentIndex - 1]);
  }
}

/**
 * Mettre à jour les indicateurs d'étapes
 */
export function updateStepIndicators() {
  TABS.forEach((tab, index) => {
    const btn = document.querySelector(`.tab-button[data-tab="${tab}"]`);
    if (!btn) return;
    
    const indicator = btn.querySelector('.step-indicator');
    if (!indicator) return;
    
    // Retirer les classes existantes
    indicator.classList.remove('completed', 'active');
    
    // Ajouter la classe appropriée
    if (isStepCompleted(tab)) {
      indicator.classList.add('completed');
    } else if (tab === getActiveTab()) {
      indicator.classList.add('active');
    }
  });
}

/**
 * Vérifier si tous les champs requis de l'onglet actuel sont remplis
 * @returns {boolean}
 */
export function isCurrentTabValid() {
  const currentTab = getActiveTab();
  const section = document.getElementById(`tab-${currentTab}`);
  
  if (!section) return false;
  
  const requiredFields = section.querySelectorAll('[required]');
  let allFilled = true;
  
  requiredFields.forEach(field => {
    if (!field.value || field.value.trim() === '') {
      allFilled = false;
    }
  });
  
  return allFilled;
}

/**
 * Initialiser la navigation par onglets
 */
export function initTabs() {
  // Ajouter les événements de clic sur les boutons d'onglets
  const tabButtons = getElements('.tab-button');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      if (tabName) {
        switchTab(tabName);
      }
    });
  });
  
  // Initialiser l'onglet actif - s'assurer que toutes les sections sont cachées sauf la première
  const tabSections = getElements('.tab-section');
  tabSections.forEach(section => {
    section.classList.remove('active');
    section.style.display = 'none';
  });
  
  // Activer la première section
  const firstSection = document.getElementById('tab-coordonnees');
  if (firstSection) {
    firstSection.classList.add('active');
    firstSection.style.display = 'block';
  }
  
  // Initialiser l'onglet actif
  switchTab('coordonnees');
}

