/**
 * Viewport-based automatic scaling
 * Adapte automatiquement la taille du contenu en fonction de la taille du viewport
 * Désactivé sur mobile et tablette (< 1024px)
 */

(function() {
  // Dimensions de référence (design optimal)
  const REFERENCE_WIDTH = 1920;
  const REFERENCE_HEIGHT = 1080;
  
  // Seuil minimum pour activer le scaling (desktop uniquement)
  const MIN_DESKTOP_WIDTH = 1024;
  
  // Tolérance pour considérer qu'on est à la résolution de référence (pas de scaling)
  const TOLERANCE = 50;
  
  function calculateOptimalScale() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Désactiver le scaling sur mobile et tablette
    if (viewportWidth < MIN_DESKTOP_WIDTH) {
      return 1; // Pas de scaling sur mobile/tablette
    }
    
    // Si on est proche de la résolution de référence (1920x1080), pas de scaling
    if (Math.abs(viewportWidth - REFERENCE_WIDTH) < TOLERANCE && 
        Math.abs(viewportHeight - REFERENCE_HEIGHT) < TOLERANCE) {
      return 1; // Pas de scaling, affichage natif à 100%
    }
    
    // Calculer le ratio de scale pour width et height
    const scaleX = viewportWidth / REFERENCE_WIDTH;
    const scaleY = viewportHeight / REFERENCE_HEIGHT;
    
    // Prendre le minimum pour que tout rentre à l'écran
    const scale = Math.min(scaleX, scaleY, 1); // Ne jamais agrandir au-delà de 100%
    
    return scale;
  }
  
  function applyViewportScale() {
    const scale = calculateOptimalScale();
    document.documentElement.style.setProperty('--base-scale', scale);
    
    // Ajuster la taille du body pour éviter le scroll (seulement sur desktop avec scaling)
    if (window.innerWidth >= MIN_DESKTOP_WIDTH && scale < 1) {
      const scaledWidth = window.innerWidth / scale;
      const scaledHeight = window.innerHeight / scale;
      document.body.style.width = scaledWidth + 'px';
      document.body.style.height = scaledHeight + 'px';
    } else {
      // Réinitialiser si pas de scaling nécessaire
      document.body.style.width = '';
      document.body.style.height = '';
    }
  }
  
  // Appliquer au chargement
  applyViewportScale();
  
  // Recalculer lors du redimensionnement de la fenêtre
  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(applyViewportScale, 100);
  });
})();
