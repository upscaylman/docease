
import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { TEMPLATES, STEPS, FORM_FIELDS, TEMPLATE_SPECIFIC_FIELDS } from './constants';
import { StepType, FormData, FormField } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { FormStep } from './components/FormStep';
import { Button } from './components/Button';
import { generateWordDocument, convertWordToPdf, downloadBlob, base64ToBlob, sendEmailWithPdf } from './api';
import { Toast, useToast } from './components/Toast';
import { LoadingOverlay } from './components/Spinner';

// Lazy load des modals (chargés uniquement quand nécessaire)
const PreviewModal = lazy(() => import('./components/Modals').then(module => ({ default: module.PreviewModal })));
const ShareModal = lazy(() => import('./components/Modals').then(module => ({ default: module.ShareModal })));

const App: React.FC = () => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>('designation');
  const [formData, setFormData] = useState<FormData>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [generatedWord, setGeneratedWord] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Persistance des données par template (en mémoire uniquement, perdu à l'actualisation)
  const [templateDataStore, setTemplateDataStore] = useState<Record<string, FormData>>({});

  // Ordre personnalisé des champs par étape (pour le mode personnalisation)
  const [customFieldsOrder, setCustomFieldsOrder] = useState<Record<string, FormField[]>>({});

  // Modals state
  const [showPreview, setShowPreview] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // Customization mode (pour le template custom)
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Cache des documents générés par template (évite de régénérer si les données n'ont pas changé)
  const [documentCache, setDocumentCache] = useState<Record<string, { word: string; pdf: Blob; dataHash: string }>>({});

  // Toast hook
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Optimisation: mémoriser les valeurs calculées
  const currentStep = useMemo(() => STEPS[currentStepIdx], [currentStepIdx]);
  const isFirstStep = useMemo(() => currentStepIdx === 0, [currentStepIdx]);
  const isLastStep = useMemo(() => currentStepIdx === STEPS.length - 1, [currentStepIdx]);

  // Vérifier si le formulaire a des données
  const hasData = useMemo(() => Object.keys(formData).length > 0 && selectedTemplate !== null, [formData, selectedTemplate]);

  // Vérifier si tous les champs requis d'une étape sont remplis
  const isStepValid = useCallback((stepId: StepType): boolean => {
    const fields = customFieldsOrder[stepId] || FORM_FIELDS[stepId] || [];
    const requiredFields = fields.filter(field => field.required);

    return requiredFields.every(field => {
      const value = formData[field.id];
      return value !== undefined && value !== null && value.trim() !== '';
    });
  }, [formData, customFieldsOrder]);

  // Vérifier si tous les champs requis du formulaire sont remplis
  const areAllRequiredFieldsFilled = useMemo(() => {
    if (!selectedTemplate) return false;

    return STEPS.every(step => isStepValid(step.id as StepType));
  }, [selectedTemplate, isStepValid]);

  // Sauvegarder les données du template actuel avant de changer
  const saveCurrentTemplateData = (templateId: string, data: FormData) => {
    console.log('💾 Sauvegarde des données pour:', templateId, data);
    setTemplateDataStore(prev => ({
      ...prev,
      [templateId]: data
    }));
  };

  // Gérer le changement de template (sauvegarder avant de changer)
  const handleTemplateChange = useCallback((newTemplateId: string) => {
    // Sauvegarder les données du template actuel avant de changer
    if (selectedTemplate && Object.keys(formData).length > 0) {
      console.log('💾 Sauvegarde automatique avant changement de template');
      saveCurrentTemplateData(selectedTemplate, formData);
    }

    // Changer de template
    setSelectedTemplate(newTemplateId);
  }, [selectedTemplate, formData]);

  // Mettre à jour les champs du formulaire quand le template change
  useEffect(() => {
    if (selectedTemplate && TEMPLATE_SPECIFIC_FIELDS[selectedTemplate]) {
      // Ajouter les champs spécifiques au template dans l'étape "contenu"
      FORM_FIELDS.contenu = TEMPLATE_SPECIFIC_FIELDS[selectedTemplate];

      // Restaurer les données du nouveau template s'il y en a
      const savedData = templateDataStore[selectedTemplate];
      if (savedData && Object.keys(savedData).length > 0) {
        console.log('📂 Restauration des données pour:', selectedTemplate, savedData);
        setFormData(savedData);
      } else {
        console.log('🆕 Nouveau template, données vides');
        setFormData({});
      }

      setCurrentStepIdx(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate]);

  // Optimisation: mémoriser handleStepChange pour éviter les re-renders
  const handleStepChange = useCallback((idx: number) => {
    // Si on avance (idx > currentStepIdx), vérifier que l'étape actuelle est valide
    // SAUF si on est en mode personnalisation (builder) où on doit pouvoir naviguer librement
    if (idx > currentStepIdx && !isCustomizing) {
      const currentStepValid = isStepValid(currentStep.id as StepType);
      if (!currentStepValid) {
        showError('Veuillez remplir tous les champs obligatoires avant de continuer');
        return;
      }
    }

    setCurrentStepIdx(idx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStepIdx, currentStep, isStepValid, showError, isCustomizing]);

  // Fonction pour extraire les initiales d'un nom
  const getInitials = (fullName: string): string => {
    if (!fullName) return '';
    const normalized = fullName.replace(/-/g, ' ').trim();
    const initials = normalized
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
    return initials;
  };

  // Optimisation: mémoriser handleInputChange
  const handleInputChange = useCallback((key: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [key]: value };

      // Auto-génération du code document depuis signatureExp
      if (key === 'signatureExp' && value) {
        const initials = getInitials(value);
        if (initials) {
          const year = new Date().getFullYear();
          const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
          newData.codeDocument = `${initials}-${year}-${randomNum}`;
          // Auto-génération du numéro de recommandé pour le template designation
          if (selectedTemplate === 'designation') {
            newData.numeroCourrier = `${initials}-${year}-${randomNum}`;
          }
        }
      }

      // Sauvegarder automatiquement les données du template actuel
      if (selectedTemplate) {
        saveCurrentTemplateData(selectedTemplate, newData);
      }
      return newData;
    });
    // Invalider le cache quand les données changent
    if (selectedTemplate) {
      setDocumentCache(prev => {
        const newCache = { ...prev };
        delete newCache[selectedTemplate];
        return newCache;
      });
    }
  }, [selectedTemplate]);

  // Nettoyer les données du formulaire (remplacer undefined/null par des chaînes vides)
  const cleanFormData = useCallback((data: FormData): Record<string, string> => {
    const cleaned: Record<string, string> = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      cleaned[key] = (value !== undefined && value !== null && value !== '') ? String(value) : '';
    });
    return cleaned;
  }, []);

  // Créer un hash des données pour le cache
  const getDataHash = useCallback((data: FormData): string => {
    return JSON.stringify(data);
  }, []);

  const clearData = useCallback(() => {
    if(confirm('Voulez-vous vraiment effacer toutes les données ?')) {
        setFormData({});
        setGeneratedWord(null);
        setPdfBlob(null);
        // Effacer aussi les données sauvegardées du template actuel
        if (selectedTemplate) {
          saveCurrentTemplateData(selectedTemplate, {});
          // Invalider le cache
          setDocumentCache(prev => {
            const newCache = { ...prev };
            delete newCache[selectedTemplate];
            return newCache;
          });
        }
    }
  }, [selectedTemplate]);

  const toggleCustomization = useCallback(() => {
    setIsCustomizing(prev => {
      const newValue = !prev;

      // Si on désactive le mode personnalisation, vérifier si on doit revenir à la page 1
      if (prev && !newValue) {
        // Si on n'est pas sur la page 1 et que l'étape actuelle n'est pas valide, revenir à la page 1
        if (currentStepIdx > 0 && !isStepValid(currentStep.id as StepType)) {
          setCurrentStepIdx(0);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }

      return newValue;
    });
  }, [currentStepIdx, currentStep, isStepValid]);

  const handleFieldsReorder = (stepId: string, newFields: FormField[]) => {
    console.log('🔄 Réorganisation des champs pour', stepId, newFields);
    setCustomFieldsOrder(prev => ({
      ...prev,
      [stepId]: newFields
    }));
  };

  const fillTestData = () => {
      const testData = {
          codeDocument: "DOC-2024-001",
          entreprise: "ArcelorMittal France",
          civiliteDestinataire: "Monsieur",
          nomDestinataire: "Dupont",
          statutDestinataire: "Directeur des Ressources Humaines",
          batiment: "Bâtiment A",
          adresse: "15 rue des Hauts Fourneaux",
          cpVille: "59140 Dunkerque",
          emailDestinataire: "drh@arcelormittal.com",
          signatureExp: "Bruno REYNES",
          numeroCourrier: "2025-001",
          civiliteDelegue: "Monsieur",
          nomDelegue: "Jean Dupont",
          emailDelegue: "j.dupont@fo-metaux.org",
          civiliteRemplace: "Madame",
          nomRemplace: "Sophie Bernard"
      };
      setFormData(testData);
      // Sauvegarder les données de test pour le template actuel
      if (selectedTemplate) {
        saveCurrentTemplateData(selectedTemplate, testData);
      }
  };

  const handlePreview = useCallback(async () => {
    if (isGenerating || !selectedTemplate) return;

    // Vérifier que tous les champs requis sont remplis
    if (!areAllRequiredFieldsFilled) {
      showError('Veuillez remplir tous les champs obligatoires avant de prévisualiser');
      return;
    }

    setShowPreview(true);

    try {
      setIsGenerating(true);

      const dataHash = getDataHash(formData);
      const cached = documentCache[selectedTemplate];

      // Vérifier si on a déjà un document en cache avec les mêmes données
      if (cached && cached.dataHash === dataHash) {
        console.log('📦 Utilisation du cache pour', selectedTemplate);
        setGeneratedWord(cached.word);
        setPdfBlob(cached.pdf);
        showSuccess('Document chargé depuis le cache !');
        setIsGenerating(false);
        return;
      }

      // Préparer les données pour le webhook n8n
      const data = {
        templateType: selectedTemplate,
        templateName: TEMPLATES.find(t => t.id === selectedTemplate)?.title || selectedTemplate,
        ...cleanFormData(formData)
      };

      console.log('🔄 Génération du document pour', selectedTemplate);

      // Générer le Word
      const result = await generateWordDocument(data);
      setGeneratedWord(result.data);

      // Convertir en PDF pour la prévisualisation
      const pdfResult = await convertWordToPdf(result.data, `document_${selectedTemplate}`);
      setPdfBlob(pdfResult.blob);

      // Mettre en cache
      setDocumentCache(prev => ({
        ...prev,
        [selectedTemplate]: {
          word: result.data,
          pdf: pdfResult.blob,
          dataHash
        }
      }));

      showSuccess('Document généré avec succès !');
    } catch (error) {
      showError(`Erreur lors de la génération du document : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      console.error(error);
      setShowPreview(false);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, selectedTemplate, formData, documentCache, getDataHash, cleanFormData, showSuccess, showError, areAllRequiredFieldsFilled]);

  const handleDownload = useCallback(async () => {
    if (isGenerating || !selectedTemplate) return;

    // Vérifier que tous les champs requis sont remplis
    if (!areAllRequiredFieldsFilled) {
      showError('Veuillez remplir tous les champs obligatoires avant de télécharger');
      return;
    }

    try {
      setIsGenerating(true);

      const dataHash = getDataHash(formData);
      const cached = documentCache[selectedTemplate];

      let wordBase64 = generatedWord;

      // Utiliser le cache si disponible
      if (!wordBase64 && cached && cached.dataHash === dataHash) {
        console.log('📦 Utilisation du cache Word pour téléchargement');
        wordBase64 = cached.word;
        setGeneratedWord(wordBase64);
      }

      // Générer si pas en cache
      if (!wordBase64) {
        const data = {
          templateType: selectedTemplate,
          templateName: TEMPLATES.find(t => t.id === selectedTemplate)?.title || selectedTemplate,
          ...cleanFormData(formData)
        };
        const result = await generateWordDocument(data);
        wordBase64 = result.data;
        setGeneratedWord(wordBase64);
      }

      const blob = base64ToBlob(wordBase64);
      const filename = `document_${selectedTemplate}_${new Date().getTime()}.docx`;
      downloadBlob(blob, filename);
      showSuccess('Document Word téléchargé avec succès !');
    } catch (error) {
      showError(`Erreur lors du téléchargement : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, selectedTemplate, formData, generatedWord, documentCache, getDataHash, cleanFormData, showSuccess, showError, areAllRequiredFieldsFilled]);

  const handleDownloadPdf = useCallback(async () => {
    if (isGenerating || !selectedTemplate) return;

    // Vérifier que tous les champs requis sont remplis
    if (!areAllRequiredFieldsFilled) {
      showError('Veuillez remplir tous les champs obligatoires avant de télécharger le PDF');
      return;
    }

    try {
      setIsGenerating(true);

      const dataHash = getDataHash(formData);
      const cached = documentCache[selectedTemplate];

      // Utiliser le PDF déjà généré ou le cache
      let blob = pdfBlob;

      if (!blob && cached && cached.dataHash === dataHash) {
        console.log('📦 Utilisation du cache PDF pour téléchargement');
        blob = cached.pdf;
        setPdfBlob(blob);
      }

      if (!blob) {
        let wordBase64 = generatedWord;
        if (!wordBase64) {
          const data = {
            templateType: selectedTemplate,
            templateName: TEMPLATES.find(t => t.id === selectedTemplate)?.title || selectedTemplate,
            ...cleanFormData(formData)
          };
          const result = await generateWordDocument(data);
          wordBase64 = result.data;
          setGeneratedWord(wordBase64);
        }

        const pdfResult = await convertWordToPdf(wordBase64, `document_${selectedTemplate}`);
        blob = pdfResult.blob;
        setPdfBlob(blob);
      }

      const filename = `document_${selectedTemplate}_${new Date().getTime()}.pdf`;
      downloadBlob(blob, filename);
      showSuccess('Document PDF téléchargé avec succès !');
    } catch (error) {
      showError(`Erreur lors de la conversion PDF : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, selectedTemplate, formData, pdfBlob, generatedWord, documentCache, getDataHash, cleanFormData, showSuccess, showError, areAllRequiredFieldsFilled]);

  const handleSendEmail = async (emails: string[], customMessage: string) => {
    if (isSending) return;

    // Vérifier que tous les champs requis sont remplis
    if (!areAllRequiredFieldsFilled) {
      showError('Veuillez remplir tous les champs obligatoires avant de partager');
      return;
    }

    try {
      setIsSending(true);

      // Générer le Word si pas déjà fait
      let wordBase64 = generatedWord;
      if (!wordBase64) {
        const data = {
          templateType: selectedTemplate,
          templateName: TEMPLATES.find(t => t.id === selectedTemplate)?.title || selectedTemplate,
          ...cleanFormData(formData)
        };
        const result = await generateWordDocument(data);
        wordBase64 = result.data;
        setGeneratedWord(wordBase64);
      }

      // Convertir en PDF
      let pdfBase64: string;
      if (pdfBlob) {
        // Convertir le blob en base64
        const reader = new FileReader();
        pdfBase64 = await new Promise((resolve, reject) => {
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(pdfBlob);
        });
      } else {
        const pdfResult = await convertWordToPdf(wordBase64, `document_${selectedTemplate}`);
        setPdfBlob(pdfResult.blob);
        // Convertir le blob en base64
        pdfBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(pdfResult.blob);
        });
      }

      // Envoyer l'email avec les destinataires multiples
      const data = {
        templateType: selectedTemplate,
        templateName: TEMPLATES.find(t => t.id === selectedTemplate)?.title || selectedTemplate,
        ...cleanFormData(formData),
        emailEnvoi: emails.join(', ') // Joindre les emails avec des virgules pour n8n
      };
      await sendEmailWithPdf(data, pdfBase64, customMessage);

      showSuccess('Email envoyé avec succès !');
      setShowShare(false);
    } catch (error) {
      showError(`Erreur lors de l'envoi de l'email : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#2f2f2f] text-[#1c1b1f]">
      {/* Sidebar */}
      <Sidebar
        templates={TEMPLATES}
        selectedTemplate={selectedTemplate}
        onSelect={handleTemplateChange}
        isOpenMobile={isSidebarOpen}
        setIsOpenMobile={setIsSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header
          onPreview={handlePreview}
          onDownload={handleDownload}
          onShare={() => {
            if (!areAllRequiredFieldsFilled) {
              showError('Veuillez remplir tous les champs obligatoires avant de partager');
              return;
            }
            setShowShare(true);
          }}
          hasData={hasData && areAllRequiredFieldsFilled}
        />

        <main className="flex-1 overflow-y-auto pb-8 px-4 md:px-8 lg:px-12 scroll-smooth pt-20">
          <div className="max-w-6xl mx-auto w-full pt-8">

            {/* Page Title */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center gap-6 animate-[slideDown_0.5s_ease-out]">
              <div className="flex-shrink-0 w-[72px] h-[72px] flex items-center justify-center rounded-3xl bg-[#e062b1]/20 backdrop-blur-md shadow-inner border border-[#e062b1]/30">
                <span className="material-icons text-[#e062b1] text-4xl">edit_document</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white drop-shadow-md">Génération de document</h1>
                <p className="text-white/70 text-lg mt-1">
                   {selectedTemplate
                     ? `Modèle sélectionné : ${TEMPLATES.find(t => t.id === selectedTemplate)?.title}`
                     : 'Créez vos documents professionnels en quelques clics.'}
                </p>
              </div>
            </div>

            {/* Floating Navigation Bar - IMPROVED MD3 Expressive */}
            <div className="sticky top-6 z-30 mb-10 mx-auto max-w-6xl px-1">
               <div className="bg-white/90 dark:bg-[#2f2f2f]/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/40 dark:border-white/10 p-2.5 flex flex-col md:flex-row items-center justify-between gap-3 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)] hover:scale-[1.005] ring-1 ring-black/5 dark:ring-white/5 transform-gpu will-change-transform">

                  {/* Step Indicators */}
                  <div className="flex items-center gap-2 w-full md:w-auto px-1 py-1">
                    {STEPS.map((step, idx) => {
                      const isActive = currentStepIdx === idx;
                      const isCompleted = currentStepIdx > idx;

                      return (
                        <button
                          key={step.id}
                          onClick={() => handleStepChange(idx)}
                          className={`
                            relative group flex items-center gap-3 px-2 py-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] select-none
                            ${isActive
                               ? 'bg-[#ffecf8] dark:bg-[#4a1a36] pr-6 flex-grow md:flex-grow-0 ring-1 ring-[#ffd8ec] dark:ring-[#a84383]'
                               : 'flex-shrink-0'}
                          `}
                        >
                           <div className={`
                             w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 shadow-sm z-10
                             ${isActive
                               ? 'bg-[#2a2a2a] dark:bg-white text-white dark:text-[#2a2a2a] scale-100 rotate-0 shadow-md'
                               : isCompleted
                                 ? 'bg-[#2a2a2a] text-white scale-90 group-hover:scale-100'
                                 : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-400 scale-90 group-hover:text-gray-600 dark:group-hover:text-gray-200 group-hover:scale-100 group-hover:shadow-md'}
                           `}>
                             {isCompleted ? <span className="material-icons text-lg animate-[fadeIn_0.3s]">check</span> : idx + 1}
                           </div>

                           <div className={`flex flex-col items-start transition-all duration-500 overflow-hidden ${isActive ? 'w-auto opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-4'}`}>
                             <span className="font-bold text-sm text-[#2f2f2f] dark:text-white whitespace-nowrap leading-none mb-1">
                               {step.label}
                             </span>
                             <span className="text-[10px] text-gray-500 dark:text-gray-300 font-medium whitespace-nowrap leading-none uppercase tracking-wide">
                               Étape {idx + 1}/{STEPS.length}
                             </span>
                           </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Divider - Desktop Only */}
                  <div className="hidden md:block w-px h-10 bg-gradient-to-b from-transparent via-gray-200 to-transparent mx-2"></div>

                  {/* Actions Area */}
                  <div className="flex items-center justify-between w-full md:w-auto gap-3 md:gap-4 pl-1 md:pl-0">
                     
                     {/* Utilities Group */}
                     <div className="flex items-center gap-1 bg-gray-50/80 rounded-full p-1 border border-gray-100/50">
                       {/* Bouton Personnaliser (uniquement pour template custom) */}
                       {selectedTemplate === 'custom' && (
                         <button
                           onClick={toggleCustomization}
                           className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 group
                             ${isCustomizing
                               ? 'bg-[#3b5265] text-white shadow-md'
                               : 'text-gray-400 hover:text-[#3b5265] hover:bg-white'}
                           `}
                           title="Personnaliser les champs"
                         >
                           <span className={`material-icons text-[20px] group-hover:scale-110 transition-transform ${isCustomizing ? 'animate-[spin_1s_ease-out]' : ''}`}>
                             build
                           </span>
                         </button>
                       )}

                       <button
                         onClick={clearData}
                         className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-[#e04142] hover:bg-white transition-all duration-300 group"
                         title="Effacer tout"
                       >
                         <span className="material-icons text-[20px] group-hover:scale-110 transition-transform">delete_sweep</span>
                       </button>
                       <button
                         onClick={fillTestData}
                         className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-[#0072ff] hover:bg-white transition-all duration-300 group"
                         title="Données de test"
                       >
                         <span className="material-icons text-[20px] group-hover:scale-110 transition-transform">casino</span>
                       </button>
                     </div>

                     {/* Navigation Group */}
                     <div className="flex items-center gap-2">
                       <button 
                         onClick={() => handleStepChange(currentStepIdx - 1)}
                         disabled={isFirstStep}
                         className={`
                           h-12 px-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300
                           ${isFirstStep 
                             ? 'text-gray-300 cursor-not-allowed' 
                             : 'text-[#1c1b1f] hover:bg-gray-100 active:scale-95 font-medium'}
                         `}
                       >
                          <span className="material-icons">arrow_back</span>
                          <span className="hidden sm:inline text-sm">Précédent</span>
                       </button>

                       <button
                         onClick={() => handleStepChange(currentStepIdx + 1)}
                         disabled={isLastStep || (!isCustomizing && !isStepValid(currentStep.id as StepType))}
                         className={`
                           h-12 px-6 rounded-full flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:shadow-[#a84383]/30 transition-all duration-300
                           ${isLastStep || (!isCustomizing && !isStepValid(currentStep.id as StepType))
                             ? 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
                             : 'bg-[#a84383] text-white active:scale-95'}
                         `}
                         title={!isCustomizing && !isStepValid(currentStep.id as StepType) ? 'Veuillez remplir tous les champs obligatoires' : ''}
                       >
                          <span className="font-bold text-sm hidden sm:inline">Suivant</span>
                          <span className="material-icons text-sm">arrow_forward</span>
                       </button>
                     </div>
                  </div>
               </div>
            </div>

            {/* Form Content */}
            <div className="max-w-5xl mx-auto min-h-[400px]">
               <FormStep
                  step={currentStep.id as StepType}
                  data={formData}
                  onChange={handleInputChange}
                  isCustomizing={isCustomizing && selectedTemplate === 'custom'}
                  customFields={customFieldsOrder[currentStep.id]}
                  onFieldsReorder={(newFields) => handleFieldsReorder(currentStep.id, newFields)}
               />
               
               {isLastStep && (
                  <div className="mt-10 flex justify-end animate-[fadeInUp_0.5s_ease-out]">
                     <Button
                       variant="primary"
                       label="Prévisualiser le document"
                       icon="visibility"
                       className="py-4 px-8 text-lg rounded-[2rem] shadow-xl hover:shadow-2xl hover:shadow-[#a84383]/20"
                       onClick={handlePreview}
                       disabled={!areAllRequiredFieldsFilled}
                       title={!areAllRequiredFieldsFilled ? 'Veuillez remplir tous les champs obligatoires' : ''}
                     />
                  </div>
               )}
            </div>

          </div>
          
          <div className="mt-12">
            <Footer />
          </div>
        </main>
      </div>

      {/* Modals avec Lazy Loading */}
      <Suspense fallback={<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"><div className="w-12 h-12 border-4 border-[#a84383] border-t-transparent rounded-full animate-spin"></div></div>}>
        {showPreview && (
          <PreviewModal
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            pdfBlob={pdfBlob}
            isLoading={isGenerating}
            onDownloadWord={handleDownload}
            onDownloadPdf={handleDownloadPdf}
            onShare={() => {
              setShowPreview(false);
              setShowShare(true);
            }}
          />
        )}
        {showShare && (
          <ShareModal
            isOpen={showShare}
            onClose={() => setShowShare(false)}
            onSend={handleSendEmail}
            isSending={isSending}
            defaultEmail={formData.emailDestinataire as string}
          />
        )}
      </Suspense>

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={isGenerating && !showPreview}
        message="Génération du document en cours..."
      />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />
      )}

    </div>
  );
};

export default App;
