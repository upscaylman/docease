// Script pour le collapse des templates sur mobile
document.addEventListener('DOMContentLoaded', function() {
  const toggleBtn = document.getElementById('templatesToggleBtn');
  const sidebar = document.querySelector('.templates-sidebar');
  
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', function() {
      sidebar.classList.toggle('collapsed');
      
      // Mettre à jour l'aria-label
      const isCollapsed = sidebar.classList.contains('collapsed');
      toggleBtn.setAttribute('aria-label', isCollapsed 
        ? 'Afficher les templates' 
        : 'Masquer les templates');
    });
  }
});
