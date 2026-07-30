// Popula o storage com uma vaga e 3 candidatos (um em cada status —
// aguardando, em entrevista e finalizado), pra dar pra clicar em algo de
// verdade sem precisar cadastrar tudo na mão. Roda sozinho (ver
// carregarVagasComCandidatos em src/app/vagas/page.tsx) só quando o storage
// está vazio — não depende de ambiente, já que o storage é local a cada
// navegador (localStorage), não um banco compartilhado.

import { saveMensagem } from "@/lib/storage";
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

const VAGAS: Vaga[] = [
    {
        id: "seed-vaga-frontend",
        titulo: "Desenvolvedor(a) Frontend Pleno",
        descricao:
            "Manutenção e evolução dos produtos web da empresa, com foco em React, TypeScript e Next.js.",
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
    },
    {
        id: "seed-vaga-backend",
        titulo: "Desenvolvedor(a) Backend Senior (Python/FastAPI)",
        descricao:
            "Arquitetura e desenvolvimento de microsserviços de inteligência artificial e processamento de áudio.",
        hardSkills: [
            { nome: "Python", peso: 5 },
            { nome: "FastAPI", peso: 5 },
            { nome: "PostgreSQL", peso: 4 },
            { nome: "Docker", peso: 3 },
        ],
        softSkills: [
            { nome: "Resolução de Problemas", peso: 5 },
            { nome: "Trabalho em Equipe", peso: 4 },
        ],
        experienciaPrevia: "Sênior (+5 anos)",
        modalidade: "hibrido",
        localizacao: "São Paulo - SP",
        perfilIdeal: criarPerfilNeutro(),
        createdAt: diasAtras(4),
    },
    {
        id: "seed-vaga-ux",
        titulo: "Product Designer / UX Specialist",
        descricao:
            "Criação de fluxos e protótipos de alta fidelidade focando na experiência de recrutadores e candidatos.",
        hardSkills: [
            { nome: "Figma", peso: 5 },
            { nome: "Design Systems", peso: 4 },
            { nome: "Pesquisa de Usuário", peso: 4 },
        ],
        softSkills: [
            { nome: "Empatia", peso: 5 },
            { nome: "Escuta Ativa", peso: 5 },
        ],
        experienciaPrevia: "Pleno (3-5 anos)",
        modalidade: "remoto",
        localizacao: "",
        perfilIdeal: criarPerfilNeutro(),
        createdAt: diasAtras(2),
    },
    {
        id: "seed-vaga-data-engineer",
        titulo: "Engenheiro(a) de Dados Pleno",
        descricao:
            "Construção de pipelines de dados em tempo real, ETLs e data warehouse para modelos analíticos.",
        hardSkills: [
            { nome: "Python", peso: 5 },
            { nome: "SQL", peso: 5 },
            { nome: "Spark", peso: 4 },
            { nome: "Airflow", peso: 3 },
        ],
        softSkills: [
            { nome: "Pensamento Analítico", peso: 5 },
            { nome: "Organização", peso: 4 },
        ],
        experienciaPrevia: "Pleno (3-5 anos)",
        modalidade: "remoto",
        localizacao: "",
        perfilIdeal: criarPerfilNeutro(),
        createdAt: diasAtras(5),
    },
    {
        id: "seed-vaga-devops",
        titulo: "Especialista DevOps / SRE",
        descricao:
            "Gerenciamento de infraestrutura cloud na AWS, Kubernetes, CI/CD e monitoramento de observabilidade.",
        hardSkills: [
            { nome: "Kubernetes", peso: 5 },
            { nome: "Terraform", peso: 4 },
            { nome: "AWS", peso: 5 },
            { nome: "Docker", peso: 4 },
        ],
        softSkills: [
            { nome: "Ação Sob Pressão", peso: 5 },
            { nome: "Proatividade", peso: 4 },
        ],
        experienciaPrevia: "Sênior (+5 anos)",
        modalidade: "hibrido",
        localizacao: "Rio de Janeiro - RJ",
        perfilIdeal: criarPerfilNeutro(),
        createdAt: diasAtras(7),
    },
    {
        id: "seed-vaga-qa",
        titulo: "Analista de QA / Testes Automatizados",
        descricao:
            "Garantia de qualidade, elaboração de planos de teste e automação E2E de aplicações web e mobile.",
        hardSkills: [
            { nome: "Cypress", peso: 5 },
            { nome: "Playwright", peso: 4 },
            { nome: "JavaScript", peso: 3 },
        ],
        softSkills: [
            { nome: "Atenção aos Detalhes", peso: 5 },
            { nome: "Comunicação", peso: 4 },
        ],
        experienciaPrevia: "Pleno (3-5 anos)",
        modalidade: "remoto",
        localizacao: "",
        perfilIdeal: criarPerfilNeutro(),
        createdAt: diasAtras(3),
    },
    {
        id: "seed-vaga-pm",
        titulo: "Product Manager (IA & Inovação)",
        descricao:
            "Definição de roadmap do produto de voz, refinamento de backlog e alinhamento de métricas com executivos.",
        hardSkills: [
            { nome: "Gestão de Produto", peso: 5 },
            { nome: "Metodologias Ágeis", peso: 4 },
            { nome: "Métricas de Produto", peso: 4 },
        ],
        softSkills: [
            { nome: "Liderança", peso: 5 },
            { nome: "Visão Estratégica", peso: 5 },
        ],
        experienciaPrevia: "Sênior (+5 anos)",
        modalidade: "presencial",
        localizacao: "São Paulo - SP",
        perfilIdeal: criarPerfilNeutro(),
        createdAt: diasAtras(8),
    },
    {
        id: "seed-vaga-mobile",
        titulo: "Desenvolvedor(a) Mobile React Native",
        descricao:
            "Desenvolvimento e publicação de aplicativos nativos Android e iOS com integração de recursos de áudio.",
        hardSkills: [
            { nome: "React Native", peso: 5 },
            { nome: "TypeScript", peso: 4 },
            { nome: "Expo", peso: 3 },
        ],
        softSkills: [
            { nome: "Resolução de Conflitos", peso: 4 },
            { nome: "Adaptabilidade", peso: 4 },
        ],
        experienciaPrevia: "Pleno (3-5 anos)",
        modalidade: "remoto",
        localizacao: "",
        perfilIdeal: criarPerfilNeutro(),
        createdAt: diasAtras(1),
    },
    {
        id: "seed-vaga-ai-engineer",
        titulo: "Engenheiro(a) de Inteligência Artificial / LLMs",
        descricao:
            "Aprimoramento de modelos de IA de áudio, fine-tuning de LLMs e otimização de agentes conversacionais.",
        hardSkills: [
            { nome: "Python", peso: 5 },
            { nome: "PyTorch", peso: 4 },
            { nome: "LangChain", peso: 4 },
            { nome: "OpenAI API", peso: 5 },
        ],
        softSkills: [
            { nome: "Inovação", peso: 5 },
            { nome: "Curiosidade Técnica", peso: 5 },
        ],
        experienciaPrevia: "Sênior (+5 anos)",
        modalidade: "remoto",
        localizacao: "",
        perfilIdeal: criarPerfilNeutro(),
        createdAt: diasAtras(9),
    },
];

