"use client";

import type { ReactNode } from "react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/_components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Rampa ordinal do funil (aguardando → em entrevista → finalizado).
 *
 * As etapas têm ordem com significado, então a cor precisa mostrar essa ordem:
 * um tom só, variando a claridade. Ambos os sentidos foram validados com
 * `scripts/validate_palette.js --ordinal`:
 *
 *   light  #2b7fff → #155dfc → #193cb8   extremo claro a 3.76:1 no branco
 *   dark   #193cb8 → #155dfc → #2b7fff   extremo escuro a 2.01:1 no #18181b
 *
 * Em dark a rampa inverte de propósito: o extremo que precisa recuar contra o
 * fundo troca de lado. Reaproveitar a rampa clara no escuro faria a última etapa
 * sumir na superfície.
 */
export const RAMPA_FUNIL = cn(
    "[--etapa-1:var(--chart-2)] [--etapa-2:var(--chart-3)] [--etapa-3:var(--chart-5)]",
    "dark:[--etapa-1:var(--chart-5)] dark:[--etapa-3:var(--chart-2)]",
);

/**
 * Cor única das barras de série simples. `--chart-2` é o único token do tema que
 * passa de 3:1 contra a superfície nos dois modos (3.76:1 no branco, 4.71:1 no
 * #18181b). Séries de uma cor só não levam legenda — o título já diz o que é.
 */
export const COR_BARRA = "var(--chart-2)";

/**
 * Espaço reservado no topo da área de plotagem para o tooltip caber. O Card tem
 * `overflow-hidden`, então tooltip que sobe além desta folga é cortado —
 * dimensionado para o caso de duas linhas (~40px) mais a margem de 8px.
 */
export const ESPACO_TOOLTIP = "pt-14";

interface CardGraficoProps {
    titulo: string;
    descricao: string;
    /** Linhas da tabela-gêmea: todo valor do gráfico tem que ser alcançável sem cor. */
    tabela: { cabecalho: string[]; linhas: (string | number)[][] };
    vazio?: boolean;
    mensagemVazio?: string;
    children: ReactNode;
}

export function CardGrafico({
    titulo,
    descricao,
    tabela,
    vazio = false,
    mensagemVazio = "Ainda não há dados para este relatório.",
    children,
}: CardGraficoProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{titulo}</CardTitle>
                <CardDescription>{descricao}</CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-5">
                {vazio ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        {mensagemVazio}
                    </p>
                ) : (
                    <>
                        {children}

                        {/* Tabela-gêmea: o tooltip enriquece, mas nunca é o único
                            caminho até o valor. Fecha o caso de leitor de tela,
                            impressão e daltonismo severo. */}
                        <details className="group/tabela">
                            <summary className="w-fit cursor-pointer rounded-md text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30">
                                Ver dados em tabela
                            </summary>
                            <div className="mt-3 overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="text-muted-foreground">
                                        <tr>
                                            {tabela.cabecalho.map(
                                                (coluna, indice) => (
                                                    <th
                                                        key={coluna}
                                                        scope="col"
                                                        className={cn(
                                                            "py-1.5 font-medium",
                                                            indice > 0 &&
                                                                "text-right tabular-nums",
                                                        )}
                                                    >
                                                        {coluna}
                                                    </th>
                                                ),
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tabela.linhas.map((linha) => (
                                            <tr
                                                key={String(linha[0])}
                                                className="border-t border-border"
                                            >
                                                {linha.map((celula, indice) => (
                                                    <td
                                                        key={indice}
                                                        className={cn(
                                                            "py-1.5",
                                                            indice > 0 &&
                                                                "text-right tabular-nums",
                                                        )}
                                                    >
                                                        {celula}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </details>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

/** Tooltip da marca sob o cursor ou sob o foco do teclado. */
export function TooltipMarca({
    visivel,
    children,
}: {
    visivel: boolean;
    children: ReactNode;
}) {
    if (!visivel) return null;

    return (
        <div
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 max-w-40 -translate-x-1/2 rounded-lg bg-popover px-2.5 py-1.5 text-center text-xs leading-tight text-popover-foreground shadow-md ring-1 ring-foreground/10"
        >
            {children}
        </div>
    );
}

/** Legenda. Obrigatória a partir de duas séries: a identidade nunca pode
 *  depender só da cor. */
export function Legenda({
    itens,
}: {
    itens: { chave: string; label: string; cor: string; valor: string }[];
}) {
    return (
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {itens.map((item) => (
                <li key={item.chave} className="flex items-center gap-2">
                    <span
                        aria-hidden
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: item.cor }}
                    />
                    <span className="text-xs text-muted-foreground">
                        {item.label}
                    </span>
                    <span className="text-xs font-medium tabular-nums">
                        {item.valor}
                    </span>
                </li>
            ))}
        </ul>
    );
}
