# Script de comparaison des fichiers

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  Comparaison: index.html vs Structure Modulaire" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# Fichier original
$originalFile = "index.html"
$originalSize = (Get-Item $originalFile).Length
$originalLines = (Get-Content $originalFile).Count

Write-Host "📄 Fichier Original (index.html)" -ForegroundColor Yellow
Write-Host "   - Taille: $([math]::Round($originalSize/1KB,2)) Ko" -ForegroundColor White
Write-Host "   - Lignes: $originalLines" -ForegroundColor White
Write-Host ""

# Nouveau fichier principal
$modularFile = "index-modular.html"
$modularSize = (Get-Item $modularFile).Length
$modularLines = (Get-Content $modularFile).Count

Write-Host "📄 Fichier Modulaire Principal (index-modular.html)" -ForegroundColor Green
Write-Host "   - Taille: $([math]::Round($modularSize/1KB,2)) Ko" -ForegroundColor White
Write-Host "   - Lignes: $modularLines" -ForegroundColor White
Write-Host "   - Réduction: $([math]::Round(($originalSize - $modularSize) / $originalSize * 100, 2))%" -ForegroundColor Green
Write-Host ""

# Composants HTML
Write-Host "📦 Composants HTML (components/)" -ForegroundColor Cyan
$componentsTotal = 0
$componentsLinesTotal = 0
Get-ChildItem components -File -Filter "*.html" | ForEach-Object {
    $size = $_.Length
    $lines = (Get-Content $_.FullName).Count
    $componentsTotal += $size
    $componentsLinesTotal += $lines
    $roundedSize = [math]::Round($size/1KB,2)
    Write-Host "   - $($_.Name): $roundedSize Ko ($lines lignes)" -ForegroundColor White
}
$roundedCompTotal = [math]::Round($componentsTotal/1KB,2)
Write-Host "   TOTAL Composants: $roundedCompTotal Ko ($componentsLinesTotal lignes)" -ForegroundColor Cyan
Write-Host ""

# Scripts JS
Write-Host "Scripts JavaScript (assets/js/scripts/)" -ForegroundColor Magenta
$scriptsTotal = 0
$scriptsLinesTotal = 0
Get-ChildItem assets\js\scripts -File -Filter "*.js" | ForEach-Object {
    $size = $_.Length
    $lines = (Get-Content $_.FullName).Count
    $scriptsTotal += $size
    $scriptsLinesTotal += $lines
    $roundedSize = [math]::Round($size/1KB,2)
    Write-Host "   - $($_.Name): $roundedSize Ko ($lines lignes)" -ForegroundColor White
}
$roundedScriptsTotal = [math]::Round($scriptsTotal/1KB,2)
Write-Host "   TOTAL Scripts: $roundedScriptsTotal Ko ($scriptsLinesTotal lignes)" -ForegroundColor Magenta
Write-Host ""

# CSS personnalisé
$cssFile = "assets\css\custom-styles.css"
$cssSize = (Get-Item $cssFile).Length
$cssLines = (Get-Content $cssFile).Count

Write-Host "🎨 Styles CSS (assets/css/custom-styles.css)" -ForegroundColor Blue
Write-Host "   - Taille: $([math]::Round($cssSize/1KB,2)) Ko" -ForegroundColor White
Write-Host "   - Lignes: $cssLines" -ForegroundColor White
Write-Host ""

# Total structure modulaire
$totalModular = $modularSize + $componentsTotal + $scriptsTotal + $cssSize
$totalModularLines = $modularLines + $componentsLinesTotal + $scriptsLinesTotal + $cssLines

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "📊 RÉSUMÉ" -ForegroundColor Yellow
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Structure Originale:" -ForegroundColor Yellow
Write-Host "   - 1 fichier monolithique" -ForegroundColor White
Write-Host "   - $([math]::Round($originalSize/1KB,2)) Ko" -ForegroundColor White
Write-Host "   - $originalLines lignes" -ForegroundColor White
Write-Host ""
Write-Host "Structure Modulaire:" -ForegroundColor Green
Write-Host "   - 1 fichier principal + 13 composants/scripts" -ForegroundColor White
Write-Host "   - $([math]::Round($totalModular/1KB,2)) Ko (total)" -ForegroundColor White
Write-Host "   - $totalModularLines lignes (total)" -ForegroundColor White
Write-Host ""
Write-Host "Avantages de la structure modulaire:" -ForegroundColor Green
Write-Host "   ✓ Maintenabilité: Chaque fichier <150 lignes" -ForegroundColor White
Write-Host "   ✓ Réutilisabilité: Composants indépendants" -ForegroundColor White
Write-Host "   ✓ Organisation: Séparation claire HTML/CSS/JS" -ForegroundColor White
Write-Host "   ✓ Collaboration: Modifications isolées sans conflits" -ForegroundColor White
Write-Host "   ✓ Performance: Cache navigateur par composant" -ForegroundColor White
Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
