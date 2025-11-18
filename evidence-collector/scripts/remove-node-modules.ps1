# PowerShell script to remove node_modules folders in this project (run from evidence-collector folder)
# Usage: .\scripts\remove-node-modules.ps1

Get-ChildItem -Path . -Recurse -Directory -Force | Where-Object { $_.Name -eq 'node_modules' } | ForEach-Object {
    Write-Host "Removing: $($_.FullName)"
    Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Done. Run 'git status' to review changes."
