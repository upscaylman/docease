# Guide des Couleurs du Design System

## 🎨 Palette de Couleurs

Votre Design System utilise **5 couleurs principales** avec leurs variantes complètes :

### 1. Couleur Primaire - #1e3799 (Bleu foncé)
Couleur principale utilisée pour les actions principales, liens, et éléments importants.

**Variantes disponibles :**
- `--ds-color-primary-50` à `--ds-color-primary-900`
- `--ds-color-primary` (alias pour 500)
- `--ds-color-primary-light` (300)
- `--ds-color-primary-dark` (700)

**Variantes personnalisées :**
- `--ds-color-primary-variant-1` ou `--ds-color-primary-v1` : #6a89cc (claire)
- `--ds-color-primary-variant-2` ou `--ds-color-primary-v2` : #4a69bd (moyenne)
- `--ds-color-primary-variant-3` ou `--ds-color-primary-v3` : #0c2461 (foncée)

**Utilisation :**
```css
/* Bouton primaire */
.ds-button--primary {
  background: var(--ds-gradient-primary);
  color: var(--ds-color-on-primary);
}

/* Bouton avec variante 1 */
.ds-button--primary-v1 {
  background-color: var(--ds-color-primary-variant-1);
  color: var(--ds-color-on-primary);
}

/* Badge avec variante 2 */
.ds-badge--primary-v2 {
  background-color: var(--ds-color-primary-variant-2);
  color: var(--ds-color-on-primary);
}
```

### 2. Couleur Secondaire - #eb2f06 (Rouge/Orange)
Couleur pour les actions secondaires, alertes, et éléments d'accentuation.

**Variantes disponibles :**
- `--ds-color-secondary-50` à `--ds-color-secondary-900`
- `--ds-color-secondary` (alias pour 500)
- `--ds-color-secondary-light` (300)
- `--ds-color-secondary-dark` (700)

**Variantes personnalisées :**
- `--ds-color-secondary-variant-1` ou `--ds-color-secondary-v1` : #f8c291 (claire)
- `--ds-color-secondary-variant-2` ou `--ds-color-secondary-v2` : #e55039 (moyenne)
- `--ds-color-secondary-variant-3` ou `--ds-color-secondary-v3` : #b71540 (foncée)

**Utilisation :**
```css
/* Badge secondaire */
.ds-badge--secondary {
  background-color: var(--ds-color-secondary-container);
  color: var(--ds-color-on-secondary-container);
}

/* Bouton avec variante 1 */
.ds-button--secondary-v1 {
  background-color: var(--ds-color-secondary-variant-1);
  color: var(--ds-color-on-secondary);
}

/* Badge avec variante 2 */
.ds-badge--secondary-v2 {
  background-color: var(--ds-color-secondary-variant-2);
  color: var(--ds-color-on-secondary);
}
```

### 3. Couleur Tertiaire - #fa983a (Orange)
Couleur pour les éléments tertiaires, warnings, et informations complémentaires.

**Variantes disponibles :**
- `--ds-color-tertiary-50` à `--ds-color-tertiary-900`
- `--ds-color-tertiary` (alias pour 500)
- `--ds-color-tertiary-light` (300)
- `--ds-color-tertiary-dark` (700)

**Variantes personnalisées :**
- `--ds-color-tertiary-variant-1` ou `--ds-color-tertiary-v1` : #fad390 (claire)
- `--ds-color-tertiary-variant-2` ou `--ds-color-tertiary-v2` : #e04142 (moyenne)
- `--ds-color-tertiary-variant-3` ou `--ds-color-tertiary-v3` : #e58e26 (foncée)

**Utilisation :**
```css
/* Bouton tertiaire */
.ds-button--tertiary {
  background: var(--ds-gradient-tertiary);
  color: var(--ds-color-on-tertiary);
}

/* Bouton avec variante 1 */
.ds-button--tertiary-v1 {
  background-color: var(--ds-color-tertiary-variant-1);
  color: var(--ds-color-on-tertiary);
}

/* Badge avec variante 2 */
.ds-badge--tertiary-v2 {
  background-color: var(--ds-color-tertiary-variant-2);
  color: var(--ds-color-on-tertiary);
}
```

