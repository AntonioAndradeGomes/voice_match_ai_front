// Popula o storage com uma vaga e 3 candidatos (um em cada status —
// aguardando, em entrevista e finalizado), pra dar pra clicar em algo de
// verdade sem precisar cadastrar tudo na mão. Roda sozinho (ver
// carregarVagasComCandidatos em src/app/vagas/page.tsx) só quando o storage
// está vazio — não depende de ambiente, já que o storage é local a cada
// navegador (localStorage), não um banco compartilhado.

import { saveCandidato, saveMensagem, saveVaga } from "@/lib/storage";
import { criarPerfilNeutro } from "@/types";
import type {
    Candidato,
    MensagemChat,
    PerfilComportamental,
    Vaga,
} from "@/types";

// Perfil variado (não os 5 neutros) pra dar pra ver o radar de verdade.
const PERFIL_MARINA: PerfilComportamental = {
    ...criarPerfilNeutro(),
    equipe: 7,
    proatividade: 9,
    resiliencia: 8,
    foco_em_resultado: 9,
    negociacao: 6,
    relacao_hierarquica: 4,
    resolucao_de_conflito: 7,
    inovacao: 8,
    acao_sob_pressao: 7,
    assertividade: 8,
    autenticidade: 7,
    autonomia: 9,
    comunicabilidade: 9,
    cuidado: 6,
    disciplina: 8,
    empenho: 9,
    flexibilidade: 7,
    seguranca: 6,
    tranquilidade: 5,
    vitalidade_corporal: 4,
};

const AGORA = Date.now();
const minutosAtras = (min: number) =>
    new Date(AGORA - min * 60_000).toISOString();
const diasAtras = (dias: number) =>
    new Date(AGORA - dias * 24 * 60 * 60_000).toISOString();

const VAGA: Vaga = {
    id: "seed-vaga-frontend",
    titulo: "Desenvolvedor(a) Frontend Pleno",
    descricao:
        "Manutenção e evolução dos produtos web da empresa, com foco em React.",
    hardSkills: [
        { nome: "React", peso: 5 },
        { nome: "TypeScript", peso: 4 },
        { nome: "CSS", peso: 3 },
    ],
    softSkills: [
        { nome: "Comunicação", peso: 4 },
        { nome: "Autonomia", peso: 4 },
    ],
    experienciaPrevia: "Pleno (3-5 anos)",
    modalidade: "remoto",
    localizacao: "",
    perfilIdeal: criarPerfilNeutro(),
    createdAt: diasAtras(6),
};

const CANDIDATOS: Candidato[] = [
    {
        id: "seed-cand-marina",
        vagaId: VAGA.id,
        nome: "Marina Alves",
        avatarUrl: null,
        status: "finalizado",
        perfilAvaliado: PERFIL_MARINA,
        notaFinal: 87,
        pontosFortes: ["Comunicação clara", "Domínio técnico de React"],
        pontosFracos: ["Pouca experiência com times grandes"],
        melhorias: ["Aprofundar em testes automatizados"],
        createdAt: diasAtras(5),
        inscricao: {
            email: "marina.alves@example.com",
            cpf: "12345678900",
            telefone: "(11) 98888-7777",
            linkedin: "https://linkedin.com/in/marina-alves",
            curriculoNome: "marina-alves-cv.pdf",
        },
    },
    {
        id: "seed-cand-bruno",
        vagaId: VAGA.id,
        nome: "Bruno Castro",
        avatarUrl: null,
        status: "em_entrevista",
        perfilAvaliado: null,
        notaFinal: null,
        pontosFortes: null,
        pontosFracos: null,
        melhorias: null,
        createdAt: diasAtras(2),
        inscricao: {
            email: "bruno.castro@example.com",
            cpf: "98765432100",
            telefone: "(21) 97777-6666",
            linkedin: "https://linkedin.com/in/bruno-castro",
            curriculoNome: "bruno-castro-cv.pdf",
        },
    },
    {
        id: "seed-cand-julia",
        vagaId: VAGA.id,
        nome: "Júlia Nakamura",
        avatarUrl: null,
        status: "aguardando",
        perfilAvaliado: null,
        notaFinal: null,
        pontosFortes: null,
        pontosFracos: null,
        melhorias: null,
        createdAt: diasAtras(1),
        inscricao: {
            email: "julia.nakamura@example.com",
            cpf: "11122233344",
            telefone: "(31) 96666-5555",
            linkedin: "https://linkedin.com/in/julia-nakamura",
            curriculoNome: "julia-nakamura-cv.pdf",
        },
    },
];

const MENSAGENS: MensagemChat[] = [
    {
        id: "seed-msg-marina-1",
        candidatoId: "seed-cand-marina",
        autor: "ia",
        tipo: "texto",
        conteudo:
            "Olá Marina! Sou a assistente de entrevistas da VoiceMatchAi. Podemos começar?",
        timestamp: minutosAtras(58),
    },
    {
        id: "seed-msg-marina-2",
        candidatoId: "seed-cand-marina",
        autor: "candidato",
        tipo: "audio",
        conteudo: "Oi, tudo bem! Pode começar sim.",
        duracaoAudio: 5,
        audioUrl: "/audio/saudacao-marina.wav",
        timestamp: minutosAtras(57),
    },
    {
        id: "seed-msg-marina-3",
        candidatoId: "seed-cand-marina",
        autor: "ia",
        tipo: "texto",
        conteudo:
            "Conte um pouco sobre um projeto em React que te orgulha e qual foi seu papel nele.",
        timestamp: minutosAtras(56),
    },
    {
        id: "seed-msg-marina-4",
        candidatoId: "seed-cand-marina",
        autor: "candidato",
        tipo: "audio",
        conteudo:
            "Liderei a refatoração do checkout de um e-commerce, migrando de Redux para Zustand e reduzindo o bundle em 32%.",
        duracaoAudio: 10,
        audioUrl: "/audio/projeto-react-curto.wav",
        timestamp: minutosAtras(54),
    },
    {
        id: "seed-msg-bruno-1",
        candidatoId: "seed-cand-bruno",
        autor: "ia",
        tipo: "texto",
        conteudo:
            "Olá Bruno! Sou a assistente de entrevistas da VoiceMatchAi. Podemos começar?",
        timestamp: minutosAtras(20),
    },
    {
        id: "seed-msg-bruno-2",
        candidatoId: "seed-cand-bruno",
        autor: "candidato",
        tipo: "audio",
        conteudo: "Claro, pode mandar a primeira pergunta.",
        duracaoAudio: 4,
        audioUrl: "/audio/bruno-resposta.wav",
        timestamp: minutosAtras(19),
    },
    {
        id: "seed-msg-bruno-3",
        candidatoId: "seed-cand-bruno",
        autor: "ia",
        tipo: "texto",
        conteudo: "Como você lida com prazos apertados em sprints curtas?",
        timestamp: minutosAtras(18),
    },
];

export function seedDadosTeste() {
    saveVaga(VAGA);
    CANDIDATOS.forEach(saveCandidato);
    MENSAGENS.forEach(saveMensagem);
}
