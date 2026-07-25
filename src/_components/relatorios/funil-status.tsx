"use client";

import { useState } from "react";

import {
    CardGrafico,
    ESPACO_TOOLTIP,
    Legenda,
    RAMPA_FUNIL,
    TooltipMarca,
} from "@/_components/relatorios/grafico-base";
import type { EtapaFunil } from "@/lib/relatorios";
import { cn } from "@/lib/utils";

function percentual(fracao: number) {
    return `${Math.round(fracao * 100)}%`;
}

/**
 * Distribuição dos candidatos pelas etapas do funil — parte-sobre-todo, então
 * uma barra empilhada horizontal em vez de três barras soltas.
 *
 * Os segmentos não levam rótulo interno: um segmento estreito cortaria o texto,
 * e cortar rótulo é pior do que não ter. Quem carrega os valores é a legenda
 * (sempre presente, são 3 séries), o tooltip e a tabela.
 */
export function FunilStatus({ etapas }: { etapas: EtapaFunil[] }) {
    const [ativo, setAtivo] = useState<string | null>(null);

    const total = etapas.reduce((soma, etapa) => soma + etapa.total, 0);
    // Segmento de largura zero não vira marca — só polui o gap.
    const comCandidatos = etapas.filter((etapa) => etapa.total > 0);

    return (
        <CardGrafico
            titulo="Funil de candidatos"
            descricao="Como os candidatos se distribuem entre as etapas do processo."
            vazio={total === 0}
            mensagemVazio="Nenhum candidato cadastrado ainda."
            tabela={{
                cabecalho: ["Etapa", "Candidatos", "Participação"],
                linhas: etapas.map((etapa) => [
                    etapa.label,
                    etapa.total,
                    percentual(etapa.fracao),
                ]),
            }}
        >
            <div className={cn(RAMPA_FUNIL, "flex flex-col gap-4")}>
                <div className={cn("relative", ESPACO_TOOLTIP)}>
                    {/* gap-0.5 = os 2px de superfície que separam os segmentos.
                        A separação é o vão, nunca uma borda desenhada. */}
                    <div className="flex h-6 gap-0.5 overflow-hidden rounded">
                        {comCandidatos.map((etapa) => {
                            const indice = etapas.indexOf(etapa) + 1;
                            const focado = ativo === etapa.status;

                            return (
                                <div
                                    key={etapa.status}
                                    className="relative min-w-1 rounded-[3px] outline-none transition-opacity focus-visible:ring-3 focus-visible:ring-ring/30"
                                    style={{
                                        flexGrow: etapa.total,
                                        flexBasis: 0,
                                        background: `var(--etapa-${indice})`,
                                        opacity: ativo && !focado ? 0.55 : 1,
                                    }}
                                    tabIndex={0}
                                    // Teclado enxerga o mesmo que o mouse.
                                    onFocus={() => setAtivo(etapa.status)}
                                    onBlur={() => setAtivo(null)}
                                    onMouseEnter={() => setAtivo(etapa.status)}
                                    onMouseLeave={() => setAtivo(null)}
                                >
                                    <span className="sr-only">
                                        {etapa.label}: {etapa.total} candidatos,{" "}
                                        {percentual(etapa.fracao)} do total
                                    </span>
                                    <TooltipMarca visivel={focado}>
                                        <span className="font-medium">
                                            {etapa.label}
                                        </span>
                                        <br />
                                        {etapa.total}{" "}
                                        {etapa.total === 1
                                            ? "candidato"
                                            : "candidatos"}{" "}
                                        · {percentual(etapa.fracao)}
                                    </TooltipMarca>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <Legenda
                    itens={etapas.map((etapa, indice) => ({
                        chave: etapa.status,
                        label: etapa.label,
                        cor: `var(--etapa-${indice + 1})`,
                        valor: `${etapa.total} · ${percentual(etapa.fracao)}`,
                    }))}
                />
            </div>
        </CardGrafico>
    );
}