### 4. Couleur Quatrième - #3c6382 (Bleu-gris)
Couleur pour les éléments neutres, bordures, et séparateurs.

**Variantes disponibles :**
- `--ds-color-quaternary-50` à `--ds-color-quaternary-900`
- `--ds-color-quaternary` (alias pour 500)
- `--ds-color-quaternary-light` (300)
- `--ds-color-quaternary-dark` (700)

**Variantes personnalisées :**
- `--ds-color-quaternary-variant-1` ou `--ds-color-quaternary-v1` : #82ccdd (claire)
- `--ds-color-quaternary-variant-2` ou `--ds-color-quaternary-v2` : #60a3bc (moyenne)
- `--ds-color-quaternary-variant-3` ou `--ds-color-quaternary-v3` : #0a3d62 (foncée)

**Utilisation :**
```css
/* Bordure quatrième */
.border-quaternary {
  border-color: var(--ds-color-quaternary);
}

/* Bouton avec variante 1 */
.ds-button--quaternary-v1 {
  background-color: var(--ds-color-quaternary-variant-1);
  color: var(--ds-color-on-quaternary);
}

/* Badge avec variante 2 */
.ds-badge--quaternary-v2 {
  background-color: var(--ds-color-quaternary-variant-2);
  color: var(--ds-color-on-quaternary);
}
```

### 5. Couleur Cinquième - #38ada9 (Turquoise/Cyan)
Couleur pour les éléments spéciaux, succès alternatifs, et accents.

**Variantes disponibles :**
- `--ds-color-quinary-50` à `--ds-color-quinary-900`
- `--ds-color-quinary` (alias pour 500)
- `--ds-color-quinary-light` (300)
- `--ds-color-quinary-dark` (700)

**Variantes personnalisées :**
- `--ds-color-quinary-variant-1` ou `--ds-color-quinary-v1` : #e062b1 (claire)
- `--ds-color-quinary-variant-2` ou `--ds-color-quinary-v2` : #78e08f (moyenne)
- `--ds-color-quinary-variant-3` ou `--ds-color-quinary-v3` : #079992 (foncée)

**Utilisation :**
```css
/* Badge cinquième */
.ds-badge--quinary {
  background-color: var(--ds-color-quinary-container);
  color: var(--ds-color-on-quinary-container);
}

/* Bouton avec variante 1 */
.ds-button--quinary-v1 {
  background-color: var(--ds-color-quinary-variant-1);
  color: var(--ds-color-on-quinary);
}

/* Badge avec variante 2 */
.ds-badge--quinary-v2 {
  background-color: var(--ds-color-quinary-variant-2);
  color: var(--ds-color-on-quinary);
}
```

## 📋 Structure des Variables

Pour chaque couleur, vous avez accès à :

### Échelle Complète (50-900)
```css
--ds-color-[nom]-50   /* Très clair */
--ds-color-[nom]-100  /* Clair */
--ds-color-[nom]-200  /* Légèrement clair */
--ds-color-[nom]-300  /* Moyen-clair */
--ds-color-[nom]-400  /* Moyen */
--ds-color-[nom]-500  /* COULEUR PRINCIPALE */
--ds-color-[nom]-600  /* Moyen-foncé */
--ds-color-[nom]-700  /* Foncé */
--ds-color-[nom]-800  /* Très foncé */
--ds-color-[nom]-900  /* Maximum foncé */
```

### Variables Sémantiques
```css
--ds-color-[nom]          /* 500 - Couleur principale */
--ds-color-[nom]-light    /* 300 - Version claire */
--ds-color-[nom]-lighter  /* 200 - Version très claire */
--ds-color-[nom]-dark     /* 700 - Version foncée */
--ds-color-[nom]-darker   /* 900 - Version très foncée */
```

