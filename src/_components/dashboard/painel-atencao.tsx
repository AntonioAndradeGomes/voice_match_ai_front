"use client";

import {
    ArrowRight,
    BriefcaseBusiness,
    CircleCheck,
    Clock3,
    MicVocal,
    TriangleAlert,
    type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/_components/ui/card";
import { cn } from "@/lib/utils";

/**
 * A pergunta que uma tela inicial responde não é "como foi o trimestre" — essa
 * é a dos Relatórios. É "o que espera por mim agora". Cada linha aqui é uma
 * pilha de trabalho parado, com o caminho para resolvê-la.
 */
export interface ItemAtencao {
    chave: string;
    icone: LucideIcon;
    titulo: string;
    descricao: string;
    total: number;
    href: string;
    /** `true` pinta em tom de alerta: algo quebrou, não é só fila. */
    alerta?: boolean;
}

export function PainelAtencao({ itens }: { itens: ItemAtencao[] }) {
    const pendentes = itens.filter((item) => item.total > 0);

    return (
        <Card className="h-full">
            <CardContent className="flex h-full flex-col gap-3">
                <div className="flex items-baseline justify-between gap-3">
                    <h2 className="font-heading text-base font-medium">
                        Precisa da sua atenção
                    </h2>
                    {pendentes.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                            {pendentes.length}{" "}
                            {pendentes.length === 1 ? "item" : "itens"}
                        </span>
                    )}
                </div>

                {pendentes.length === 0 ? (
                    // O estado vazio aqui é uma boa notícia, e deve parecer uma.
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
                        <CircleCheck className="size-7 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-medium">
                            Nada parado por aqui
                        </span>
                        <span className="max-w-xs text-xs text-muted-foreground">
                            Nenhuma triagem pendente, nenhuma falha e nenhuma
                            vaga sem candidatos.
                        </span>
                    </div>
                ) : (
                    <ul className="flex flex-col gap-1.5">
                        {pendentes.map((item) => {
                            const Icone = item.icone;

                            return (
                                <li key={item.chave}>
                                    <Link
                                        href={item.href}
                                        className="group/item flex items-center gap-3 rounded-xl p-2 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30"
                                    >
                                        <span
                                            className={cn(
                                                "flex size-9 shrink-0 items-center justify-center rounded-xl",
                                                item.alerta
                                                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                                    : "bg-primary/10 text-primary",
                                            )}
                                        >
                                            <Icone className="size-4" />
                                        </span>

                                        <span className="flex min-w-0 flex-1 flex-col">
                                            <span className="text-sm font-medium">
                                                {item.titulo}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {item.descricao}
                                            </span>
                                        </span>

                                        {/* Número com figuras proporcionais: é
                                            um valor solto, não coluna de tabela. */}
                                        <span className="font-heading text-lg font-semibold">
                                            {item.total}
                                        </span>
                                        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/item:translate-x-0.5" />
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

export const ICONES_ATENCAO = {
    triagemPendente: Clock3,
    triagemFalhou: TriangleAlert,
    emEntrevista: MicVocal,
    vagaSemCandidato: BriefcaseBusiness,
} as const;
