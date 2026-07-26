export const TRAITS = [
    "equipe",
    "proatividade",
    "resiliencia",
    "foco_em_resultado",
    "negociacao",
    "relacao_hierarquica",
    "resolucao_de_conflito",
    "inovacao",
    "acao_sob_pressao",
    "assertividade",
    "autenticidade",
    "autonomia",
    "comunicabilidade",
    "cuidado",
    "disciplina",
    "empenho",
    "flexibilidade",
    "seguranca",
    "tranquilidade",
    "vitalidade_corporal",
] as const;

export type Trait = (typeof TRAITS)[number];

export type PerfilComportamental = Record<Trait, number>;

// Perfil neutro (5/10 em todos os traços), usado como valor inicial de
// perfilIdeal enquanto o editor de radar (próxima etapa) ainda não existe.
export function criarPerfilNeutro(): PerfilComportamental {
    return Object.fromEntries(
        TRAITS.map((trait) => [trait, 5]),
    ) as PerfilComportamental;
}

export interface SkillComPeso {
    nome: string;
    peso: number;
}

export const MODALIDADES = ["presencial", "hibrido", "remoto"] as const;

export type Modalidade = (typeof MODALIDADES)[number];

export const MODALIDADE_LABEL: Record<Modalidade, string> = {
    presencial: "Presencial",
    hibrido: "Híbrido",
    remoto: "Remoto",
};

export interface Vaga {
    id: string;
    titulo: string;
    descricao: string;
    hardSkills: SkillComPeso[];
    softSkills: SkillComPeso[];
    experienciaPrevia: string;
    modalidade: Modalidade;
    // Só faz sentido quando `modalidade` é "presencial" ou "hibrido"; vazia em "remoto".
    localizacao: string;
    perfilIdeal: PerfilComportamental;
    createdAt: string;
}

export type StatusCandidato = "aguardando" | "em_entrevista" | "finalizado";

/**
 * O que o próprio candidato preenche na página pública da vaga. Separado do
 * resto de `Candidato` porque é dado de inscrição, não de avaliação.
 */
export interface DadosInscricao {
    email: string;
    /** Só dígitos, sem máscara. `null` quando o candidato não é brasileiro. */
    cpf: string | null;
    telefone: string;
    linkedin: string;
    /**
     * Apenas o nome do arquivo. O binário não vai para o localStorage — quando
     * existir backend, aqui entra a URL do currículo no storage remoto.
     */
    curriculoNome: string;
}

export interface Candidato {
    id: string;
    vagaId: string;
    nome: string;
    avatarUrl: string | null;
    status: StatusCandidato;
    /** Ausente nos candidatos criados antes da página pública de candidatura. */
    inscricao?: DadosInscricao;
    perfilAvaliado: PerfilComportamental | null;
    notaFinal: number | null;
    pontosFortes: string[] | null;
    pontosFracos: string[] | null;
    melhorias: string[] | null;
    createdAt: string;
}

export type AutorMensagem = "ia" | "candidato";
export type TipoMensagem = "texto" | "audio";

export interface MensagemChat {
    id: string;
    candidatoId: string;
    autor: AutorMensagem;
    tipo: TipoMensagem;
    conteudo: string;
    perguntaRelacionada?: Trait[];
    timestamp: string;
    duracaoAudio?: number;
}
