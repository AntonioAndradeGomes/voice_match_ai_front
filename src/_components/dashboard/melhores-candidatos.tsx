"use client";

import { Trophy } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/_components/ui/card";
import { COR_BARRA } from "@/_components/relatorios/grafico-base";

export interface DestaqueCandidato {
    id: string;
    nome: string;
    vagaId: string;
    vagaTitulo: string;
    nota: number;
}

/** Escala do `score_geral` das entrevistas do backend. */
const NOTA_MAXIMA = 10;

/**
 * Quem se saiu melhor nas entrevistas já concluídas, entre todas as vagas.
 *
 * A barra é uma medida de valor, não decoração: uma nota 9,4 e uma 6,1 são
 * lidas antes do número. Cor única para todas — a ordem já está no ranking, e
 * pintar cada uma de um tom gastaria o canal de identidade recontando o que o
 * comprimento mostra.
 */
export function MelhoresCandidatos({
    destaques,
}: {
    destaques: DestaqueCandidato[];
}) {
    return (
        <Card className="h-full">
            <CardContent className="flex h-full flex-col gap-3">
                <div className="flex items-center gap-2">
                    <Trophy className="size-4 text-primary" />
                    <h2 className="font-heading text-base font-medium">
                        Melhores avaliações
                    </h2>
                </div>

                {destaques.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-6 text-center">
                        <span className="text-sm font-medium">
                            Nenhuma entrevista avaliada
                        </span>
                        <span className="max-w-xs text-xs text-muted-foreground">
                            Assim que a Iris concluir as primeiras entrevistas,
                            os destaques aparecem aqui.
                        </span>
                    </div>
                ) : (
                    <ol className="flex flex-col gap-2.5">
                        {destaques.map((destaque, indice) => {
                            // Iniciais como avatar, o mesmo idioma do Banco de
                            // Talentos: sem foto no backend, o círculo com
                            // letras dá rosto à linha sem inventar imagem.
                            const iniciais = destaque.nome
                                .split(" ")
                                .filter(Boolean)
                                .slice(0, 2)
                                .map(
                                    (parte) =>
                                        parte[0]?.toLocaleUpperCase("pt-BR") ??
                                        "",
                                )
                                .join("");

                            return (
                            <li key={destaque.id}>
                                <Link
                                    href={`/vagas/${destaque.vagaId}`}
                                    className="flex items-center gap-3 rounded-xl p-1.5 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30"
                                >
                                    <span className="w-4 shrink-0 text-center text-xs font-medium tabular-nums text-muted-foreground">
                                        {indice + 1}
                                    </span>
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                                        {iniciais}
                                    </span>

                                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                                        <span className="flex items-baseline justify-between gap-2">
                                            <span className="truncate text-sm font-medium">
                                                {destaque.nome}
                                            </span>
                                            <span className="shrink-0 font-heading text-sm font-semibold">
                                                {destaque.nota.toFixed(1)}
                                            </span>
                                        </span>

                                        {/* Trilho + preenchimento: a barra é
                                            fina e a ponta arredondada só no fim
                                            do dado, como nos demais gráficos. */}
                                        <span className="block h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                            <span
                                                className="block h-full rounded-r-full"
                                                style={{
                                                    width: `${(destaque.nota / NOTA_MAXIMA) * 100}%`,
                                                    background: COR_BARRA,
                                                }}
                                            />
                                        </span>

                                        <span className="truncate text-xs text-muted-foreground">
                                            {destaque.vagaTitulo}
                                        </span>
                                    </span>
                                </Link>
                            </li>
                            );
                        })}
                    </ol>
                )}
            </CardContent>
        </Card>
    );
}