### États Interactifs
```css
--ds-color-[nom]-hover    /* 600 - État hover */
--ds-color-[nom]-active   /* 700 - État actif */
--ds-color-[nom]-focus    /* 500 - État focus */
--ds-color-[nom]-disabled /* 300 - État désactivé */
```

### Containers
```css
--ds-color-[nom]-container        /* 100 - Fond clair */
--ds-color-[nom]-container-light  /* 50 - Fond très clair */
--ds-color-on-[nom]-container     /* 900 - Texte sur container */
```

### Ombres
```css
--ds-color-[nom]-shadow        /* Ombre normale */
--ds-color-[nom]-shadow-light  /* Ombre légère */
--ds-color-[nom]-shadow-dark   /* Ombre foncée */
```

### Gradients
```css
--ds-gradient-[nom] /* Gradient principal */
```

## 🎯 Exemples d'Utilisation

### Boutons avec Différentes Couleurs

```html
<!-- Bouton primaire -->
<button class="ds-button ds-button--primary">
  Action Principale
</button>

<!-- Bouton secondaire (personnalisé) -->
<button class="ds-button" style="background: var(--ds-gradient-secondary); color: var(--ds-color-on-secondary);">
  Action Secondaire
</button>

<!-- Bouton tertiaire (personnalisé) -->
<button class="ds-button" style="background: var(--ds-gradient-tertiary); color: var(--ds-color-on-tertiary);">
  Action Tertiaire
</button>
```

### Badges avec Différentes Couleurs

```html
<!-- Badge primaire -->
<span class="ds-badge ds-badge--primary">Primaire</span>

<!-- Badge secondaire (personnalisé) -->
<span class="ds-badge" style="background-color: var(--ds-color-secondary-container); color: var(--ds-color-on-secondary-container);">
  Secondaire
</span>

<!-- Badge tertiaire (personnalisé) -->
<span class="ds-badge" style="background-color: var(--ds-color-tertiary-container); color: var(--ds-color-on-tertiary-container);">
  Tertiaire
</span>
```

### Cards avec Accents Colorés

```html
<!-- Card avec bordure primaire -->
<div class="ds-card" style="border-left: 4px solid var(--ds-color-primary);">
  Contenu
</div>

<!-- Card avec bordure secondaire -->
<div class="ds-card" style="border-left: 4px solid var(--ds-color-secondary);">
  Contenu
</div>
```

## 🔄 Changer une Couleur

Pour modifier une couleur, éditez `tokens/colors.css` :

```css
/* Exemple : Changer la couleur primaire */
--ds-color-primary-base: #nouvelle-couleur;

/* Puis ajustez les variantes 50-900 si nécessaire */
--ds-color-primary-50: #variante-tres-claire;
--ds-color-primary-100: #variante-claire;
/* ... etc */
```

## 📊 Tableau Récapitulatif

| Couleur | Base | Usage Principal | Variables Disponibles |
|---------|------|-----------------|----------------------|
| Primaire | #1e3799 | Actions principales, liens | `--ds-color-primary-*` |
| Secondaire | #eb2f06 | Actions secondaires, alertes | `--ds-color-secondary-*` |
| Tertiaire | #fa983a | Warnings, infos complémentaires | `--ds-color-tertiary-*` |
| Quatrième | #3c6382 | Éléments neutres, bordures | `--ds-color-quaternary-*` |
| Cinquième | #38ada9 | Éléments spéciaux, accents | `--ds-color-quinary-*` |

## ✅ Bonnes Pratiques

1. **Utilisez toujours les variables** : Ne codez jamais les couleurs en dur
2. **Respectez la hiérarchie** : Primaire > Secondaire > Tertiaire
3. **Testez le contraste** : Assurez-vous que le texte est lisible
4. **Utilisez les containers** : Pour les fonds clairs avec texte coloré
5. **Exploitez les gradients** : Pour des effets visuels élégants

## 🔗 Références

- [Guide de la Couleur Primaire](./primary-color.md)
- [Documentation des Composants](../docs/COMPONENTS.md)

