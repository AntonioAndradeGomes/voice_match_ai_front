# 🗺️ Plano de Implementação — VoiceMatch AI

Este documento detalha o planejamento técnico e a divisão de tarefas entre **Backend** e **Frontend** para o desenvolvimento das novas funcionalidades da plataforma VoiceMatch AI.

---

## 🎯 Feature 1: Aba de Configurações & Gestão de Habilidades (Soft & Hard Skills)

> **Objetivo:** Permitir que o recrutador gerencie um catálogo de habilidades (hard skills e soft skills) e configure perfis de exigência por vaga ou padrões corporativos.

### ⚙️ Backend
- [ ] **Modelagem & Banco de Dados:**
  - Criar modelo `Habilidade` (`id`, `nome`, `tipo` [HARD/SOFT], `categoria`, `empresa_id` ou global).
  - Criar tabela intermediária ou estruturar o relacionamento `VagaHabilidade` com campos de `peso` (ex: 1 a 5) e `obrigatoriedade` (obrigatória/desejável).
- [ ] **Seed Inicial de Habilidades (Full Stack & Soft Skills):**
  - **Frontend:** React, Next.js, TypeScript, JavaScript (ES6+), Vue.js, Angular, HTML5/CSS3, TailwindCSS, Redux/Zustand, Consumo de APIs (REST/GraphQL).
  - **Backend:** Node.js (Express/NestJS), Python (FastAPI/Django), Java (Spring Boot), C# (.NET Core), Go, PHP (Laravel), Criação de APIs RESTful e WebSockets.
  - **Bancos de Dados & ORMs:** PostgreSQL, MySQL, MongoDB, Redis, SQLAlchemy, Prisma, TypeORM, Modelagem Relacional e NoSQL.
  - **DevOps, Cloud & Ferramentas:** Docker, Docker Compose, Kubernetes, AWS (S3, EC2, Lambda), CI/CD (GitHub Actions), Git/GitHub, Linux, Nginx.
  - **Arquitetura & Testes:** Clean Architecture, Microsserviços, Testes Unitários/Integração (Jest, Pytest, Vitest, Cypress), Segurança (JWT, OAuth2).
  - **Soft Skills:** Comunicação Clara, Resolução de Problemas, Trabalho em Equipe, Adaptabilidade/Aprendizado Rápido, Organização e Gestão de Tempo, Pensamento Crítico.
- [ ] **Endpoints CRUD:**
  - `GET /habilidades/`: Listagem com filtros por tipo (Hard/Soft), categoria (Frontend, Backend, DevOps, etc.), busca textual e paginação.
  - `POST /habilidades/`: Cadastro de nova habilidade no catálogo.
  - `PUT /habilidades/{id}` / `DELETE /habilidades/{id}`: Atualização e exclusão de habilidades.
  - `GET /vagas/{id}/habilidades` e `PUT /vagas/{id}/habilidades`: Associação e sincronização de skills com peso específico para a vaga.

### 🎨 Frontend
- [ ] **Nova Rota `/configuracoes`:**
  - Criar página com layout em abas (`Tabs`): *Habilidades*, *Padrões de Triagem* e *Conta*.
  - Aba *Habilidades*: Interface de gestão de catálogo com cards/tabela organizados por categorias (Frontend, Backend, DevOps, Banco de Dados, Soft Skills), badges coloridas, busca rápida e modal para cadastrar/editar habilidade.
- [ ] **Integração no Formulário de Vagas (`/vagas/nova` e `/vagas/[id]/editar`):**
  - Componente de autocomplete de habilidades com chips interativos e filtros por categoria Full Stack, permitindo selecionar do catálogo e atribuir peso/nível de relevância.

---

## 📊 Feature 2: Aprimoramento de Relatórios & Analytics

> **Objetivo:** Corrigir e evoluir a tela de relatórios para exibir a **nota média real dos candidatos**, dados segmentados por vaga e métricas de conversão.

### ⚙️ Backend
- [ ] **Endpoints de Agregação:**
  - Criar endpoint `GET /relatorios/geral`: Retorna totais consolidados, nota média global, distribuição por faixa de nota e volume por status.
  - Criar endpoint `GET /relatorios/vagas/{vaga_id}`: Retorna métricas específicas da vaga selecionada (nota média de triagem, nota média de entrevista por voz, funil de conversão específico).
- [ ] **Cálculos e Agregações Otimizadas:**
  - Realizar agregações diretamente via queries SQL (evitando carregar todos os candidatos em memória), considerando apenas candidaturas com notas válidas e entrevistas finalizadas para o cálculo de médias.

### 🎨 Frontend
- [ ] **Filtro Dinâmico por Vaga:**
  - Adicionar seletor (dropdown com busca) no topo da página `/relatorios` permitindo alternar entre *"Visão Geral (Todas as Vagas)"* e uma vaga específica.
- [ ] **Correção do Cálculo da Nota Média:**
  - Ajustar para consumir os dados consolidados do backend, exibindo separadamente a *Nota Média de Triagem de Currículo* e a *Nota Média da Entrevista de Voz*.
- [ ] **Gráficos e Indicadores:**
  - Gráfico de barras comparativo de desempenho por vaga (média de notas e taxa de aprovação).
  - Tabela com ranking dos candidatos de maior destaque filtrados pela vaga selecionada.

