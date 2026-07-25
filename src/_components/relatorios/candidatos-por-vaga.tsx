"use client";

import { useState } from "react";

import {
    CardGrafico,
    COR_BARRA,
    ESPACO_TOOLTIP,
    TooltipMarca,
} from "@/_components/relatorios/grafico-base";
import type { TotalPorVaga } from "@/lib/relatorios";
import { cn } from "@/lib/utils";

/**
 * Volume de candidatos por vaga. Categorias nominais (nomes de vaga não têm
 * ordem natural), então todas as barras usam a MESMA cor: o comprimento já
 * codifica a magnitude, e pintar cada barra de um tom diferente gastaria o canal
 * de identidade recontando o que a barra já mostra.
 *
 * Horizontal porque títulos de vaga são longos — na vertical o rótulo giraria.
 */
export function CandidatosPorVaga({ vagas }: { vagas: TotalPorVaga[] }) {
    const [ativo, setAtivo] = useState<string | null>(null);

    const totalGeral = vagas.reduce((soma, vaga) => soma + vaga.total, 0);
    // Escala pelo maior valor, não pelo total: barra curta demais some.
    const maior = Math.max(...vagas.map((vaga) => vaga.total), 1);

    return (
        <CardGrafico
            titulo="Candidatos por vaga"
            descricao="Onde está concentrado o volume de inscrições."
            vazio={vagas.length === 0}
            mensagemVazio="Nenhuma vaga cadastrada ainda."
            tabela={{
                cabecalho: ["Vaga", "Candidatos"],
                linhas: vagas.map((vaga) => [vaga.titulo, vaga.total]),
            }}
        >
            <div className={cn("flex flex-col gap-2.5", ESPACO_TOOLTIP)}>
                {vagas.map((vaga) => {
                    const focado = ativo === vaga.vagaId;
                    const fatia = totalGeral ? vaga.total / totalGeral : 0;

                    return (
                        <div
                            key={vaga.vagaId}
                            className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                            tabIndex={0}
                            onFocus={() => setAtivo(vaga.vagaId)}
                            onBlur={() => setAtivo(null)}
                            onMouseEnter={() => setAtivo(vaga.vagaId)}
                            onMouseLeave={() => setAtivo(null)}
                        >
                            <span
                                className="truncate text-xs text-muted-foreground"
                                title={vaga.titulo}
                            >
                                {vaga.titulo}
                            </span>

                            <div className="relative h-5">
                                {/* Cresce da linha de base à esquerda: ponta
                                    arredondada só no fim do dado. */}
                                <div
                                    className="h-full rounded-r-sm transition-opacity"
                                    style={{
                                        width: `${Math.max((vaga.total / maior) * 100, vaga.total > 0 ? 1.5 : 0)}%`,
                                        background: COR_BARRA,
                                        opacity: ativo && !focado ? 0.55 : 1,
                                    }}
                                />
                                <TooltipMarca visivel={focado}>
                                    <span className="font-medium">
                                        {vaga.titulo}
                                    </span>
                                    <br />
                                    {Math.round(fatia * 100)}% do total
                                </TooltipMarca>
                            </div>

                            {/* Rótulo direto na ponta: o valor nunca depende do
                                tooltip para ser lido. */}
                            <span className="text-xs font-medium tabular-nums">
                                {vaga.total}
                            </span>
                        </div>
                    );
                })}
            </div>
        </CardGrafico>
    );
}
