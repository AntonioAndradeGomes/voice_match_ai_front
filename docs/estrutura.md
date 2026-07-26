# Estrutura

## Rotas (`src/app`)

```
/                                    Dashboard
/vagas                               Lista de vagas
/vagas/[id]                          Detalhe da vaga + candidatos
/vagas/[id]/[candidatoId]/chat       Chat (mesma tela de /chat/...)
/chat/[vagaId]/[candidatoId]         Chat (endereço direto)
/candidatura/[id]                    Formulário público de inscrição
/relatorios                          Relatórios agregados
/login                               Login
/cadastro                            Cadastro de recrutador
/icon.svg                            Favicon (convenção do Next)
not-found.tsx                        404 (cobre qualquer rota inexistente)
```

`layout.tsx` é o layout raiz: fontes, `ThemeProvider`, `TooltipProvider`,
`Sidebar` e o toggle de tema flutuante (`FloatingThemeToggle`).

## Componentes (`src/_components`)

```
ui/            Primitivos (Base UI + estilo do projeto): button, dialog,
                tabs, tooltip, select, sheet, avatar, badge, card, input...
layout/         Sidebar, ThemeToggle, FloatingThemeToggle e a lógica de
                quais rotas têm navegação (rotas.ts)
auth/           Painel de marca compartilhado por login e cadastro
candidatos/     Modal de detalhe do candidato e o radar de perfil
candidatura/    Formulário público de inscrição
chat/           Header, lista de mensagens, rodapé e bolha de mensagem
relatorios/     Gráficos/cards dos relatórios
vagas/          Diálogo de criação de vaga
```

## Dados (`src/lib`)

Ver [dados-mockados.md](./dados-mockados.md) para o detalhe de cada um.

```
storage.ts       Camada de acesso a dados (hoje localStorage)
migracoes.ts      Normaliza vagas salvas em formatos antigos
seed.ts           Popula dados de teste quando o storage está vazio
chat.ts           Carrega uma conversa (real ou mock) por vaga/candidato
chat-mock.ts       Conversa de demonstração usada como fallback do chat
vaga-status.ts     Deriva badges de status a partir dos candidatos
relatorios.ts     Agregações para a tela de relatórios
inscricao.ts       Máscaras/validações do formulário de candidatura
ai-stubs.ts        Funções que no futuro chamam IA de verdade (hoje throw)
```

## Tipos (`src/types.ts`)

Entidades principais: `Vaga`, `Candidato`, `DadosInscricao`, `MensagemChat`,
`PerfilComportamental` (os 20 `Trait`s do radar comportamental).
