Write-Host "Login Supabase CLI"
Write-Host ""
Write-Host "IMPORTANTE:"
Write-Host "1. Gere um Access Token em Supabase > Account > Access Tokens."
Write-Host "2. Não cole o token em chats, commits ou arquivos."
Write-Host "3. Cole o token apenas no prompt local abaixo."
Write-Host ""

$token = Read-Host "Cole o Access Token Supabase"

if ([string]::IsNullOrWhiteSpace($token)) {
  Write-Error "Token não informado."
  exit 1
}

$env:SUPABASE_ACCESS_TOKEN = $token

Write-Host "Executando login..."
npx supabase@latest login --token $token

Write-Host ""
Write-Host "Conferindo projetos visíveis..."
npx supabase@latest projects list

Write-Host ""
Write-Host "Login finalizado. Se o projeto hujrhgrfqworawsmngcb não aparecer, o token não tem acesso ao projeto."