const CANDIDATOS: Candidato[] = [
    {
        id: "seed-cand-marina",
        vagaId: "seed-vaga-frontend",
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
        vagaId: "seed-vaga-frontend",
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
        vagaId: "seed-vaga-frontend",
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
    {
        id: "seed-cand-carlos",
        vagaId: "seed-vaga-backend",
        nome: "Carlos Eduardo",
        avatarUrl: null,
        status: "finalizado",
        perfilAvaliado: PERFIL_MARINA,
        notaFinal: 92,
        pontosFortes: ["Excelente lógica de programação", "Domínio em FastAPI e microsserviços"],
        pontosFracos: ["Comunicação verbal um pouco direta"],
        melhorias: ["Trabalhar liderança de equipes"],
        createdAt: diasAtras(3),
        inscricao: {
            email: "carlos.eduardo@example.com",
            cpf: "44455566677",
            telefone: "(11) 95555-4444",
            linkedin: "https://linkedin.com/in/carlos-eduardo",
            curriculoNome: "carlos-eduardo-cv.pdf",
        },
    },
    {
        id: "seed-cand-ana",
        vagaId: "seed-vaga-ux",
        nome: "Ana Beatriz Rocha",
        avatarUrl: null,
        status: "em_entrevista",
        perfilAvaliado: null,
        notaFinal: null,
        pontosFortes: null,
        pontosFracos: null,
        melhorias: null,
        createdAt: diasAtras(1),
        inscricao: {
            email: "ana.rocha@example.com",
            cpf: "88899900011",
            telefone: "(41) 94444-3333",
            linkedin: "https://linkedin.com/in/ana-rocha",
            curriculoNome: "ana-rocha-cv.pdf",
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
    if (typeof window === "undefined") return;
    window.localStorage.setItem("voicematch:vagas", JSON.stringify(VAGAS));
    window.localStorage.setItem("voicematch:candidatos", JSON.stringify(CANDIDATOS));
    MENSAGENS.forEach(saveMensagem);
}
