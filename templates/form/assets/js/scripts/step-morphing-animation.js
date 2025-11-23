// Script pour l'animation de morphing entre les pages (mobile uniquement)
document.addEventListener('DOMContentLoaded', function() {
  // Activer l'animation uniquement sur mobile
  if (window.innerWidth < 768) {
    const tabButtons = document.querySelectorAll('.tab-button-floating');
    
    if (tabButtons.length > 0) {
      // Détecter les changements d'état actif
      tabButtons.forEach(button => {
        button.addEventListener('click', function() {
          // Ré-appliquer l'animation en forçant un reflow
          const indicator = this.querySelector('.step-indicator-floating');
          if (indicator && this.classList.contains('active')) {
            indicator.style.animation = 'none';
            setTimeout(() => {
              indicator.style.animation = '';
            }, 10);
          }
        });
      });
    }
  }
});
