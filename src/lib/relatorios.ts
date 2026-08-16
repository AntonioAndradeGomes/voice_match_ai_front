// Agregações dos relatórios. Camada pura: recebe as entidades já carregadas e
// devolve números prontos para desenhar — não toca em localStorage nem em React,
// então continua valendo quando `storage.ts` virar chamada de API.

import type { StatusCandidato, Vaga } from "@/types";

/**
 * O mínimo que as agregações precisam saber de um candidato. `Candidato`
 * completo encaixa aqui por estrutura, mas a página de Relatórios também monta
 * estas linhas direto das candidaturas do backend — uma linha por candidatura,
 * que é a unidade certa: a mesma pessoa em duas vagas conta duas vezes no
 * funil e no gráfico por vaga.
 */
export interface CandidatoRelatorio {
    vagaId: string;
    status: StatusCandidato;
    notaFinal: number | null;
}

// Ordem do funil: aguardando → em entrevista → finalizado. É ordinal (trocar a
// ordem muda o significado), por isso a cor destas etapas usa rampa de um tom só.
export const STATUS_ORDEM = [
    "aguardando",
    "em_entrevista",
    "finalizado",
] as const satisfies readonly StatusCandidato[];

export const STATUS_LABEL: Record<StatusCandidato, string> = {
    aguardando: "Aguardando",
    em_entrevista: "Em entrevista",
    finalizado: "Finalizado",
};

// Escala dos dados locais (o seed guarda notas como 87, 92…). O backend real
// dá `score_geral` de 0 a 10 — por isso a escala é parâmetro de
// `distribuirNotas`, e esta constante ficou como padrão do modo local.
export const NOTA_MAXIMA = 100;
/** Escala do `score_geral` das entrevistas do backend. */
export const NOTA_MAXIMA_BACKEND = 10;
const FAIXAS_DE_NOTA = 5;

export interface ResumoRelatorio {
    totalVagas: number;
    totalCandidatos: number;
    finalizados: number;
    /** `null` quando nenhum candidato foi avaliado ainda — não é o mesmo que 0. */
    notaMedia: number | null;
}

export function calcularResumo(
    vagas: Vaga[],
    candidatos: CandidatoRelatorio[],
): ResumoRelatorio {
    const notas = candidatos
        .map((candidato) => candidato.notaFinal)
        .filter((nota): nota is number => nota !== null);

    return {
        totalVagas: vagas.length,
        totalCandidatos: candidatos.length,
        finalizados: candidatos.filter(
            (candidato) => candidato.status === "finalizado",
        ).length,
        notaMedia: notas.length
            ? notas.reduce((soma, nota) => soma + nota, 0) / notas.length
            : null,
    };
}

export interface EtapaFunil {
    status: StatusCandidato;
    label: string;
    total: number;
    /** Fração de 0 a 1 sobre o total de candidatos; 0 quando não há candidatos. */
    fracao: number;
}

export function montarFunil(candidatos: CandidatoRelatorio[]): EtapaFunil[] {
    return STATUS_ORDEM.map((status) => {
        const total = candidatos.filter(
            (candidato) => candidato.status === status,
        ).length;
        return {
            status,
            label: STATUS_LABEL[status],
            total,
            fracao: candidatos.length ? total / candidatos.length : 0,
        };
    });
}

export interface TotalPorVaga {
    vagaId: string;
    titulo: string;
    total: number;
}

/**
 * Vagas ordenadas por volume de candidatos. Passe `limite` para cortar a cauda:
 * o excedente vira uma linha "Outras vagas" em vez de virar mais uma cor.
 */
export function contarCandidatosPorVaga(
    vagas: Vaga[],
    candidatos: CandidatoRelatorio[],
    limite?: number,
): TotalPorVaga[] {
    const ordenadas = vagas
        .map((vaga) => ({
            vagaId: vaga.id,
            titulo: vaga.titulo,
            total: candidatos.filter(
                (candidato) => candidato.vagaId === vaga.id,
            ).length,
        }))
        .sort((a, b) => b.total - a.total);

    if (limite === undefined || ordenadas.length <= limite) return ordenadas;

    const visiveis = ordenadas.slice(0, limite);
    const cauda = ordenadas.slice(limite);
    return [
        ...visiveis,
        {
            vagaId: "__outras__",
            titulo: `Outras vagas (${cauda.length})`,
            total: cauda.reduce((soma, vaga) => soma + vaga.total, 0),
        },
    ];
}

export interface FaixaDeNota {
    label: string;
    min: number;
    max: number;
    total: number;
}

/**
 * Histograma das notas finais em faixas de largura fixa. Candidatos sem nota
 * (ainda não avaliados) ficam de fora — entram na contagem de "sem nota".
 */
export function distribuirNotas(
    candidatos: CandidatoRelatorio[],
    notaMaxima: number = NOTA_MAXIMA,
): FaixaDeNota[] {
    const largura = notaMaxima / FAIXAS_DE_NOTA;
    const notas = candidatos
        .map((candidato) => candidato.notaFinal)
        .filter((nota): nota is number => nota !== null);

    return Array.from({ length: FAIXAS_DE_NOTA }, (_, indice) => {
        const min = indice * largura;
        const max = min + largura;
        const ultima = indice === FAIXAS_DE_NOTA - 1;

        return {
            label: `${min}–${max}`,
            min,
            max,
            // A última faixa é fechada nos dois lados para não perder a nota máxima.
            total: notas.filter(
                (nota) => nota >= min && (ultima ? nota <= max : nota < max),
            ).length,
        };
    });
}

export function contarSemNota(candidatos: CandidatoRelatorio[]): number {
    return candidatos.filter((candidato) => candidato.notaFinal === null)
        .length;
}
