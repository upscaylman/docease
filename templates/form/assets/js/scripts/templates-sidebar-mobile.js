// Script pour le collapse des templates sur mobile
document.addEventListener('DOMContentLoaded', function() {
  const toggleBtn = document.getElementById('templatesToggleBtn');
  const sidebar = document.querySelector('.templates-sidebar');
  
  if (toggleBtn && sidebar) {
    // Fonction pour calculer la hauteur optimale du volet plié
    function calculateCollapsedHeight() {
      // Vérifier si on est sur mobile
      if (window.innerWidth >= 768) return;
      
      // Utiliser visualViewport si disponible (meilleur pour mobile avec barres d'adresse)
      const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      
      // Obtenir la hauteur du header
      const header = document.querySelector('header');
      const headerHeight = header ? header.offsetHeight : 0;
      
      // Obtenir la hauteur du formulaire principal
      const formContainer = document.querySelector('.form-container');
      const formHeight = formContainer ? formContainer.offsetHeight : 0;
      
      // Calculer l'espace disponible pour le volet
      // On réserve un peu d'espace pour le padding et les marges
      const availableSpace = viewportHeight - headerHeight - formHeight;
      
      // Hauteur minimale pour le bouton toggle (environ 48px + padding)
      const minHeight = 60;
      
      // Hauteur maximale pour le volet plié (ne pas dépasser 20% de la fenêtre visible)
      const maxHeight = Math.min(availableSpace * 0.2, 80);
      
      // S'assurer que le volet ne dépasse jamais la hauteur visible
      const maxAllowedHeight = viewportHeight - headerHeight - 10; // 10px de marge
      const finalMaxHeight = Math.min(maxHeight, maxAllowedHeight);
      
      // Utiliser la hauteur calculée ou la hauteur minimale
      const calculatedHeight = Math.max(minHeight, finalMaxHeight);
      
      return calculatedHeight;
    }
    
    // Appliquer la hauteur calculée au volet plié
    function updateCollapsedHeight() {
      if (window.innerWidth < 768 && sidebar.classList.contains('collapsed')) {
        const height = calculateCollapsedHeight();
        sidebar.style.maxHeight = height + 'px';
      } else {
        sidebar.style.maxHeight = '';
      }
    }
    
    // Mettre à jour au chargement
    updateCollapsedHeight();
    
    // Mettre à jour la hauteur du form-container sur mobile
    function updateFormContainerHeight() {
      if (window.innerWidth < 768) {
        const header = document.querySelector('header');
        const formContainer = document.querySelector('.form-container');
        if (header && formContainer) {
          // Utiliser visualViewport si disponible
          const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
          const headerHeight = header.offsetHeight;
          const sidebarHeight = sidebar.classList.contains('collapsed') ? 60 : sidebar.offsetHeight;
          const availableHeight = viewportHeight - headerHeight - sidebarHeight;
          formContainer.style.height = availableHeight + 'px';
          formContainer.style.minHeight = availableHeight + 'px';
        }
      } else {
        const formContainer = document.querySelector('.form-container');
        if (formContainer) {
          formContainer.style.height = '';
          formContainer.style.minHeight = '';
        }
      }
    }
    
    // Mettre à jour au chargement
    updateFormContainerHeight();
    
    // Mettre à jour lors du redimensionnement et des changements de viewport
    let resizeTimeout;
    function handleViewportChange() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        updateCollapsedHeight();
        updateFormContainerHeight();
      }, 100);
    }
    window.addEventListener('resize', handleViewportChange);
    // Écouter les changements de visualViewport (important pour mobile avec barres d'adresse)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }
    
    toggleBtn.addEventListener('click', function() {
      sidebar.classList.toggle('collapsed');
      
      // Mettre à jour la hauteur après le toggle
      setTimeout(function() {
        updateCollapsedHeight();
        updateFormContainerHeight();
      }, 50);
      
      // Mettre à jour l'aria-label
      const isCollapsed = sidebar.classList.contains('collapsed');
      toggleBtn.setAttribute('aria-label', isCollapsed 
        ? 'Afficher les templates' 
        : 'Masquer les templates');
      
      // La rotation de la flèche est gérée par CSS
    });
  }
});
