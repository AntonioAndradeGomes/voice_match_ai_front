// MOCK: conversa de demonstração para visualizar o layout do chat antes de
// existir um backend real gerando vagas/candidatos/mensagens. A tela em
// src/app/chat/page.tsx só usa isso como fallback quando getCandidatos() vem
// vazio — assim que o storage passar a ter dados de verdade (hoje via
// localStorage, depois via API), este mock deixa de aparecer sozinho, sem
// precisar mexer na tela.

import { criarPerfilNeutro } from "@/types";
import type { Candidato, MensagemChat, Vaga } from "@/types";

const AGORA = Date.now();
const minutosAtras = (min: number) =>
    new Date(AGORA - min * 60_000).toISOString();

export const MOCK_VAGA: Vaga = {
    id: "1",
    titulo: "Desenvolvedor(a) Frontend Pleno",
    area: "Engenharia",
    funcao: "Frontend",
    descricaoFuncao:
        "Manutenção e evolução dos produtos web da empresa, com foco em React.",
    hardSkills: ["React", "TypeScript", "CSS"],
    softSkills: ["Comunicação", "Autonomia"],
    experienciaPrevia: "2+ anos com React em produção",
    perfilIdeal: criarPerfilNeutro(),
    createdAt: minutosAtras(120),
};

export const MOCK_CANDIDATO: Candidato = {
    id: "1",
    vagaId: MOCK_VAGA.id,
    nome: "Marina Alves",
    avatarUrl: null,
    status: "finalizado",
    perfilAvaliado: null,
    notaFinal: 87,
    pontosFortes: ["Comunicação clara", "Domínio técnico de React"],
    pontosFracos: ["Pouca experiência com times grandes"],
    melhorias: ["Aprofundar em testes automatizados"],
    createdAt: minutosAtras(60),
};

export const MOCK_MENSAGENS: MensagemChat[] = [
    {
        id: "mock-msg-1",
        candidatoId: MOCK_CANDIDATO.id,
        autor: "ia",
        tipo: "texto",
        conteudo:
            "Olá Marina! Sou a assistente de entrevistas da VoiceMatchAi. Podemos começar?",
        timestamp: minutosAtras(58),
    },
    {
        id: "mock-msg-2",
        candidatoId: MOCK_CANDIDATO.id,
        autor: "candidato",
        tipo: "audio",
        conteudo: "Oi, tudo bem! Pode começar sim.",
        duracaoAudio: 8,
        timestamp: minutosAtras(57),
    },
    {
        id: "mock-msg-3",
        candidatoId: MOCK_CANDIDATO.id,
        autor: "ia",
        tipo: "texto",
        conteudo:
            "Conte um pouco sobre um projeto em React que te orgulha e qual foi seu papel nele.",
        timestamp: minutosAtras(56),
    },
    {
        id: "mock-msg-4",
        candidatoId: MOCK_CANDIDATO.id,
        autor: "candidato",
        tipo: "audio",
        conteudo:
            "Liderei a refatoração do checkout de um e-commerce, migrando de Redux para Zustand e reduzindo o bundle em 32%. Trabalhei junto com design para revisar a jornada e subimos a conversão em 11%.",
        duracaoAudio: 47,
        timestamp: minutosAtras(54),
    },
    {
        id: "mock-msg-5",
        candidatoId: MOCK_CANDIDATO.id,
        autor: "ia",
        tipo: "texto",
        conteudo: "Ótimo! Como você garante qualidade de código em um time?",
        timestamp: minutosAtras(53),
    },
    {
        id: "mock-msg-6",
        candidatoId: MOCK_CANDIDATO.id,
        autor: "candidato",
        tipo: "audio",
        conteudo:
            "Code review em toda PR, testes automatizados nas regras de negócio críticas e CI bloqueando merge se algo quebrar.",
        duracaoAudio: 33,
        timestamp: minutosAtras(51),
    },
];
