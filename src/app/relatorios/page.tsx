"use client";

import { useEffect, useState } from "react";

import { CandidatosPorVaga } from "@/_components/relatorios/candidatos-por-vaga";
import { DistribuicaoNotas } from "@/_components/relatorios/distribuicao-notas";
import { FunilStatus } from "@/_components/relatorios/funil-status";
import { Card, CardContent } from "@/_components/ui/card";
import { ScrollArea } from "@/_components/ui/scroll-area";
import {
    calcularResumo,
    contarCandidatosPorVaga,
    contarSemNota,
    distribuirNotas,
    montarFunil,
    NOTA_MAXIMA,
    type EtapaFunil,
    type FaixaDeNota,
    type ResumoRelatorio,
    type TotalPorVaga,
} from "@/lib/relatorios";
import { getCandidatos, getVagas } from "@/lib/storage";

// Acima disso a cauda vira uma linha "Outras vagas" — mais barras não contam
// história melhor, só espremem as que importam.
const VAGAS_NO_GRAFICO = 8;

interface DadosRelatorio {
    resumo: ResumoRelatorio;
    funil: EtapaFunil[];
    porVaga: TotalPorVaga[];
    faixas: FaixaDeNota[];
    semNota: number;
}

async function carregarRelatorios(): Promise<DadosRelatorio> {
    const vagas = await getVagas();
    const candidatos = getCandidatos();

    return {
        resumo: calcularResumo(vagas, candidatos),
        funil: montarFunil(candidatos),
        porVaga: contarCandidatosPorVaga(vagas, candidatos, VAGAS_NO_GRAFICO),
        faixas: distribuirNotas(candidatos),
        semNota: contarSemNota(candidatos),
    };
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
};

export default function RelatoriosPage() {
    const [dados, setDados] = useState<DadosRelatorio | null>(null);

    useEffect(() => {
        carregarRelatorios().then(setDados);
    }, []);

    // `null` enquanto não montou: evita piscar "0 vagas" antes de ler o storage.
    const carregando = dados === null;
    const { resumo, funil, porVaga, faixas, semNota } =
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

                {carregando ? null : (
                    <>
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
                                        : `${resumo.notaMedia.toFixed(1)}/${NOTA_MAXIMA}`
                                }
                            />
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <FunilStatus etapas={funil} />
                            <CandidatosPorVaga vagas={porVaga} />
                        </div>

                        <DistribuicaoNotas faixas={faixas} semNota={semNota} />
                    </>
                )}
            </div>
        </ScrollArea>
    );
}
