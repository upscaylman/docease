/**
 * Système de notifications toast
 * Affiche des notifications élégantes avec des icônes Material Icons
 */

/**
 * Types de toast disponibles
 */
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Configuration par défaut
 */
const DEFAULT_CONFIG = {
  duration: 4000, // 4 secondes
  position: 'top-right', // top-right, top-left, bottom-right, bottom-left
  maxToasts: 5 // Nombre maximum de toasts affichés simultanément
};

/**
 * Mapping des types vers les icônes Material Icons
 */
const TYPE_ICONS = {
  [TOAST_TYPES.SUCCESS]: 'check_circle',
  [TOAST_TYPES.ERROR]: 'error',
  [TOAST_TYPES.WARNING]: 'warning',
  [TOAST_TYPES.INFO]: 'info'
};

/**
 * Mapping des types vers les couleurs
 */
const TYPE_COLORS = {
  [TOAST_TYPES.SUCCESS]: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    icon: 'text-green-600',
    text: 'text-green-800'
  },
  [TOAST_TYPES.ERROR]: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    icon: 'text-red-600',
    text: 'text-red-800'
  },
  [TOAST_TYPES.WARNING]: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-500',
    icon: 'text-yellow-600',
    text: 'text-yellow-800'
  },
  [TOAST_TYPES.INFO]: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    icon: 'text-blue-600',
    text: 'text-blue-800'
  }
};

/**
 * Conteneur des toasts
 */
let toastContainer = null;

/**
 * Initialiser le conteneur de toasts
 */
function initToastContainer() {
  if (toastContainer) return;

  toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.className = 'fixed z-[9999] flex flex-col gap-3';
  
  // Position selon la configuration
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };
  
  toastContainer.className += ` ${positionClasses[DEFAULT_CONFIG.position] || positionClasses['top-right']}`;
  
  document.body.appendChild(toastContainer);
}

/**
 * Supprimer un toast
 * @param {HTMLElement} toastElement - Élément toast à supprimer
 */
function removeToast(toastElement) {
  if (!toastElement || !toastContainer) return;
  
  toastElement.style.opacity = '0';
  toastElement.style.transform = 'translateX(100%)';
  
  setTimeout(() => {
    if (toastElement.parentNode) {
      toastElement.parentNode.removeChild(toastElement);
    }
  }, 300);
}

/**
 * Afficher un toast
 * @param {string} message - Message à afficher
 * @param {string} type - Type de toast (success, error, warning, info)
 * @param {Object} options - Options supplémentaires (duration, icon)
 */
export function showToast(message, type = TOAST_TYPES.INFO, options = {}) {
  // Initialiser le conteneur si nécessaire
  initToastContainer();
  
  // Vérifier le nombre maximum de toasts
  const existingToasts = toastContainer.querySelectorAll('.toast-item');
  if (existingToasts.length >= DEFAULT_CONFIG.maxToasts) {
    // Supprimer le plus ancien
    removeToast(existingToasts[0]);
  }
  
  // Créer l'élément toast
  const toast = document.createElement('div');
  toast.className = 'toast-item md3-card elevation-3 flex items-start gap-3 p-4 min-w-[300px] max-w-[500px] transition-all duration-300 transform translate-x-0 opacity-0';
  
  // Obtenir les couleurs selon le type
  const colors = TYPE_COLORS[type] || TYPE_COLORS[TOAST_TYPES.INFO];
  
  // Appliquer les styles
  toast.className += ` ${colors.bg} ${colors.border} border-l-4`;
  
  // Icône
  const iconName = options.icon || TYPE_ICONS[type] || TYPE_ICONS[TOAST_TYPES.INFO];
  const icon = document.createElement('span');
  icon.className = `material-icons ${colors.icon} flex-shrink-0`;
  icon.textContent = iconName;
  icon.style.fontSize = '24px';
  
  // Message
  const messageDiv = document.createElement('div');
  messageDiv.className = `flex-1 ${colors.text}`;
  messageDiv.textContent = message;
  messageDiv.style.fontSize = '14px';
  messageDiv.style.lineHeight = '1.5';
  
  // Bouton de fermeture
  const closeBtn = document.createElement('button');
  closeBtn.className = 'flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors';
  closeBtn.innerHTML = '<span class="material-icons text-lg">close</span>';
  closeBtn.addEventListener('click', () => removeToast(toast));
  closeBtn.setAttribute('aria-label', 'Fermer');
  
  // Assembler le toast
  toast.appendChild(icon);
  toast.appendChild(messageDiv);
  toast.appendChild(closeBtn);
  
  // Ajouter au conteneur
  toastContainer.appendChild(toast);
  
  // Animation d'entrée
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  // Durée d'affichage
  const duration = options.duration || DEFAULT_CONFIG.duration;
  if (duration > 0) {
    setTimeout(() => {
      removeToast(toast);
    }, duration);
  }
  
  return toast;
}

/**
 * Afficher un toast de succès
 * @param {string} message - Message à afficher
 * @param {Object} options - Options supplémentaires
 */
export function showSuccessToast(message, options = {}) {
  return showToast(message, TOAST_TYPES.SUCCESS, options);
}

/**
 * Afficher un toast d'erreur
 * @param {string} message - Message à afficher
 * @param {Object} options - Options supplémentaires
 */
export function showErrorToast(message, options = {}) {
  return showToast(message, TOAST_TYPES.ERROR, options);
}

/**
 * Afficher un toast d'avertissement
 * @param {string} message - Message à afficher
 * @param {Object} options - Options supplémentaires
 */
export function showWarningToast(message, options = {}) {
  return showToast(message, TOAST_TYPES.WARNING, options);
}

/**
 * Afficher un toast d'information
 * @param {string} message - Message à afficher
 * @param {Object} options - Options supplémentaires
 */
export function showInfoToast(message, options = {}) {
  return showToast(message, TOAST_TYPES.INFO, options);
}

