"use client";

import { useState } from "react";

import {
    CardGrafico,
    COR_BARRA,
    ESPACO_TOOLTIP,
    TooltipMarca,
} from "@/_components/relatorios/grafico-base";
import { NOTA_MAXIMA, type FaixaDeNota } from "@/lib/relatorios";
import { cn } from "@/lib/utils";

/**
 * Histograma das notas finais. As faixas já estão ordenadas no eixo X, então a
 * cor não precisa repetir essa ordem — uma cor só para todas as colunas.
 *
 * A altura do card cresce com o conteúdo (plotagem + faixa do eixo), em vez de
 * ser fixa: eixo cortado é o jeito clássico de nascer um scroll interno feio.
 */
export function DistribuicaoNotas({
    faixas,
    semNota,
}: {
    faixas: FaixaDeNota[];
    semNota: number;
}) {
    const [ativa, setAtiva] = useState<string | null>(null);

    const avaliados = faixas.reduce((soma, faixa) => soma + faixa.total, 0);
    const maior = Math.max(...faixas.map((faixa) => faixa.total), 1);

    return (
        <CardGrafico
            titulo="Distribuição das notas finais"
            descricao={`Notas dos candidatos já avaliados, em faixas de 0 a ${NOTA_MAXIMA}.`}
            vazio={avaliados === 0}
            mensagemVazio="Nenhum candidato foi avaliado ainda — as notas aparecem aqui quando as entrevistas forem concluídas."
            tabela={{
                cabecalho: ["Faixa de nota", "Candidatos"],
                linhas: faixas.map((faixa) => [faixa.label, faixa.total]),
            }}
        >
            <div className={cn("flex flex-col gap-2", ESPACO_TOOLTIP)}>
                <div className="flex items-end gap-2">
                    {faixas.map((faixa) => {
                        const focada = ativa === faixa.label;

                        return (
                            <div
                                key={faixa.label}
                                className="flex flex-1 flex-col items-center gap-1.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                                tabIndex={0}
                                onFocus={() => setAtiva(faixa.label)}
                                onBlur={() => setAtiva(null)}
                                onMouseEnter={() => setAtiva(faixa.label)}
                                onMouseLeave={() => setAtiva(null)}
                            >
                                {/* Valor na tampa da coluna. */}
                                <span className="text-xs font-medium tabular-nums">
                                    {faixa.total}
                                </span>

                                <div className="relative flex h-32 w-full items-end justify-center">
                                    <div
                                        className="w-full max-w-6 rounded-t-sm transition-opacity"
                                        style={{
                                            height: `${Math.max((faixa.total / maior) * 100, faixa.total > 0 ? 2 : 0)}%`,
                                            background: COR_BARRA,
                                            opacity:
                                                ativa && !focada ? 0.55 : 1,
                                        }}
                                    />
                                    <TooltipMarca visivel={focada}>
                                        <span className="font-medium">
                                            Nota {faixa.label}
                                        </span>
                                        <br />
                                        {faixa.total} de {avaliados} avaliados
                                    </TooltipMarca>
                                </div>

                                {/* Faixa do eixo X dentro do fluxo: o card cresce
                                    para caber, nunca corta. */}
                                <span className="text-xs tabular-nums text-muted-foreground">
                                    {faixa.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {semNota > 0 && (
                    <p className="text-xs text-muted-foreground">
                        {semNota}{" "}
                        {semNota === 1
                            ? "candidato ainda sem nota"
                            : "candidatos ainda sem nota"}{" "}
                        — fora deste gráfico.
                    </p>
                )}
            </div>
        </CardGrafico>
    );
}
