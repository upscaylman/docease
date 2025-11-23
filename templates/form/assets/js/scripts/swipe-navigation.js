// Script pour le swipe sur la barre d'action principale (mobile)
document.addEventListener('DOMContentLoaded', function() {
  // Activer le swipe uniquement sur mobile
  if (window.innerWidth < 768) {
    const mainActionBar = document.getElementById('mainActionBar');
    const actionNextBtn = document.getElementById('actionNextBtn');
    const actionPrevBtn = document.getElementById('actionPrevBtn');
    
    if (mainActionBar) {
      let touchStartX = 0;
      let touchEndX = 0;
      const minSwipeDistance = 50; // Distance minimale pour déclencher le swipe
      
      mainActionBar.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });
      
      mainActionBar.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }, { passive: true });
      
      function handleSwipe() {
        const swipeDistance = touchEndX - touchStartX;
        
        // Swipe vers la droite (page précédente)
        if (swipeDistance > minSwipeDistance) {
          if (actionPrevBtn && actionPrevBtn.style.display !== 'none') {
            actionPrevBtn.click();
          }
        }
        // Swipe vers la gauche (page suivante)
        else if (swipeDistance < -minSwipeDistance) {
          if (actionNextBtn && actionNextBtn.style.display !== 'none') {
            actionNextBtn.click();
          }
        }
      }
    }
  }
});
