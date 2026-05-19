param(
  [string]$ProjectRef = "hujrhgrfqworawsmngcb",
  [string]$Workdir = "C:\Users\Fabio\.antigravity\gestao-obras"
)

Write-Host "Projeto: $ProjectRef"
Write-Host "Workdir: $Workdir"

Set-Location $Workdir
$env:SUPABASE_WORKDIR = $Workdir

Write-Host ""
Write-Host "Verificando arquivo da Edge Function..."
$functionPath = Join-Path $Workdir "supabase\functions\admin-create-user\index.ts"

if (-not (Test-Path $functionPath)) {
  Write-Error "Arquivo não encontrado: $functionPath"
  exit 1
}

Write-Host "Arquivo encontrado: $functionPath"

Write-Host ""
Write-Host "Listando projetos visíveis para o token atual..."
npx supabase@latest projects list

Write-Host ""
Write-Host "Fazendo deploy da função admin-create-user..."
npx supabase@latest --workdir $Workdir functions deploy admin-create-user --project-ref $ProjectRef

Write-Host ""
Write-Host "Deploy finalizado. Se houve erro 401 Unauthorized, gere novo Access Token no Supabase e rode login novamente."
