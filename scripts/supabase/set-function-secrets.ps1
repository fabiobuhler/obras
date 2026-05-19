param(
  [string]$ProjectRef = "hujrhgrfqworawsmngcb",
  [string]$Workdir = "C:\Users\Fabio\.antigravity\gestao-obras"
)

Set-Location $Workdir
$env:SUPABASE_WORKDIR = $Workdir

Write-Host "Configuração de secrets da Edge Function"
Write-Host ""
Write-Host "ATENÇÃO:"
Write-Host "A SERVICE_ROLE_KEY não deve ser salva no frontend ou no GitHub Pages."
Write-Host "Cole as chaves apenas neste prompt local."
Write-Host ""

$supabaseUrl = Read-Host "SUPABASE_URL"
$anonKey = Read-Host "SUPABASE_ANON_KEY"
$serviceRoleKey = Read-Host "SUPABASE_SERVICE_ROLE_KEY"

if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
  Write-Error "SUPABASE_URL não informado."
  exit 1
}

if ([string]::IsNullOrWhiteSpace($anonKey)) {
  Write-Error "SUPABASE_ANON_KEY não informado."
  exit 1
}

if ([string]::IsNullOrWhiteSpace($serviceRoleKey)) {
  Write-Error "SUPABASE_SERVICE_ROLE_KEY não informado."
  exit 1
}

Write-Host "Enviando secrets para o projeto $ProjectRef..."

npx supabase@latest --workdir $Workdir secrets set SUPABASE_URL="$supabaseUrl" --project-ref $ProjectRef
npx supabase@latest --workdir $Workdir secrets set SUPABASE_ANON_KEY="$anonKey" --project-ref $ProjectRef
npx supabase@latest --workdir $Workdir secrets set SUPABASE_SERVICE_ROLE_KEY="$serviceRoleKey" --project-ref $ProjectRef

Write-Host "Secrets enviados."
