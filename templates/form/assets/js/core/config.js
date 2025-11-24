/**
 * Configuration globale de l'application
 * Contient les constantes et la configuration
 */

// Récupérer les URLs depuis les variables globales (définies dans index.html)
// ou utiliser les valeurs par défaut pour le développement local
const getWebhookUrl = () => {
  if (typeof window !== 'undefined' && window.ENV && window.ENV.WEBHOOK_URL) {
    return window.ENV.WEBHOOK_URL;
  }
  return 'http://localhost:5678/webhook/7f72ac69-35b7-4771-a5c6-7acb18947254';
};

const getWebhookEmailUrl = () => {
  if (typeof window !== 'undefined' && window.ENV && window.ENV.WEBHOOK_EMAIL_URL) {
    return window.ENV.WEBHOOK_EMAIL_URL;
  }
  return 'http://localhost:5678/webhook/1ee6e745-fc31-4fd8-bc59-531bd4a69997';
};

export const CONFIG = {
  // URLs des webhooks - appel direct à n8n (pas via proxy pour éviter limite de taille)
  WEBHOOK_URL: getWebhookUrl(),
  WEBHOOK_EMAIL_URL: getWebhookEmailUrl(),
  
  // Chemins
  VARIABLES_CONFIG_PATH: '/config/variables.json',
  
  // Sélecteurs DOM
  SELECTORS: {
    form: '#docForm',
    message: '#message',
    templateSelect: '#template',
    dynamicFields: '#dynamicFields',
    emailInput: '#emailInput',
    emailContainer: '#emailContainer',
    destinatairesHidden: '#destinataires',
    previewBtn: '#previewBtn',
    previewModal: '#previewModal',
    previewContent: '#previewContent',
    closeModal: '#closeModal',
    closeModalBtn: '#closeModalBtn',
    sendEmailBtn: '#sendEmailBtn',
    downloadWordBtn: '#downloadWordBtn',
    fillTestDataBtn: '#fillTestData',
    wordViewerModal: '#wordViewerModal',
    wordViewerFrame: '#wordViewerFrame',
    wordViewerLoading: '#wordViewerLoading',
    closeWordViewer: '#closeWordViewer',
    closeWordViewerBtn: '#closeWordViewerBtn',
    tabsContainer: '#tabsContainer',
    coordonneesTab: '#coordonneesTab',
    contenuTab: '#contenuTab',
    expediteurTab: '#expediteurTab',
    coordonneesSection: '#coordonneesSection',
    contenuSection: '#contenuSection',
    expediteurSection: '#expediteurSection',
    coordonneesFields: '#coordonneesFields',
    contenuFields: '#contenuFields',
    expediteurFields: '#expediteurFields'
  },
  
  // Messages
  MESSAGES: {
    ERROR_LOAD_CONFIG: 'Impossible de charger la configuration',
    ERROR_EMPTY_RESPONSE: 'Empty response from server',
    ERROR_SELECT_TEMPLATE: 'Veuillez sélectionner un type de document',
    ERROR_GENERATION: 'Erreur lors de la génération',
    ERROR_SEND_EMAIL: 'Erreur lors de l\'envoi de l\'email',
    SUCCESS_DOWNLOAD: 'Document téléchargé ! Vous pouvez maintenant cliquer sur "Générer et envoyer" pour envoyer l\'email.',
    SUCCESS_EMAIL_SENT: 'Email envoyé avec succès !',
    GENERATING: 'Génération en cours...',
    SENDING: 'Envoi en cours...'
  },
  
  // Ordre des champs par section
  FIELD_ORDER: {
    coordonnees: [
      'entreprise',
      'civiliteDestinataire',
      'nomDestinataire',
      'statutDestinataire',
      'batiment',
      'adresse',
      'cpVille',
      'emailDestinataire'
    ],
    contenu: [
      'codeDocument'
    ],
    expediteur: [
      'signatureExp'
    ]
  },
  
  // Configuration des sections
  SECTIONS: {
    coordonnees: {
      id: 'coordonnees',
      title: 'Coordonnées',
      icon: 'location_on',
      color: 'blue',
      fieldsContainerId: 'coordonneesFields'
    },
    contenu: {
      id: 'contenu',
      title: 'Contenu de la demande',
      icon: 'edit_document',
      color: 'green',
      fieldsContainerId: 'contenuFields'
    },
    expediteur: {
      id: 'expediteur',
      title: 'Expéditeur',
      icon: 'person',
      color: 'purple',
      fieldsContainerId: 'expediteurFields'
    }
  }
};

/**
 * Obtenir un élément DOM par sélecteur
 * @param {string} selector - Sélecteur CSS
 * @returns {HTMLElement|null}
 */
export function getElement(selector) {
  return document.querySelector(selector);
}

/**
 * Obtenir tous les éléments DOM par sélecteur
 * @param {string} selector - Sélecteur CSS
 * @returns {NodeList}
 */
export function getElements(selector) {
  return document.querySelectorAll(selector);
}

