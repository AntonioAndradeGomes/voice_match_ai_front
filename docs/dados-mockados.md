# Dados e mocks

Não existe backend ainda. Este documento explica onde os dados vêm de
verdade, o que é simulado e como isso deve ser trocado quando a API existir.

## Camada de dados (`src/lib/storage.ts`)

Todas as telas leem/escrevem por essa camada — nenhuma acessa `localStorage`
direto. A ideia é que, quando existir um backend, só o corpo dessas funções
mude (`getVagas`, `saveVaga`, `getCandidatosByVaga`, `saveMensagem`, etc.); as
assinaturas continuam as mesmas e nenhuma tela precisa mudar.

`migracoes.ts` normaliza vagas que foram salvas num formato antigo de `Vaga`
(antes de existirem `descricao`/`modalidade`/`localizacao` e skills com peso),
para não quebrar quem já tinha dado salvo.

## Dados de teste (`src/lib/seed.ts`)

Quando `getVagas()` volta vazio, `carregarVagasComCandidatos()` (em
`src/app/vagas/page.tsx`) chama `seedDadosTeste()`, que grava:

- 1 vaga ("Desenvolvedor(a) Frontend Pleno")
- 3 candidatos, um em cada status (`aguardando`, `em_entrevista`,
  `finalizado`), cada um com dados de candidatura preenchidos
- Mensagens de chat para os dois que já começaram a entrevista
- Um perfil comportamental avaliado (não neutro) para a candidata finalizada,
  para o radar ter uma forma de verdade

Isso roda automaticamente em qualquer ambiente (inclusive builds de produção
na Vercel) porque o storage é local a cada navegador — não é um banco
compartilhado, então não tem risco de um visitante ver dado de outro.

## Chat mockado (`src/lib/chat-mock.ts` + `src/lib/chat.ts`)

`carregarConversa(candidatoId, vagaId)` busca o candidato de verdade no
storage; se não encontrar, cai numa conversa de demonstração fixa (Marina
Alves, id `1`) só para dar para ver o layout do chat. Assim que o candidato
existir no storage de verdade, o mock para de aparecer sozinho — não precisa
mexer na tela.

## Áudio do chat (`src/_components/ui/audio-player.tsx`)

O player de áudio das bolhas do chat é um componente **reutilizável**, sem
nenhuma dependência do domínio — recebe só uma `src` (URL de áudio) e toca de
verdade (play/pause, progresso real na onda, duração do arquivo), pausando
qualquer outro áudio que esteja tocando na página. Dá para usar em qualquer
tela, bastando importar `AudioPlayer` e passar a URL que vier do back-end.

Os arquivos usados hoje (`public/audio/*.wav`) não são gravações reais — são
falas sintetizadas (texto → voz, TTS) a partir do texto de cada mensagem
mockada, geradas uma única vez e commitadas como arquivo estático. Não tem
nada sendo gerado em tempo real: é só um áudio comum sendo servido por URL,
igual seria um áudio vindo de uma API de verdade.

## Funções que ainda não existem de verdade (`src/lib/ai-stubs.ts`)

Marcadas com `STUB` no comentário — a assinatura é definitiva, mas hoje só dão
`throw`:

- `generateInterviewQuestions` — geração das perguntas da entrevista via LLM
- `simulateCandidateAnswer` — transcrição/avaliação da resposta em áudio
- `calculateScore` — nota final a partir da comparação de perfis

## Formulários sem backend

**Login** e **cadastro de recrutador** só validam os campos e dão
`console.log` no submit — não persistem nada (os `TODO`s nos respectivos
arquivos apontam onde ligar a API quando existir; hoje nem o cadastro de
recrutador com senha está exposto).

Já a **candidatura pública** funciona de ponta a ponta dentro do modelo
mockado: o submit valida os campos e chama `saveCandidato` de verdade,
criando um `Candidato` com status `aguardando` no storage. O arquivo do
currículo em si não é persistido (só o nome, em `curriculoNome`) — quando
existir backend, isso vira upload real.
