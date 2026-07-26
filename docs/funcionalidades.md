# Funcionalidades

O que existe hoje, tela por tela.

## Dashboard (`/`)

Visão geral: total de vagas abertas, candidatos, entrevistas em andamento e
concluídas, mais a lista das vagas mais recentes.

## Vagas (`/vagas`)

Lista as vagas cadastradas em cards (título, descrição, badge de status
agregado e avatares dos candidatos). Botão **Nova vaga** abre um diálogo para
preencher título, descrição, modalidade, localização, experiência esperada e
hard/soft skills com peso (slider). O perfil comportamental ideal (radar de 20
traços) ainda não tem UI própria nesse fluxo — toda vaga nova é criada com um
perfil neutro (5/10 em todos os traços).

## Detalhe da vaga (`/vagas/[id]`)

Mostra os dados da vaga (skills com peso, modalidade, localização) e a lista
de candidatos, ordenada por nota (quem não tem nota ainda vai para o fim), com
alternância entre visualização em grade e lista.

Clicar em um candidato abre um **modal** com:

- Dados da candidatura (email, telefone, CPF, LinkedIn, nome do currículo)
- Radar do perfil comportamental avaliado (só leitura) — ou um aviso, se a
  entrevista ainda não terminou
- Botão **Ver chat**, que leva para a conversa desse candidato

## Chat da entrevista

Duas rotas equivalentes, que renderizam a mesma tela (`ChatConversa`):

- `/chat/[vagaId]/[candidatoId]` — endereço direto
- `/vagas/[id]/[candidatoId]/chat` — acessado pelo modal do candidato, na
  aba de vagas

Mostra o cabeçalho do candidato (nome, vaga, badge de status), o histórico de
mensagens (bolhas de texto/áudio, a IA enviando à direita e o candidato
respondendo à esquerda) e um aviso de "entrevista finalizada" quando aplicável.
Essa tela não tem sidebar — usa a largura toda, com o toggle de tema flutuando
no canto superior direito.

## Candidatura pública (`/candidatura/[id]`)

Página pública (sem navegação do app) onde um candidato se inscreve para uma
vaga: nome, CPF (ou "não sou brasileiro"), email, telefone, LinkedIn e upload
de currículo (PDF). Ao enviar, cria um `Candidato` com status `aguardando`.

## Relatórios (`/relatorios`)

Indicadores agregados (vagas, candidatos, finalizados, nota média), funil de
status dos candidatos e distribuição de notas, calculados a partir do que
estiver no storage.

## Login (`/login`) e Cadastro (`/cadastro`)

Telas de autenticação com um painel de marca ao lado do formulário (esconde no
mobile). O formulário em si ainda não fala com nenhum backend — só valida os
campos e loga no console (ver `TODO` nos arquivos).

## Página 404

Rota inexistente cai numa página personalizada, com a marca em tom apagado e
um botão que "enche de líquido" ao passar o mouse.

## Navegação

- Sidebar aparece nas rotas normais do app (Dashboard, Vagas, Relatórios) e
  esconde em login, cadastro, candidatura pública e chat — nessas o toggle de
  tema flutua no canto da tela em vez de morar na sidebar.
- No desktop a sidebar pode ser recolhida para só ícones; no mobile vira um
  menu em gaveta.
