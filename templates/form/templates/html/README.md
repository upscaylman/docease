# Templates HTML de Prévisualisation

Ce dossier contient les templates HTML utilisés pour la prévisualisation des documents.

## Structure

Chaque template doit être nommé selon le type de document :
- `preview_designation.html` - Pour le template "Lettre de Désignation"
- `preview_negociation.html` - Pour le template "Mandat de Négociation"
- `preview_custom.html` - Pour le template "Document Personnalisé"

## Format des Templates

Les templates HTML utilisent des placeholders au format `{{variable}}` pour injecter les données du formulaire.

### Variables disponibles

Toutes les variables du formulaire sont disponibles, par exemple :
- `{{entreprise}}`
- `{{nomDestinataire}}`
- `{{emailDestinataire}}`
- `{{codeDocument}}`
- `{{signatureExp}}`
- Et toutes les variables spécifiques à chaque template

### Variables spéciales

- `{{date}}` - Date actuelle au format français (ex: "21/11/2025")
- `{{templateName}}` - Nom du template (ex: "Lettre de Désignation")

### Exemple de template

```html
<div class="bg-white rounded-lg p-6">
  <h1 class="text-2xl font-bold mb-4">{{templateName}}</h1>
  <p class="text-sm text-gray-600 mb-6">Date: {{date}}</p>
  
  <div class="mb-4">
    <strong>Entreprise:</strong> {{entreprise}}
  </div>
  
  <div class="mb-4">
    <strong>Destinataire:</strong> {{civiliteDestinataire}} {{nomDestinataire}}
  </div>
  
  <!-- Vos autres sections personnalisées -->
</div>
```

## Utilisation

Si un template HTML existe pour un type de document, il sera automatiquement utilisé à la place du HTML généré par défaut.

Si aucun template HTML n'est trouvé, le système utilisera le HTML généré dynamiquement par défaut.

