/**
 * Viewport-based automatic scaling
 * Adapte automatiquement la taille du contenu en fonction de la taille du viewport
 * Désactivé sur mobile et tablette (< 1024px)
 * Optimisé pour les écrans 13", 13.3" et 14" avec support du zoom jusqu'à 150%
 */

(function () {
  // Seuil minimum pour activer le scaling (desktop uniquement)
  const MIN_DESKTOP_WIDTH = 1024;

  // Vérifier immédiatement si on est sur mobile/tablette - si oui, ne rien faire
  if (window.innerWidth < MIN_DESKTOP_WIDTH) {
    return; // Sortir immédiatement, le code ne s'exécute pas sur mobile/tablette
  }

  // Dimensions de référence (design optimal)
  const REFERENCE_WIDTH = 1920;
  const REFERENCE_HEIGHT = 1080;

  // Scale minimum pour éviter que le contenu soit trop petit sur les écrans moyens
  // Optimisé pour les écrans 13", 13.3" et 14"
  const MIN_SCALE = 0.7;

  // Scale maximum - autoriser le zoom jusqu'à 150% sur n'importe quel écran desktop
  const MAX_SCALE = 1.5;

  // Tolérance pour considérer qu'on est à la résolution de référence (pas de scaling)
  const TOLERANCE = 50;

  // Résolutions typiques des écrans 13-14 pouces (largeur x hauteur)
  const SMALL_SCREEN_PROFILES = [
    { width: 1366, height: 768, scale: 0.85 },   // 13" - 13.3" standard
    { width: 1280, height: 800, scale: 0.8 },   // 13" MacBook Air ancien
    { width: 1440, height: 900, scale: 0.9 },    // 13.3" MacBook Pro
    { width: 1920, height: 1080, scale: 1.0 },  // 13.3" - 14" Full HD
    { width: 2560, height: 1440, scale: 1.2 },  // 14" QHD
  ];

  /**
   * Détecte si on est sur un écran 13-14 pouces et retourne un scale recommandé
   * @returns {number|null} Scale recommandé ou null si pas d'écran détecté
   */
  function detectSmallScreenProfile() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Chercher le profil le plus proche
    let closestProfile = null;
    let minDistance = Infinity;

    for (const profile of SMALL_SCREEN_PROFILES) {
      const widthDiff = Math.abs(viewportWidth - profile.width);
      const heightDiff = Math.abs(viewportHeight - profile.height);
      const distance = Math.sqrt(widthDiff * widthDiff + heightDiff * heightDiff);

      // Si on est très proche d'un profil (tolérance de 100px)
      if (distance < 100 && distance < minDistance) {
        minDistance = distance;
        closestProfile = profile;
      }
    }

    return closestProfile ? closestProfile.scale : null;
  }

  /**
   * Calcule le scale optimal en fonction du viewport
   * @returns {number} Scale optimal entre MIN_SCALE et MAX_SCALE
   */
  function calculateOptimalScale() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Si on est proche de la résolution de référence (1920x1080), pas de scaling
    if (
      Math.abs(viewportWidth - REFERENCE_WIDTH) < TOLERANCE &&
      Math.abs(viewportHeight - REFERENCE_HEIGHT) < TOLERANCE
    ) {
      return 1.0; // Pas de scaling, affichage natif à 100%
    }

    // Détecter si on est sur un écran 13-14 pouces
    const smallScreenScale = detectSmallScreenProfile();
    
    if (smallScreenScale !== null) {
      // Utiliser le scale recommandé pour les petits écrans
      // Mais permettre un ajustement si l'utilisateur a zoomé
      const baseScale = smallScreenScale;
      
      // Calculer aussi le scale basé sur les dimensions
      const scaleX = viewportWidth / REFERENCE_WIDTH;
      const scaleY = viewportHeight / REFERENCE_HEIGHT;
      const calculatedScale = Math.min(scaleX, scaleY);
      
      // Prendre la moyenne pondérée pour un résultat plus fluide
      // 70% du scale recommandé + 30% du scale calculé
      let scale = baseScale * 0.7 + calculatedScale * 0.3;
      
      // S'assurer que le scale reste dans les limites
      scale = Math.max(scale, MIN_SCALE);
      scale = Math.min(scale, MAX_SCALE);
      
      return scale;
    }

    // Pour les autres écrans, calculer le scale normalement
    const scaleX = viewportWidth / REFERENCE_WIDTH;
    const scaleY = viewportHeight / REFERENCE_HEIGHT;

    // Prendre le minimum pour que tout rentre à l'écran
    let scale = Math.min(scaleX, scaleY);

    // Si le scale calculé est supérieur à 1, on peut zoomer jusqu'à 150%
    // Cela permet d'agrandir le contenu sur les grands écrans
    if (scale > 1.0) {
      scale = Math.min(scale, MAX_SCALE);
    } else {
      // Pour les écrans plus petits, appliquer le scale minimum
      scale = Math.max(scale, MIN_SCALE);
    }

    return scale;
  }

  /**
   * Applique le scale calculé au document
   */
  function applyViewportScale() {
    // Double vérification au cas où (sécurité supplémentaire)
    if (window.innerWidth < MIN_DESKTOP_WIDTH) {
      // Réinitialiser le scale sur mobile/tablette
      document.documentElement.style.setProperty("--base-scale", 1);
      document.body.style.width = "";
      document.body.style.height = "";
      return;
    }

    const scale = calculateOptimalScale();
    document.documentElement.style.setProperty("--base-scale", scale);

    // Ajuster la taille du body pour éviter le scroll
    // Cette logique fonctionne aussi pour les scales > 1 (zoom)
    if (scale !== 1) {
      const scaledWidth = window.innerWidth / scale;
      const scaledHeight = window.innerHeight / scale;
      document.body.style.width = scaledWidth + "px";
      document.body.style.height = scaledHeight + "px";
    } else {
      // Réinitialiser si pas de scaling nécessaire
      document.body.style.width = "";
      document.body.style.height = "";
    }
  }

  // Appliquer au chargement
  applyViewportScale();

  // Recalculer lors du redimensionnement de la fenêtre
  let resizeTimeout;
  window.addEventListener("resize", function () {
    // Ne pas exécuter sur mobile/tablette
    if (window.innerWidth < MIN_DESKTOP_WIDTH) {
      return;
    }
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(applyViewportScale, 100);
  });

  // Écouter les changements de zoom du navigateur (Ctrl + / Ctrl -)
  // Note: Les événements de zoom ne sont pas toujours détectables,
  // mais on peut détecter les changements de devicePixelRatio
  let lastDevicePixelRatio = window.devicePixelRatio || 1;
  
  // Vérifier périodiquement si le zoom a changé
  setInterval(function() {
    if (window.innerWidth < MIN_DESKTOP_WIDTH) {
      return;
    }
    
    const currentDevicePixelRatio = window.devicePixelRatio || 1;
    if (Math.abs(currentDevicePixelRatio - lastDevicePixelRatio) > 0.1) {
      lastDevicePixelRatio = currentDevicePixelRatio;
      applyViewportScale();
    }
  }, 500);
})();
