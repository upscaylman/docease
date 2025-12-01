import React, { useState, useCallback } from 'react';
import { CONFIG } from '../config';

interface AITextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  objetValue?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

export const AITextarea: React.FC<AITextareaProps> = ({
  label,
  value,
  onChange,
  objetValue = '',
  placeholder,
  required,
  rows = 5
}) => {
  const [isImproving, setIsImproving] = useState(false);
  const [charCount, setCharCount] = useState(value.length);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setCharCount(newValue.length);
  }, [onChange]);

  const handleImproveText = useCallback(async () => {
    const originalText = value.trim();
    if (!originalText || originalText.length < 10) {
      alert('Veuillez saisir au moins 10 caractères pour utiliser l\'IA');
      return;
    }

    setIsImproving(true);

    try {
      // Construire le prompt
      let promptText = `Tu es un assistant professionnel. Écris un texte complet et professionnel pour un document administratif.\n\n`;
      if (objetValue) {
        promptText += `Objet du document : ${objetValue}\n\n`;
      }
      promptText += `Informations à utiliser : ${originalText}\n\n`;
      promptText += `Instructions :\n- Écris un texte complet et structuré (pas de suggestions ni de listes)\n- Le texte doit être en lien direct avec l'objet du document\n- Utilise un style formel et professionnel\n- Le texte doit être prêt à être utilisé tel quel dans le document\n\nTexte du document :`;

      // Détecter si on est en production
      const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

      let improvedText: string;

      if (isProduction) {
        // En production : utiliser le webhook n8n
        const response = await fetch(CONFIG.WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({
            action: 'improve-text',
            prompt: promptText,
            originalText: originalText,
            objet: objetValue
          })
        });

        if (!response.ok) {
          throw new Error('Erreur lors de l\'appel à l\'IA');
        }

        const data = await response.json();
        improvedText = data.improvedText || data.response || data.text || data.texteAmeliore || '';
      } else {
        // En développement local : appeler Ollama directement
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemma2:2b',
            prompt: promptText,
            stream: false,
            options: {
              num_predict: 1000,
              temperature: 0.5
            }
          })
        });

        if (!response.ok) {
          throw new Error('Erreur lors de l\'appel à l\'IA');
        }

        const data = await response.json();
        improvedText = data.response.trim();
      }

      if (!improvedText || improvedText.length === 0) {
        throw new Error('Réponse vide de l\'IA');
      }

      // Mettre à jour le texte
      onChange(improvedText);
      setCharCount(improvedText.length);

      // Afficher un message de succès
      console.log('✅ Texte amélioré avec l\'IA !');
    } catch (error) {
      console.error('Erreur IA:', error);
      alert('Erreur lors de l\'amélioration du texte : ' + (error as Error).message);
    } finally {
      setIsImproving(false);
    }
  }, [value, objetValue, onChange]);

  const handleClear = useCallback(() => {
    onChange('');
    setCharCount(0);
  }, [onChange]);

  const minCharsReached = charCount >= 10;

  return (
    <div className="relative group">
      <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
        {label}
        {required && <span style={{ color: 'rgb(196, 35, 45)' }}> *</span>}
      </label>
      <div className="relative">
        <textarea
          className="w-full bg-[#fdfbff] border-2 border-[#e7e0ec] text-[#1c1b1f] text-base rounded-2xl px-4 py-3 pr-24 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-[#a84383] focus:ring-4 focus:ring-[#a84383]/10 resize-y"
          placeholder={placeholder}
          required={required}
          rows={rows}
          value={value}
          onChange={handleChange}
          minLength={10}
          title="Minimum 10 caractères requis pour déclencher l'IA"
        />
        {/* Boutons */}
        {value && (
          <div className="absolute right-3 top-3 flex gap-1">
            {/* Bouton Améliorer avec IA */}
            <button
              type="button"
              onClick={handleImproveText}
              disabled={isImproving || !minCharsReached}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-purple-500 hover:bg-purple-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title={minCharsReached ? "Améliorer avec l'IA" : "Minimum 10 caractères requis"}
            >
              {isImproving ? (
                <span className="material-icons text-base animate-spin">autorenew</span>
              ) : (
                <span className="material-icons text-base">auto_fix_high</span>
              )}
            </button>
            {/* Bouton Effacer */}
            <button
              type="button"
              onClick={handleClear}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              title="Effacer"
            >
              <span className="material-icons text-base">close</span>
            </button>
          </div>
        )}
      </div>
      {/* Compteur de caractères */}
      <div className="text-xs mt-1 ml-1">
        <span className={`font-bold ${minCharsReached ? 'text-green-600' : 'text-red-600'}`}>
          {charCount}
        </span>
        <span className="text-gray-500"> / 10 caractères minimum (pour déclencher l'IA)</span>
      </div>
    </div>
  );
};

