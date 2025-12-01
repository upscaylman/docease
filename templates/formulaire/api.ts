/**
 * API pour communiquer avec les webhooks n8n
 */

import { CONFIG, createHeaders } from './config';
import {
  FormData,
  DocumentGenerationResult,
  PdfConversionResult,
  EmailSendResult
} from './types';
import { MIME_TYPES } from './constants/ui';

/**
 * Convertir base64 en Blob
 */
export const base64ToBlob = (
  base64: string,
  mimeType: string = MIME_TYPES.word
): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array<number>(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

/**
 * Télécharger un fichier depuis un blob
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Générer un document Word via le webhook n8n
 */
export const generateWordDocument = async (data: FormData): Promise<DocumentGenerationResult> => {
  try {
    console.log('Génération du Word via webhook n8n:', data);

    const response = await fetch(CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: createHeaders(CONFIG.WEBHOOK_URL, {
        'Content-Type': MIME_TYPES.json,
      }),
      body: JSON.stringify(data),
      mode: 'cors', // Explicitement demander CORS
    });

    if (!response.ok) {
      throw new Error(`Erreur serveur ${response.status}: ${response.statusText}`);
    }

    const result = await response.json() as { data?: string; wordBase64?: string };
    console.log('Document Word généré avec succès');

    return {
      success: true,
      data: result.data || result.wordBase64 || ''
    };
  } catch (error) {
    console.error('Erreur génération Word:', error);

    // Message d'erreur plus explicite pour CORS
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Erreur de connexion au serveur. Vérifiez que n8n est accessible et que CORS est configuré correctement.');
    }

    throw error;
  }
};

/**
 * Convertir un document Word en PDF
 */
export const convertWordToPdf = async (
  wordBase64: string,
  filename: string = 'document'
): Promise<PdfConversionResult> => {
  try {
    console.log('🔄 Conversion Word -> PDF...');

    const response = await fetch(CONFIG.WEBHOOK_PDF_CONVERT_URL, {
      method: 'POST',
      headers: createHeaders(CONFIG.WEBHOOK_PDF_CONVERT_URL, { 'Content-Type': MIME_TYPES.json }),
      body: JSON.stringify({
        wordBase64,
        filename
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur serveur ${response.status}: ${errorText}`);
    }

    const result = await response.json() as { pdfBase64?: string };

    if (!result.pdfBase64) {
      throw new Error('Pas de PDF dans la réponse');
    }

    const pdfBlob = base64ToBlob(result.pdfBase64, MIME_TYPES.pdf);
    console.log('✅ PDF généré avec succès');

    return {
      success: true,
      blob: pdfBlob,
      filename: `${filename}.pdf`
    };
  } catch (error) {
    console.error('❌ Erreur conversion PDF:', error);
    throw error;
  }
};

/**
 * Envoyer un email avec le document PDF
 */
export const sendEmailWithPdf = async (
  data: FormData,
  pdfBase64: string,
  customMessage?: string
): Promise<EmailSendResult> => {
  try {
    console.log('=== ENVOI EMAIL AVEC PDF ===');

    interface EmailPayload extends FormData {
      pdfFile: string;
      customEmailMessage?: string;
    }

    const payload: EmailPayload = {
      ...data,
      pdfFile: pdfBase64
    };

    if (customMessage) {
      payload.customEmailMessage = customMessage;
    }

    const response = await fetch(CONFIG.WEBHOOK_EMAIL_URL, {
      method: 'POST',
      headers: createHeaders(CONFIG.WEBHOOK_EMAIL_URL, { 'Content-Type': MIME_TYPES.json }),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}`);
    }

    console.log('✅ Email envoyé avec succès');
    return {
      success: true,
      message: 'Email envoyé avec succès'
    };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    throw error;
  }
};

/**
 * Envoyer un email avec le document Word
 */
export const sendEmailWithWord = async (
  data: FormData,
  wordBase64: string,
  customMessage?: string
): Promise<EmailSendResult> => {
  try {
    console.log('=== ENVOI EMAIL AVEC WORD ===');

    interface EmailPayload extends FormData {
      wordfile: string;
      customEmailMessage?: string;
    }

    const payload: EmailPayload = {
      ...data,
      wordfile: wordBase64
    };

    if (customMessage) {
      payload.customEmailMessage = customMessage;
    }

    const response = await fetch(CONFIG.WEBHOOK_EMAIL_URL, {
      method: 'POST',
      headers: createHeaders(CONFIG.WEBHOOK_EMAIL_URL, { 'Content-Type': MIME_TYPES.json }),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}`);
    }

    console.log('✅ Email envoyé avec succès');
    return {
      success: true,
      message: 'Email envoyé avec succès'
    };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    throw error;
  }
};

