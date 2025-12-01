/**
 * Configuration globale de l'application React
 * Contient les URLs des webhooks n8n et autres constantes
 */

// Récupérer les URLs depuis les variables d'environnement ou utiliser les valeurs par défaut
const getWebhookUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).ENV?.WEBHOOK_URL) {
    return (window as any).ENV.WEBHOOK_URL;
  }
  return import.meta.env.VITE_WEBHOOK_URL || 'https://dee-wakeful-succulently.ngrok-free.dev/webhook/7f72ac69-35b7-4771-a5c6-7acb18947254';
};

const getWebhookEmailUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).ENV?.WEBHOOK_EMAIL_URL) {
    return (window as any).ENV.WEBHOOK_EMAIL_URL;
  }
  return import.meta.env.VITE_WEBHOOK_EMAIL_URL || 'https://dee-wakeful-succulently.ngrok-free.dev/webhook/1ee6e745-fc31-4fd8-bc59-531bd4a69997';
};

const getWebhookPdfConvertUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).ENV?.WEBHOOK_PDF_CONVERT_URL) {
    return (window as any).ENV.WEBHOOK_PDF_CONVERT_URL;
  }
  return import.meta.env.VITE_WEBHOOK_PDF_CONVERT_URL || 'https://dee-wakeful-succulently.ngrok-free.dev/api/convert-pdf';
};

export const CONFIG = {
  // URLs des webhooks n8n
  WEBHOOK_URL: getWebhookUrl(),
  WEBHOOK_EMAIL_URL: getWebhookEmailUrl(),
  WEBHOOK_PDF_CONVERT_URL: getWebhookPdfConvertUrl(),
  
  // Chemins
  VARIABLES_CONFIG_PATH: '/config/variables.json',
  
  // Timeouts
  REQUEST_TIMEOUT: 120000, // 2 minutes
};

/**
 * Créer les headers pour les requêtes HTTP
 */
export const createHeaders = (url: string, additionalHeaders: Record<string, string> = {}): HeadersInit => {
  const headers: Record<string, string> = {
    ...additionalHeaders
  };

  // Ajouter le header ngrok si nécessaire
  if (url.includes('ngrok')) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  return headers;
};

