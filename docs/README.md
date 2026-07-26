# VoiceMatchAi — Front-end

Documentação simples do que já existe no front. Vai crescendo conforme o
projeto avança — por enquanto é só um retrato do estado atual.

## O que é

Plataforma para recrutadores criarem vagas, acompanharem candidatos e
entrevistas conduzidas por IA via chat (perguntas por texto/WhatsApp, respostas
em áudio), com avaliação de perfil comportamental (radar de 20 traços).

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** para estilo
- **Base UI** (`@base-ui/react`) para os primitivos de UI (dialog, tabs,
  tooltip, select, sheet, etc.) — os componentes ficam em `src/_components/ui`
- **motion** (`motion/react`) para as animações (sidebar, chat, diálogos, 404)
- **react-hook-form** para os formulários (login, cadastro, candidatura, nova
  vaga)
- **next-themes** para o tema claro/escuro

Não tem backend nem banco de dados ainda. Tudo é persistido em
`localStorage` do navegador — ver [dados-mockados.md](./dados-mockados.md).

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:3000`. Na primeira visita a `/vagas` com o storage
vazio, uma vaga de teste com 3 candidatos (um em cada status) é criada
automaticamente — não precisa cadastrar nada na mão para começar a navegar.

## Outros documentos

- [funcionalidades.md](./funcionalidades.md) — o que cada tela faz hoje
- [estrutura.md](./estrutura.md) — organização de pastas e rotas
- [dados-mockados.md](./dados-mockados.md) — camada de dados, o que é
  simulado/stub e o que já é "real" (só que local)
