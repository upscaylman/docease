/**
 * Données de test pour remplir le formulaire
 */

import { CONFIG, getElement } from '../core/config.js';
import { getVariablesConfig } from '../core/state.js';
import { generateFields } from '../components/fields.js';
import { addEmail } from '../components/emailChips.js';
import { clearEmails } from '../core/state.js';

/**
 * Données de test
 */
const TEST_DATA = {
  entreprise: ['ACME Corp', 'TechCo Industries', 'Solutions SARL', 'Métallurgie SA'],
  civiliteDestinataire: ['Monsieur', 'Madame'],
  nomDestinataire: ['Dupont', 'Martin', 'Bernard', 'Bouvier'],
  statutDestinataire: ['Président', 'Directeur', 'Responsable RH', 'Chef de service'],
  batiment: ['Bâtiment A', 'Bâtiment B', 'Tour Nord', 'Annexe'],
  adresse: ['82 quai de la Loire', '45 Avenue des Champs', '78 Boulevard Saint-Michel', '12 Place de la République'],
  cpVille: ['75001 Paris', '69002 Lyon', '13001 Marseille', '44000 Nantes'],
  emailDestinataire: ['destinataire@exemple.com', 'contact@entreprise.fr', 'direction@societe.com'],
  codeDocument: () => 'DOC-2025-' + String(Math.floor(Math.random() * 100) + 1).padStart(3, '0'),
  numeroCourrier: () => '2025-' + String(Math.floor(Math.random() * 100) + 1).padStart(3, '0'),
  civiliteRemplace: ['Monsieur', 'Madame'],
  nomRemplace: ['Durand', 'Petit', 'Robert', 'Moreau'],
  civiliteDelegue: ['Monsieur', 'Madame'],
  nomDelegue: ['Lefebvre', 'Girard', 'Rousseau', 'Leroy'],
  emailDelegue: ['lefebvre@example.com', 'girard@example.com', 'rousseau@example.com'],
  signatureExp: ['Bruno REYNES', 'Eric KELLER', 'Nathalie CAPART', 'Olivier LEFEBVRE'],
  objet: ['Négociation accord temps de travail', 'Accord sur les salaires', 'Conditions de travail'],
  emails: ['epheandrill@gmail.com', 'bouvier.jul@gmail.com']
};

/**
 * Obtenir une valeur aléatoire depuis un tableau ou une fonction
 * @param {Array|Function} source - Source de données
 * @returns {*}
 */
function getRandomValue(source) {
  if (typeof source === 'function') {
    return source();
  }
  return source[Math.floor(Math.random() * source.length)];
}

/**
 * Remplir le formulaire avec des données de test
 */
export function fillTestData() {
  const templateSelect = getElement(CONFIG.SELECTORS.templateSelect);
  const variablesConfig = getVariablesConfig();
  
  // Sélectionner un template aléatoire si pas déjà sélectionné
  if (templateSelect && !templateSelect.value && variablesConfig) {
    const templates = Object.keys(variablesConfig.templates);
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    templateSelect.value = randomTemplate;
    
    // Déclencher l'événement change pour générer les champs
    const event = new Event('change', { bubbles: true });
    templateSelect.dispatchEvent(event);
    
    // Attendre que les champs soient générés
    setTimeout(() => {
      fillFieldsWithTestData();
    }, 100);
  } else {
    fillFieldsWithTestData();
  }
}

/**
 * Remplir les champs avec des données de test
 */
function fillFieldsWithTestData() {
  // Remplir tous les champs dynamiques
  Object.keys(TEST_DATA).forEach(key => {
    if (key === 'emails') return; // Géré séparément

    const field = getElement(`#${key}`);
    if (field) {
      field.value = getRandomValue(TEST_DATA[key]);
    }
  });

  // Remplir le champ destinataires caché avec les emails de test
  // (pour que le modal de partage puisse les utiliser)
  const destinatairesInput = getElement(CONFIG.SELECTORS.destinatairesHidden);
  if (destinatairesInput) {
    destinatairesInput.value = TEST_DATA.emails.join(', ');
  }

  // Afficher un message pour informer l'utilisateur
  console.log('✅ Données de test remplies ! Pour envoyer par email, cliquez sur "Partager" et les emails de test seront pré-remplis.');

  // Note: Les emails ne sont plus affichés dans le formulaire principal
  // Ils seront affichés dans le modal de partage quand l'utilisateur clique sur "Partager"
}

/**
 * Initialiser le bouton de remplissage avec données de test
 */
export function initTestDataButton() {
  const fillTestDataBtn = getElement(CONFIG.SELECTORS.fillTestDataBtn);
  
  if (fillTestDataBtn) {
    fillTestDataBtn.addEventListener('click', fillTestData);
  }
}

