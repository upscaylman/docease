// Script pour mettre à jour l'année et la version automatiquement
document.addEventListener('DOMContentLoaded', function() {
  // Mise à jour de l'année
  const yearElement = document.getElementById('currentYear');
  if (yearElement) {
    const currentYear = new Date().getFullYear();
    yearElement.textContent = currentYear;
  }
  
  // Mise à jour de la version
  const versionElement = document.getElementById('appVersion');
  if (versionElement && window.APP_VERSION) {
    versionElement.textContent = window.APP_VERSION;
  }
});