---

## 🧠 Feature 3: Refinamento de Prompts de IA (Triagem & Entrevistas)

> **Objetivo:** Otimizar a precisão, rigor técnico e qualidade pedagógica dos feedbacks gerados pela IA no backend e microsserviço de IA.

### ⚙️ Backend & Services
- [ ] **Triagem de Currículos (`voicematch-back` - `triagem_service.py`):**
  - Refinar o prompt com sistema de ponderação explícita:
    - *Hard Skills comprovadas:* 60% do peso.
    - *Experiência prática/projetos:* 25% do peso.
    - *Soft skills e formação:* 15% do peso.
  - Formatar o JSON de saída para incluir notas parciais por categoria e justificativas pontuais.
- [ ] **Avaliação e Feedback de Entrevista (`voicematch-services` - `groq_ai_service.py`):**
  - Refinar prompt de avaliação de áudio/voz combinando transcrição Whisper e métricas acústicas do Librosa (fluência, pausas, clareza).
  - Ajustar o prompt de feedback ao candidato para gerar parecer construtivo, acolhedor e com dicas práticas de melhoria de comunicação e conhecimentos técnicos.

### 🎨 Frontend
- [ ] **Visualização de Feedbacks Estruturados:**
  - Atualizar o card de detalhes do candidato e modal de triagem para exibir as pontuações discriminadas (Hard Skills, Experiência, Comunicação) com barras de progresso e tags destacadas.

---

## 🎨 Feature 4: Nova Identidade Visual & Branding

> **Objetivo:** Desenvolver uma nova identidade visual marcante para a VoiceMatch AI (nova logo, paleta de cores moderna, tipografia e refinamento de UI).

### 🎨 Frontend
- [ ] **Criação da Nova Logo VoiceMatch AI:**
  - Desenvolver vetor SVG moderno combinando ondas sonoras/voz, conexão/matching e inteligência artificial.
  - Variações: Logo completa (ícone + tipografia), Isotipo/Ícone isolado e versões para tema claro/escuro.
  - Atualização do `favicon.ico`, `icon.svg` e metatags open-graph.
- [ ] **Refinamento do Design System (`globals.css` / Tailwind):**
  - Curadoria de paleta de cores moderna (tons primários índigo/violeta com acentos vibrantes, fundo neutro elegante).
  - Tipografia consistente (Google Font moderna como *Inter* ou *Plus Jakarta Sans*).
  - Micro-animações e transições suaves nos cards, botões e modais.
- [ ] **Padronização de Layout:**
  - Redesenho do Header/Sidebar com a nova marca, estados ativos destacados e visualização do usuário logado.

---

## 🏢 Feature 5: Arquitetura Multi-tenant (Empresas & Recrutadores)

> **Objetivo:** Permitir o cadastro de empresas e múltiplos recrutadores vinculados a cada organização, garantindo isolamento total de dados e configurações.

### ⚙️ Backend
- [ ] **Modelagem Multi-tenant:**
  - Criar modelo `Empresa` (`id`, `nome`, `cnpj`, `logo_url`, `plano`, `configuracoes_json`, `data_criacao`).
  - Relacionamentos:
    - `Empresa 1 : N Recrutador`
    - `Empresa 1 : N Vaga`
- [ ] **Isolamento de Dados (Tenant Scoping):**
  - Criar dependência/middleware `get_current_tenant` a partir do token JWT do recrutador autenticado.
  - Aplicar filtro obrigatório de `empresa_id` em todas as consultas e operações em `Vaga`, `Candidatura`, `Habilidade` e `Relatorio`.
- [ ] **Endpoints de Gestão de Empresa e Equipe:**
  - `POST /empresas/`: Cadastro de nova empresa (onboarding).
  - `GET /empresas/me`: Dados da empresa do usuário autenticado.
  - `GET /empresas/me/recrutadores`: Listagem de recrutadores da organização.
  - `POST /empresas/me/convites`: Envio de convite para novos recrutadores da mesma empresa.

### 🎨 Frontend
- [ ] **Fluxo de Onboarding & Cadastro de Empresa:**
  - Atualizar telas de registro (`/cadastro`) com opção de criar uma nova empresa ou ingressar via convite.
- [ ] **Gerenciamento de Equipe em Configurações:**
  - Nova aba *Empresa & Equipe* em `/configuracoes` para visualizar membros da empresa, seus cargos e convidar novos recrutadores.
- [ ] **Contexto Global de Tenant (`TenantContext`):**
  - Gerenciar no estado global os dados da empresa ativa (nome, logo no cabeçalho e preferências corporativas).

---

## 🚀 Ordem de Execução Recomendada

1. **Feature 3 (Refinar Prompts IA)** — *Rápida entrega e impacto imediato na qualidade da avaliação.*
2. **Feature 4 (Melhorar Identidade Visual & Logo)** — *Define o padrão estético e componentes visuais para as próximas telas.*
3. **Feature 1 (Aba Configurações & Skills)** — *Habilita o catálogo base de competências e configurações do recrutador.*
4. **Feature 2 (Aprimorar Relatórios)** — *Consolida métricas, notas médias reais e relatórios por vaga.*
5. **Feature 5 (Multi-tenant)** — *Estrutura arquitetural robusta para suportar múltiplas empresas e times de recrutamento.*
