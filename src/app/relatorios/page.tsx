"use client";

import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/_components/ui/alert";
import { CandidatosPorVaga } from "@/_components/relatorios/candidatos-por-vaga";
import { DistribuicaoNotas } from "@/_components/relatorios/distribuicao-notas";
import { FunilStatus } from "@/_components/relatorios/funil-status";
import { Card, CardContent } from "@/_components/ui/card";
import { ScrollArea } from "@/_components/ui/scroll-area";
import { RelatoriosSkeleton } from "@/_components/layout/skeletons";
import { API_BASE_URL, apiFetch } from "@/lib/api";
import {
    calcularResumo,
    contarCandidatosPorVaga,
    contarSemNota,
    distribuirNotas,
    montarFunil,
    NOTA_MAXIMA,
    NOTA_MAXIMA_BACKEND,
    type CandidatoRelatorio,
    type EtapaFunil,
    type FaixaDeNota,
    type ResumoRelatorio,
    type TotalPorVaga,
} from "@/lib/relatorios";
import {
    getCandidatos,
    getVagas,
    mapearStatusCandidatura,
} from "@/lib/storage";

// Acima disso a cauda vira uma linha "Outras vagas" — mais barras não contam
// história melhor, só espremem as que importam.
const VAGAS_NO_GRAFICO = 8;

interface DadosRelatorio {
    resumo: ResumoRelatorio;
    funil: EtapaFunil[];
    porVaga: TotalPorVaga[];
    faixas: FaixaDeNota[];
    semNota: number;
    /** 10 quando as notas vêm das entrevistas do backend; 100 no modo local. */
    notaMaxima: number;
    fonte: "backend" | "local";
}

interface CandidaturaApi {
    id: string;
    vaga_id: string;
    status: string;
}

interface EntrevistaApi {
    status?: string;
    score_geral?: number | string | null;
}

/**
 * Monta os relatórios a partir do que o backend responde: as candidaturas dão
 * o funil e o volume por vaga; as entrevistas dão as notas. Qualquer falha nas
 * chamadas centrais derruba para o modo local — quem decide é o `try` de
 * `carregarRelatorios`.
 */
async function carregarDoBackend(): Promise<DadosRelatorio> {
    const [vagas, resCandidatos, resCandidaturas] = await Promise.all([
        getVagas(),
        apiFetch(`${API_BASE_URL}/candidatos`),
        apiFetch(`${API_BASE_URL}/candidaturas`),
    ]);

    if (!resCandidatos.ok || !resCandidaturas.ok) {
        throw new Error("backend respondeu com erro");
    }

    const pessoas: unknown = await resCandidatos.json();
    const candidaturas: unknown = await resCandidaturas.json();
    if (!Array.isArray(pessoas) || !Array.isArray(candidaturas)) {
        throw new Error("resposta inesperada do backend");
    }

    // Uma chamada de entrevistas por candidatura. É N+1, mas é o que a API
    // oferece hoje — mesmo desenho da página da vaga. Falha individual não
    // derruba o relatório: aquela candidatura só fica sem nota.
    const linhas: CandidatoRelatorio[] = await Promise.all(
        (candidaturas as CandidaturaApi[]).map(async (cand) => {
            let notaFinal: number | null = null;
            let concluida = false;

            try {
                const res = await apiFetch(
                    `${API_BASE_URL}/candidaturas/${cand.id}/entrevistas`,
                );
                if (res.ok) {
                    const entrevistas: EntrevistaApi[] = await res.json();
                    if (Array.isArray(entrevistas) && entrevistas.length > 0) {
                        const ultima = entrevistas[0];
                        const score = Number(ultima.score_geral);
                        // `score_geral` vem como string em alguns drivers e
                        // `Number(null)` é 0 — só aceita número finito de valor
                        // não-nulo.
                        if (
                            ultima.score_geral !== null &&
                            ultima.score_geral !== undefined &&
                            Number.isFinite(score)
                        ) {
                            notaFinal = score;
                        }
                        concluida = ultima.status === "concluida";
                    }
                }
            } catch {
                // Sem entrevista acessível: a candidatura conta no funil pelo
                // status dela, só não contribui com nota.
            }

            // Mesma inferência da página da vaga: entrevista concluída ou com
            // nota vale como finalizado, mesmo que o status da candidatura
            // ainda não tenha avançado.
            let status = mapearStatusCandidatura(cand.status);
            if (concluida || notaFinal !== null) status = "finalizado";

            return { vagaId: cand.vaga_id, status, notaFinal };
        }),
    );

    const resumo = calcularResumo(vagas, linhas);
    // O card "Candidatos" conta pessoas; o funil conta candidaturas. Com uma
    // pessoa em duas vagas os dois números divergem — e devem divergir.
    resumo.totalCandidatos = pessoas.length;

    return {
        resumo,
        funil: montarFunil(linhas),
        porVaga: contarCandidatosPorVaga(vagas, linhas, VAGAS_NO_GRAFICO),
        faixas: distribuirNotas(linhas, NOTA_MAXIMA_BACKEND),
        semNota: contarSemNota(linhas),
        notaMaxima: NOTA_MAXIMA_BACKEND,
        fonte: "backend",
    };
}

