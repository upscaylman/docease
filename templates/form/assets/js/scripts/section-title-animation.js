// Script pour masquer le titre de section après 3s (mobile uniquement)
document.addEventListener('DOMContentLoaded', function() {
  // Activer uniquement sur mobile
  if (window.innerWidth < 768) {
    const sectionTitle = document.getElementById('sectionTitle');
    
    if (sectionTitle) {
      // Attendre 3 secondes puis masquer avec animation
      setTimeout(function() {
        // Ajouter les styles de transition plus fluides
        sectionTitle.style.transition = 'opacity 1s ease-in-out';
        sectionTitle.style.opacity = '0';
        
        // Appliquer display: none après l'animation (1s)
        setTimeout(function() {
          sectionTitle.style.display = 'none';
        }, 1000);
      }, 3000);
    }
  }
});
