import { Template, StepConfig, FormField, TemplateId, StepType } from './types';

// Exporter aussi les constantes UI
export * from './constants/ui';

export const TEMPLATES: Template[] = [
  {
    id: 'designation',
    title: 'Lettre de Désignation',
    description: 'Désignation de délégué syndical',
    image: '/assets/img/designation_template.png'
  },
  {
    id: 'negociation',
    title: 'Mandat de Négociation',
    description: 'Mandat de négociation collective',
    image: '/assets/img/nego_template.png'
  },
  {
    id: 'custom',
    title: 'Document Personnalisé',
    description: 'Document personnalisé avec contenu IA',
    image: '/assets/img/custom_template.png'
  },
];

export const STEPS: StepConfig[] = [
  { id: 'coordonnees', label: 'Coordonnées', icon: 'person', description: 'Informations du destinataire' },
  { id: 'contenu', label: 'Contenu', icon: 'article', description: 'Détails de la demande' },
  { id: 'expediteur', label: 'Signataire', icon: 'send', description: 'Choix du Secrétaire Fédéral' },
];

// Champs communs à tous les templates
export const COMMON_FIELDS: FormField[] = [
  { id: 'codeDocument', label: 'Numéro du document', type: 'text', placeholder: 'Ex : DOC-2024-001', required: true, icon: 'description', width: 'half' },
  { id: 'entreprise', label: 'Entreprise', type: 'text', placeholder: 'Ex: ACME Corp', required: true, icon: 'business', width: 'half' },
  { id: 'civiliteDestinataire', label: 'Civilité Destinataire', type: 'select', options: ['Monsieur', 'Madame', 'Monsieur et Madame'], required: false, width: 'half' },
  { id: 'nomDestinataire', label: 'Nom Destinataire', type: 'text', placeholder: 'Ex: Dupont', required: false, icon: 'person', width: 'half' },
  { id: 'statutDestinataire', label: 'Statut Destinataire', type: 'text', placeholder: 'Ex: Président, Directeur...', required: false, icon: 'work', width: 'half' },
  { id: 'batiment', label: 'Bâtiment', type: 'text', placeholder: 'Ex: Bâtiment A', required: false, icon: 'apartment', width: 'half' },
  { id: 'adresse', label: 'Adresse', type: 'text', placeholder: 'Ex: 123 rue de la Paix', required: false, icon: 'place', width: 'full' },
  { id: 'cpVille', label: 'Code postal + Ville', type: 'text', placeholder: 'Ex: 75001 Paris', required: false, icon: 'location_city', width: 'half' },
  { id: 'emailDestinataire', label: 'Email Destinataire', type: 'email', placeholder: 'destinataire@exemple.com', required: true, icon: 'email', width: 'half' },
  { id: 'signatureExp', label: 'Secrétaire Fédéral', type: 'select', options: [
    'Bruno REYNES', 'Eric KELLER', 'Edwin LIARD', 'Gérald CIANNARELLA',
    'Géraldine GOMIZ', 'Jean-Yves SABOT', 'Nathalie CAPART',
    'Olivier LEFEBVRE', 'Paul RIBEIRO', 'Valentin RODRIGUEZ'
  ], required: true, icon: 'edit', width: 'full' },
];

// Champs spécifiques par template
export const TEMPLATE_SPECIFIC_FIELDS: Record<string, FormField[]> = {
  designation: [
    { id: 'numeroCourrier', label: 'Numéro de Recommandé', type: 'text', placeholder: 'Ex: 2025-001', required: true, icon: 'tag', width: 'half' },
    { id: 'civiliteDelegue', label: 'Civilité Délégué Nommé', type: 'select', options: ['Monsieur', 'Madame'], required: false, width: 'half' },
    { id: 'nomDelegue', label: 'Nom Délégué Nommé', type: 'text', placeholder: 'Ex: Martin Dupont', required: true, icon: 'person', width: 'half' },
    { id: 'emailDelegue', label: 'Email Délégué Nommé', type: 'email', placeholder: 'delegue@exemple.com', required: true, icon: 'email', width: 'half' },
    { id: 'civiliteRemplace', label: 'Civilité du Remplaçé', type: 'select', options: ['Monsieur', 'Madame'], required: false, width: 'half' },
    { id: 'nomRemplace', label: 'Nom du Remplaçé', type: 'text', placeholder: 'Ex: Sophie Bernard', required: true, icon: 'person', width: 'half' },
  ],
  negociation: [
    { id: 'objet', label: 'Objet du Mandat', type: 'text', placeholder: 'Ex: Négociation accord temps de travail', required: true, icon: 'subject', width: 'full' },
    { id: 'civiliteDelegue', label: 'Civilité du Mandataire', type: 'select', options: ['Monsieur', 'Madame'], required: false, width: 'half' },
    { id: 'nomDelegue', label: 'Nom du Mandataire', type: 'text', placeholder: 'Ex: Jean Durand', required: true, icon: 'person', width: 'half' },
    { id: 'emailDelegue', label: 'Email du Mandataire', type: 'email', placeholder: 'mandataire@exemple.com', required: true, icon: 'email', width: 'half' },
  ],
  custom: [
    { id: 'objet', label: 'Objet du Document', type: 'text', placeholder: 'Ex: Demande d\'information', required: true, icon: 'subject', width: 'full' },
    { id: 'texteIa', label: 'Contenu du Document', type: 'textarea', placeholder: 'Saisissez le contenu du document (minimum 10 caractères pour déclencher l\'IA)...', required: true, icon: 'edit_note', rows: 5, width: 'full' },
  ],
};

export const FORM_FIELDS: Record<string, FormField[]> = {
  coordonnees: COMMON_FIELDS.filter(f => ['codeDocument', 'entreprise', 'civiliteDestinataire', 'nomDestinataire', 'statutDestinataire', 'batiment', 'adresse', 'cpVille', 'emailDestinataire'].includes(f.id)),
  contenu: [], // Sera rempli dynamiquement selon le template sélectionné
  expediteur: COMMON_FIELDS.filter(f => f.id === 'signatureExp'),
};