/** O caminho antigo, intacto: localStorage com seed de demonstração. */
async function carregarLocal(): Promise<DadosRelatorio> {
    const vagas = await getVagas();
    const candidatos = await getCandidatos();

    return {
        resumo: calcularResumo(vagas, candidatos),
        funil: montarFunil(candidatos),
        porVaga: contarCandidatosPorVaga(vagas, candidatos, VAGAS_NO_GRAFICO),
        faixas: distribuirNotas(candidatos),
        semNota: contarSemNota(candidatos),
        notaMaxima: NOTA_MAXIMA,
        fonte: "local",
    };
}

async function carregarRelatorios(): Promise<DadosRelatorio> {
    try {
        return await carregarDoBackend();
    } catch {
        return carregarLocal();
    }
}

/**
 * Indicador da linha de destaques. Número com algarismos proporcionais — a
 * `tabular-nums` deixa valores grandes soltos; ela é para coluna de tabela.
 */
function Indicador({ label, valor }: { label: string; valor: string }) {
    return (
        <Card size="sm">
            <CardContent className="flex flex-col gap-1 p-4">
                <span className="font-heading text-2xl font-semibold tracking-tight">
                    {valor}
                </span>
                <span className="text-xs text-muted-foreground">{label}</span>
            </CardContent>
        </Card>
    );
}

const RELATORIO_VAZIO: DadosRelatorio = {
    resumo: {
        totalVagas: 0,
        totalCandidatos: 0,
        finalizados: 0,
        notaMedia: null,
    },
    funil: [],
    porVaga: [],
    faixas: [],
    semNota: 0,
    notaMaxima: NOTA_MAXIMA_BACKEND,
    fonte: "backend",
};

export default function RelatoriosPage() {
    const [dados, setDados] = useState<DadosRelatorio | null>(null);

    useEffect(() => {
        carregarRelatorios().then(setDados);
    }, []);

    // `null` enquanto não montou: evita piscar "0 vagas" antes de ler o storage.
    const carregando = dados === null;
    const { resumo, funil, porVaga, faixas, semNota, notaMaxima, fonte } =
        dados ?? RELATORIO_VAZIO;

    return (
        <ScrollArea className="h-full">
            <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
                <header className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Relatórios
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Visão consolidada das vagas, do funil de candidatos e
                        das notas das entrevistas.
                    </p>
                </header>

                {carregando ? (
                    <RelatoriosSkeleton />
                ) : (
                    <>
                        {/* O fallback local existe para demonstração, mas não
                            pode se passar por dado real — números inventados
                            num relatório são piores que nenhum número. */}
                        {fonte === "local" && (
                            <Alert>
                                <WifiOff />
                                <AlertTitle>
                                    Sem conexão com o servidor
                                </AlertTitle>
                                <AlertDescription>
                                    Exibindo dados locais de demonstração. Os
                                    números abaixo não refletem o banco real —
                                    recarregue quando o backend voltar.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Indicador
                                label="Vagas cadastradas"
                                valor={String(resumo.totalVagas)}
                            />
                            <Indicador
                                label="Candidatos"
                                valor={String(resumo.totalCandidatos)}
                            />
                            <Indicador
                                label="Entrevistas concluídas"
                                valor={String(resumo.finalizados)}
                            />
                            <Indicador
                                label="Nota média"
                                valor={
                                    resumo.notaMedia === null
                                        ? "—"
                                        : `${resumo.notaMedia.toFixed(1)}/${notaMaxima}`
                                }
                            />
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <FunilStatus etapas={funil} />
                            <CandidatosPorVaga vagas={porVaga} />
                        </div>

                        <DistribuicaoNotas
                            faixas={faixas}
                            semNota={semNota}
                            notaMaxima={notaMaxima}
                        />
                    </>
                )}
            </div>
        </ScrollArea>
    );
}
