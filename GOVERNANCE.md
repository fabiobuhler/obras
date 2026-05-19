# GOVERNANÇA DO PROJETO

## OBJETIVO

Desenvolver sistema modular de gestão de obras civis com:
- controle financeiro
- controle de pagamentos
- gestão de obras
- funcionários
- fornecedores
- EPI
- recursos
- dashboards
- relatórios
- documentos digitais

Frontend:
- React + Vite
- Tailwind
- Shadcn/UI

Backend:
- Supabase

Hospedagem inicial:
- Github Pages

---

# DIRETRIZES OBRIGATÓRIAS

## ARQUITETURA

- Sistema obrigatoriamente modular
- Componentização máxima
- Evitar arquivos gigantes
- Cada módulo independente
- Preparado para escalabilidade

---

# PADRONIZAÇÕES

## Datas
Utilizar padrão:
DD/MM/YYYY

## Valores monetários
R$ 0.000,00

## CPF
000.000.000-00

## CNPJ
00.000.000/0000-00

## Telefones
(51) 99999-9999

---

# REGRAS DE UX

- Sistema deve funcionar perfeitamente em:
  - Desktop
  - Tablet
  - Celular

- Design responsivo obrigatório
- Navegação fluida
- Utilizar sub-abas quando necessário
- Utilizar cards organizados

---

# LOGIN

Utilizar Supabase Auth:
- login
- recuperação de senha
- sessão persistente
- níveis de acesso

Perfis:
- Administrador
- Financeiro
- Engenharia
- RH
- Operacional
- Visualização

---

# BANCO DE DADOS

- Utilizar PostgreSQL do Supabase
- Todas tabelas com:
  - UUID
  - created_at
  - updated_at
  - created_by

---

# STORAGE

Utilizar Supabase Storage para:
- comprovantes
- documentos
- contratos
- exames
- EPIs
- boletos
- imagens

---

# AGENTE ANTIGRAVITY

IMPORTANTE:

- NÃO executar testes automáticos dentro do localhost
- NÃO abrir agentes dentro do localhost
- NÃO ficar validando interface automaticamente
- Após alterações:
  - solicitar que o usuário valide
  - informar exatamente o que deve ser testado

Motivo:
- reduz lentidão
- evita travamentos
- aumenta assertividade
- melhora produtividade

---

# GITHUB PAGES

Utilizar:
base: '/nome-do-repositorio/'

No vite.config.js

---

# SUPABASE

Separar:
- services
- repositories
- auth
- queries

Nunca fazer SQL diretamente dentro dos componentes React.

---

# DASHBOARDS

Todos dashboards:
- filtros dinâmicos
- exportação PDF
- exportação Excel

---

# RELATÓRIOS

Todos relatórios:
- cabeçalho
- rodapé
- logo da empresa
- paginação
- data emissão

---

# WHATSAPP

Telefones terão:
- flag whatsapp

Ao visualizar:
- botão chamar no WhatsApp
- gerar QRCode opcional

---

# GANTT

Módulo obras:
- gráfico Gantt
- dependências entre etapas
- percentual executado
- responsável
- cronograma previsto x realizado

---

# FINANCEIRO

Controlar:
- contas a pagar
- contas pagas
- pagamentos parciais
- adiantamentos
- reagendamentos
- FAT
- parcelamentos
- dashboards financeiros

---

# ESCALABILIDADE

Sistema deve permitir:
- multiempresa futura
- multiobra
- multiusuário
- API futura
- aplicativo mobile
