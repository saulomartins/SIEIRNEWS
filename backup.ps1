# Script de Backup - SIEIRNEWS
# Cria um backup completo do sistema com timestamp

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$sourcePath = "c:\Users\saulo\OneDrive\SIEIRNEWS"
$backupRoot = "c:\Users\saulo\OneDrive\SIEIRNEWS_BACKUPS"
$backupPath = "$backupRoot\BACKUP_$timestamp"

# Criar pasta de backups se não existir
if (-not (Test-Path $backupRoot)) {
    New-Item -ItemType Directory -Path $backupRoot | Out-Null
}

Write-Host "Criando backup em: $backupPath" -ForegroundColor Green

# Copiar arquivos (excluindo node_modules e backups)
Copy-Item -Path $sourcePath -Destination $backupPath -Recurse -Force -Exclude @("node_modules", "SIEIRNEWS_BACKUPS", ".git")

# Limpar node_modules se foi copiado
if (Test-Path "$backupPath\node_modules") {
    Remove-Item "$backupPath\node_modules" -Recurse -Force
}

Write-Host "✓ Backup concluído com sucesso!" -ForegroundColor Green
Write-Host "Local: $backupPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para restaurar este backup, copie os arquivos de volta para o diretório original." -ForegroundColor Yellow
